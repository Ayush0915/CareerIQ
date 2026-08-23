"""LLM access layer.

OpenRouter is OpenAI-compatible, so this is a thin wrapper over the official
async client.  It exists so a provider change is a config edit rather than a
refactor.

## Why there is a degradation ladder

Schema-enforced output is the right way to get JSON out of a model, but on the
free tier it is mostly unavailable — at the time of writing only one of the
sixteen free OpenRouter models advertises ``structured_outputs``, and that one
is scheduled for retirement.  So this module negotiates downwards:

  1. ``strict``       — ``response_format: json_schema`` with ``strict: true``
                        plus ``provider.require_parameters`` so requests only
                        reach endpoints that actually enforce the schema.
  2. ``json_object``  — the model is told to emit JSON and the schema is
                        described in the prompt.  Not enforced, so the result
                        is validated and one repair attempt is made with the
                        validation error fed back.
  3. ``prompt``       — no response_format at all; schema in the prompt,
                        extract the first JSON object, validate, repair once.

Whatever works for a given model is remembered, so the ladder is walked once
per model per process rather than on every call.
"""
from __future__ import annotations

import asyncio
import json
import logging
import re
from typing import Any, TypeVar

from openai import APIError, APITimeoutError, AsyncOpenAI, RateLimitError
from pydantic import BaseModel, ValidationError

from core.config import settings

logger = logging.getLogger(__name__)

TModel = TypeVar("TModel", bound=BaseModel)

RETRYABLE = (APITimeoutError, RateLimitError, APIError)

STRICT = "strict"
JSON_OBJECT = "json_object"
PROMPT = "prompt"
LADDER: tuple[str, ...] = (STRICT, JSON_OBJECT, PROMPT)

# Remembers the first mode that worked for a model, so the ladder is not
# re-walked on every request.
_mode_cache: dict[str, str] = {}

# Substrings that mean "this endpoint will not do structured output for you"
# rather than "something transient went wrong".
_UNSUPPORTED_MARKERS = (
    "response_format",
    "json_schema",
    "structured output",
    "no endpoints found",
    "not support",
    "unsupported",
    "require_parameters",
)


class LLMError(RuntimeError):
    """Raised when every model, mode and retry has been exhausted."""


class LLMPolicyError(LLMError):
    """The account's privacy settings filtered out every endpoint.

    Distinct from a capability mismatch: no amount of degrading the output mode
    helps, because there is no endpoint to talk to at all. Failing fast with an
    actionable message beats walking the whole ladder to arrive at the same
    404 three times.
    """


# OpenRouter returns 404 with this shape when data-policy settings leave zero
# eligible endpoints — most commonly on free models, which require consenting
# to providers that may train on and publish request data.
_POLICY_MARKERS = (
    "data policy",
    "guardrail restrictions",
    "settings/privacy",
)

POLICY_HELP = (
    "No endpoints matched your OpenRouter privacy settings.\n"
    "Free models require enabling both of these at "
    "https://openrouter.ai/settings/privacy :\n"
    "  - Free endpoints that may train on request data\n"
    "  - Free endpoints that may publish prompts\n"
    "Those providers may train on, and may publish, what you send them. "
    "Resume text is redacted before it leaves this process (see core/redact.py), "
    "but if that trade is unacceptable, add credit and use paid endpoints instead."
)


def _looks_like_policy_block(error: Exception) -> bool:
    text = str(error).lower()
    return any(marker in text for marker in _POLICY_MARKERS)


# ── Client ────────────────────────────────────────────────────────────────────

_client: AsyncOpenAI | None = None


def get_client() -> AsyncOpenAI:
    """Lazily construct the shared async client.

    Lazy on purpose: building it at import time meant the whole application
    failed to import without a key, which broke tests and any deterministic-only
    use of the analysis pipeline.
    """
    global _client
    if _client is None:
        _client = AsyncOpenAI(
            base_url=settings.openrouter_base_url,
            api_key=settings.llm_api_key or "missing-key",
            timeout=settings.llm_timeout_s,
            max_retries=0,  # handled here so mode degradation can interleave
        )
    return _client


def reset_client() -> None:
    """Drop the cached client and mode map (used by tests)."""
    global _client
    _client = None
    _mode_cache.clear()


def _headers() -> dict[str, str]:
    return {"HTTP-Referer": settings.app_url, "X-Title": settings.app_name}


def is_configured() -> bool:
    return bool(settings.llm_api_key)


def _looks_unsupported(error: Exception) -> bool:
    text = str(error).lower()
    return any(marker in text for marker in _UNSUPPORTED_MARKERS)


# ── Strict JSON schema ────────────────────────────────────────────────────────

def to_strict_schema(model: type[BaseModel]) -> dict[str, Any]:
    """Convert a Pydantic model into a schema strict mode will accept.

    Strict mode requires every object to declare ``additionalProperties: false``
    and list every property in ``required``.  Nested ``$ref``/``$defs`` are
    inlined because provider support for references is inconsistent.
    """
    raw = model.model_json_schema()
    defs = raw.pop("$defs", {})

    def resolve(node: Any, depth: int = 0) -> Any:
        if depth > 12:  # guard against a recursive model definition
            return {"type": "object"}

        if isinstance(node, list):
            return [resolve(item, depth + 1) for item in node]
        if not isinstance(node, dict):
            return node

        if "$ref" in node:
            name = node["$ref"].rsplit("/", 1)[-1]
            target = defs.get(name)
            if target is None:
                return {"type": "object"}
            merged = {k: v for k, v in node.items() if k != "$ref"}
            return resolve({**target, **merged}, depth + 1)

        out = {key: resolve(value, depth + 1) for key, value in node.items()}

        # Only close objects that declare named properties.  An open map
        # (Dict[str, str] -> additionalProperties: {...}) must be left alone or
        # it becomes an object that permits nothing.
        if "properties" in out:
            out["type"] = "object"
            out["additionalProperties"] = False
            out["required"] = list(out["properties"].keys())

        out.pop("default", None)
        return out

    return resolve(raw)


def describe_schema(model: type[BaseModel]) -> str:
    """Prompt-embeddable schema description, for the degraded modes."""
    return json.dumps(to_strict_schema(model), indent=2)


def extract_json(raw: str) -> str:
    """Pull the first JSON object out of a response.

    Only used on the degraded rungs — when the provider enforces the schema
    this is dead code, which is the point.
    """
    text = raw.strip()
    text = re.sub(r"<think>[\s\S]*?</think>", "", text, flags=re.IGNORECASE).strip()
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)

    if text.startswith("{"):
        return text

    depth, start = 0, None
    for index, char in enumerate(text):
        if char == "{":
            if depth == 0:
                start = index
            depth += 1
        elif char == "}":
            depth -= 1
            if depth == 0 and start is not None:
                return text[start : index + 1]
    return text


# ── Core call ─────────────────────────────────────────────────────────────────

def _build_body(
    prompt: str,
    models: list[str],
    max_tokens: int,
    temperature: float,
    response_format: dict[str, Any] | None,
    require_parameters: bool,
) -> dict[str, Any]:
    primary, *fallbacks = models
    extra_body: dict[str, Any] = {}

    if fallbacks:
        # Model-level fallback: tried in order when every provider for the
        # primary fails, on context-length errors, or on moderation flags.
        extra_body["models"] = fallbacks
    if require_parameters:
        extra_body["provider"] = {"require_parameters": True}

    body: dict[str, Any] = {
        "model": primary,
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": max_tokens,
        "temperature": temperature,
        "extra_headers": _headers(),
    }
    if extra_body:
        body["extra_body"] = extra_body
    if response_format is not None:
        body["response_format"] = response_format
    return body


async def _send(body: dict[str, Any]) -> str:
    client = get_client()
    last_error: Exception | None = None

    for attempt in range(settings.llm_max_retries):
        try:
            response = await client.chat.completions.create(**body)
            content = (response.choices[0].message.content or "").strip()
            if content:
                logger.info("LLM ok via %s", getattr(response, "model", body["model"]))
                return content
            last_error = LLMError("Model returned an empty completion")
        except RETRYABLE as exc:
            last_error = exc
            if _looks_like_policy_block(exc):
                raise LLMPolicyError(POLICY_HELP) from exc
            if _looks_unsupported(exc):
                raise  # do not burn retries on a capability mismatch
            logger.warning(
                "LLM attempt %d/%d failed: %s", attempt + 1, settings.llm_max_retries, exc
            )
        except Exception as exc:  # noqa: BLE001
            last_error = exc
            if _looks_like_policy_block(exc):
                raise LLMPolicyError(POLICY_HELP) from exc
            if _looks_unsupported(exc):
                raise
            logger.warning("LLM attempt %d failed: %s", attempt + 1, exc)

        if attempt < settings.llm_max_retries - 1:
            await asyncio.sleep(settings.llm_retry_backoff_s * (2**attempt))

    raise LLMError(f"All LLM attempts failed: {last_error}") from last_error


async def complete_text(
    prompt: str,
    *,
    max_tokens: int = 600,
    temperature: float = 0.3,
    models: list[str] | None = None,
) -> str:
    """Free-form completion, used for the coaching features."""
    if not is_configured():
        raise LLMError(
            "No LLM API key configured. Set OPENROUTER_API_KEY in backend/.env "
            "(free key at https://openrouter.ai/keys)."
        )
    chain = models or settings.fast_model_chain
    return await _send(_build_body(prompt, chain, max_tokens, temperature, None, False))


def _modes_to_try(model: str) -> tuple[str, ...]:
    configured = settings.structured_output_mode
    if configured != "auto":
        return (configured,)
    remembered = _mode_cache.get(model)
    if remembered:
        # Start from what worked before, but keep the lower rungs available.
        index = LADDER.index(remembered)
        return LADDER[index:]
    return LADDER


async def complete_json(
    prompt: str,
    schema_model: type[TModel],
    *,
    max_tokens: int = 2000,
    temperature: float = 0.1,
    models: list[str] | None = None,
    schema_name: str | None = None,
) -> TModel:
    """Completion parsed into ``schema_model``, negotiating output mode.

    Raises :class:`LLMError` rather than returning a zero-filled object, so the
    caller decides what a failure means.
    """
    if not is_configured():
        raise LLMError(
            "No LLM API key configured. Set OPENROUTER_API_KEY in backend/.env "
            "(free key at https://openrouter.ai/keys)."
        )

    chain = models or settings.model_chain
    primary = chain[0]
    name = schema_name or schema_model.__name__
    schema = to_strict_schema(schema_model)
    last_error: Exception | None = None

    for mode in _modes_to_try(primary):
        if mode == STRICT:
            body_prompt = prompt
            response_format = {
                "type": "json_schema",
                "json_schema": {"name": name, "strict": True, "schema": schema},
            }
            require_parameters = True
        else:
            body_prompt = (
                f"{prompt}\n\n"
                "Return ONLY a single JSON object conforming exactly to this schema. "
                "No prose, no markdown fences, no commentary.\n\n"
                f"{json.dumps(schema, indent=2)}"
            )
            response_format = {"type": "json_object"} if mode == JSON_OBJECT else None
            require_parameters = False

        try:
            raw = await _send(
                _build_body(
                    body_prompt, chain, max_tokens, temperature, response_format, require_parameters
                )
            )
        except LLMPolicyError:
            raise  # degrading cannot conjure an eligible endpoint
        except Exception as exc:  # noqa: BLE001
            last_error = exc
            if _looks_unsupported(exc) and mode != LADDER[-1]:
                logger.info("%s does not support %s output — degrading", primary, mode)
                continue
            if mode != LADDER[-1]:
                continue
            raise LLMError(f"All LLM attempts failed: {exc}") from exc

        parsed = _validate(raw, schema_model)
        if parsed is not None:
            _mode_cache[primary] = mode
            return parsed

        # Valid transport, invalid content — give the model its error back once.
        repaired = await _repair(
            body_prompt, raw, schema_model, chain, max_tokens, response_format, require_parameters
        )
        if repaired is not None:
            _mode_cache[primary] = mode
            return repaired

        last_error = LLMError(f"{primary} did not produce valid {schema_model.__name__}")
        logger.warning("%s returned unusable content in %s mode", primary, mode)

    raise LLMError(f"Could not obtain valid {schema_model.__name__}: {last_error}")


def _validate(raw: str, schema_model: type[TModel]) -> TModel | None:
    for candidate in (raw, extract_json(raw)):
        try:
            return schema_model.model_validate_json(candidate)
        except ValidationError:
            continue
        except Exception:
            continue
    return None


async def _repair(
    prompt: str,
    bad_output: str,
    schema_model: type[TModel],
    chain: list[str],
    max_tokens: int,
    response_format: dict[str, Any] | None,
    require_parameters: bool,
) -> TModel | None:
    """One repair attempt, feeding the validation error back to the model."""
    try:
        schema_model.model_validate_json(extract_json(bad_output))
        return None  # unreachable in practice
    except ValidationError as exc:
        error_text = str(exc)[:800]
    except Exception as exc:  # noqa: BLE001
        error_text = str(exc)[:800]

    repair_prompt = (
        f"{prompt}\n\n"
        "Your previous response could not be parsed. The error was:\n"
        f"{error_text}\n\n"
        "Return the corrected JSON object only."
    )

    try:
        raw = await _send(
            _build_body(repair_prompt, chain, max_tokens, 0.0, response_format, require_parameters)
        )
    except Exception:  # noqa: BLE001
        return None
    return _validate(raw, schema_model)
