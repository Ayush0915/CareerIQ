"""LLM access layer.

OpenRouter is OpenAI-compatible, so this module is a thin wrapper over the
official async client.  It exists so that a provider change is a config edit
rather than a refactor — the previous code constructed a Groq client at import
time in two separate modules and recovered JSON by scraping ``{.*}`` out of
prose with a regex.

Three things here are load-bearing:

* ``response_format`` with a JSON schema and ``strict: true`` makes the model
  emit conforming JSON instead of prose that happens to contain JSON.
* ``provider.require_parameters`` restricts routing to endpoints that actually
  enforce the schema.  OpenRouter serves the same model through several
  providers and only some honour it; without this flag a request can be
  silently routed to one that treats the schema as a suggestion.
* ``models`` supplies model-level fallback.  The previous implementation set
  PRIMARY_MODEL and FALLBACK_MODEL to the same string, so the "fallback" only
  doubled the retry count.
"""
from __future__ import annotations

import asyncio
import json
import logging
from typing import Any, Dict, List, Optional, Type, TypeVar

from openai import AsyncOpenAI, APIError, APITimeoutError, RateLimitError
from pydantic import BaseModel, ValidationError

from core.config import settings

logger = logging.getLogger(__name__)

TModel = TypeVar("TModel", bound=BaseModel)

RETRYABLE = (APITimeoutError, RateLimitError, APIError)


class LLMError(RuntimeError):
    """Raised when every model and retry has been exhausted."""


# ── Client ────────────────────────────────────────────────────────────────────

_client: Optional[AsyncOpenAI] = None


def get_client() -> AsyncOpenAI:
    """Lazily construct the shared async client.

    Lazy on purpose: building it at import time meant the whole application
    failed to import when the key was absent, which broke tests and any
    deterministic-only use of the analysis pipeline.
    """
    global _client
    if _client is None:
        _client = AsyncOpenAI(
            base_url=settings.openrouter_base_url,
            api_key=settings.llm_api_key or "missing-key",
            timeout=settings.llm_timeout_s,
            max_retries=0,  # retries are handled here so fallback can interleave
        )
    return _client


def _headers() -> Dict[str, str]:
    """OpenRouter attribution headers — optional, but they identify the app
    on the account's activity page."""
    return {
        "HTTP-Referer": settings.app_url,
        "X-Title": settings.app_name,
    }


def is_configured() -> bool:
    return bool(settings.llm_api_key)


# ── Strict JSON schema ────────────────────────────────────────────────────────

def to_strict_schema(model: Type[BaseModel]) -> Dict[str, Any]:
    """Convert a Pydantic model into a schema strict mode will accept.

    Strict mode requires every object to declare ``additionalProperties: false``
    and to list every property in ``required``.  Nested ``$ref``/``$defs`` are
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
        # (Dict[str, str] -> additionalProperties: {...}) must be left alone,
        # or it would be turned into an object that permits nothing.
        if "properties" in out:
            out["type"] = "object"
            out["additionalProperties"] = False
            out["required"] = list(out["properties"].keys())

        # Defaults are meaningless to a generator and confuse some validators.
        out.pop("default", None)
        return out

    return resolve(raw)


# ── Core call ─────────────────────────────────────────────────────────────────

async def _chat(
    prompt: str,
    *,
    models: List[str],
    max_tokens: int,
    temperature: float,
    response_format: Optional[Dict[str, Any]] = None,
) -> str:
    """One completion, retried across attempts with model-level fallback."""
    if not is_configured():
        raise LLMError(
            "No LLM API key configured. Set OPENROUTER_API_KEY in backend/.env "
            "(get one at https://openrouter.ai/keys)."
        )

    client = get_client()
    primary, *fallbacks = models

    body: Dict[str, Any] = {
        "model": primary,
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": max_tokens,
        "temperature": temperature,
        "extra_headers": _headers(),
        "extra_body": {
            # Model-level fallback: tried in order when every provider for the
            # primary fails, on context-length errors, or on moderation flags.
            "models": fallbacks,
            "provider": {
                # Only route to endpoints supporting the parameters we sent —
                # notably structured outputs.
                "require_parameters": True,
            },
        },
    }
    if response_format is not None:
        body["response_format"] = response_format

    last_error: Optional[Exception] = None

    for attempt in range(settings.llm_max_retries):
        try:
            response = await client.chat.completions.create(**body)
            content = (response.choices[0].message.content or "").strip()
            if content:
                served_by = getattr(response, "model", primary)
                logger.info("LLM ok via %s (attempt %d)", served_by, attempt + 1)
                return content
            last_error = LLMError("Model returned an empty completion")
        except RETRYABLE as exc:
            last_error = exc
            logger.warning(
                "LLM attempt %d/%d failed: %s",
                attempt + 1,
                settings.llm_max_retries,
                exc,
            )
        except Exception as exc:  # noqa: BLE001 - surfaced below
            last_error = exc
            logger.warning("LLM attempt %d failed: %s", attempt + 1, exc)

        if attempt < settings.llm_max_retries - 1:
            await asyncio.sleep(settings.llm_retry_backoff_s * (2**attempt))

    raise LLMError(f"All LLM attempts failed: {last_error}") from last_error


# ── Public API ────────────────────────────────────────────────────────────────

async def complete_text(
    prompt: str,
    *,
    max_tokens: int = 600,
    temperature: float = 0.3,
    models: Optional[List[str]] = None,
) -> str:
    """Free-form completion, used for the coaching features."""
    return await _chat(
        prompt,
        models=models or settings.fast_model_chain,
        max_tokens=max_tokens,
        temperature=temperature,
    )


async def complete_json(
    prompt: str,
    schema_model: Type[TModel],
    *,
    max_tokens: int = 2000,
    temperature: float = 0.1,
    models: Optional[List[str]] = None,
    schema_name: Optional[str] = None,
) -> TModel:
    """Schema-constrained completion parsed into ``schema_model``.

    Raises :class:`LLMError` rather than returning a zero-filled object, so the
    caller decides what a failure means.  The old code silently returned an
    all-zeros evaluation that was indistinguishable from a genuine low score.
    """
    response_format = {
        "type": "json_schema",
        "json_schema": {
            "name": schema_name or schema_model.__name__,
            "strict": True,
            "schema": to_strict_schema(schema_model),
        },
    }

    raw = await _chat(
        prompt,
        models=models or settings.model_chain,
        max_tokens=max_tokens,
        temperature=temperature,
        response_format=response_format,
    )

    try:
        return schema_model.model_validate_json(raw)
    except ValidationError as exc:
        # A conforming provider should make this unreachable. Retry once
        # through a permissive parse before giving up, so a stray code fence
        # does not lose an otherwise good response.
        try:
            cleaned = raw.strip().removeprefix("```json").removeprefix("```").removesuffix("```")
            return schema_model.model_validate(json.loads(cleaned))
        except Exception:
            raise LLMError(f"Response did not match {schema_model.__name__}: {exc}") from exc
