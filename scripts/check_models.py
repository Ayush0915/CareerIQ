#!/usr/bin/env python3
"""List OpenRouter models that can actually be used for the evaluation call.

Model IDs change and get deprecated, so hardcoding one and hoping is how the
project ended up switching models four times in four commits.  Run this to see
what is currently available, then set PRIMARY_MODEL and FALLBACK_MODELS in
backend/.env.

    python scripts/check_models.py                  # structured-output models
    python scripts/check_models.py --free           # zero-cost models only
    python scripts/check_models.py --validate       # do my configured IDs exist?
    python scripts/check_models.py --all            # every model
    python scripts/check_models.py --probe MODEL_ID # send a real test request

Selection criteria, in order:
  1. Must support structured outputs — anything else is disqualified for the
     evaluation call, because the whole point is provider-enforced schemas.
  2. Prefer models with several providers, so provider failover has somewhere
     to go.
  3. Choose on schema conformance, not price. At this payload size (~1.5k in,
     ~2k out) the spread between the cheapest and a premium model is a couple
     of dollars a month.
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path
from typing import Any, Dict, List

import httpx

BASE_URL = os.environ.get("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")


def fetch_models() -> List[Dict[str, Any]]:
    response = httpx.get(f"{BASE_URL}/models", timeout=30)
    response.raise_for_status()
    return response.json().get("data", [])


def price_per_million(model: Dict[str, Any], key: str) -> float:
    try:
        return float(model.get("pricing", {}).get(key, 0)) * 1_000_000
    except (TypeError, ValueError):
        return 0.0


def supports_structured(model: Dict[str, Any]) -> bool:
    return "structured_outputs" in (model.get("supported_parameters") or [])


def estimated_cost(model: Dict[str, Any]) -> float:
    """Cost of one evaluation: ~1.5k input tokens, ~2k output."""
    return (price_per_million(model, "prompt") * 0.0015) + (
        price_per_million(model, "completion") * 0.002
    )


def show(models: List[Dict[str, Any]], limit: int) -> None:
    rows = sorted(models, key=estimated_cost)[:limit]

    print(f"\n{'MODEL ID':<48} {'CONTEXT':>9} {'IN $/M':>9} {'OUT $/M':>9} {'PER CALL':>10}")
    print("-" * 90)
    for model in rows:
        print(
            f"{model.get('id', '?'):<48} "
            f"{model.get('context_length', 0):>9,} "
            f"{price_per_million(model, 'prompt'):>9.3f} "
            f"{price_per_million(model, 'completion'):>9.3f} "
            f"{'free' if estimated_cost(model) == 0 else f'${estimated_cost(model):.5f}':>10}"
        )
    print(f"\n{len(rows)} shown of {len(models)} matching.\n")


def _api_key() -> str:
    """Read the key exactly as the application does.

    Reading os.environ directly meant a key sitting in backend/.env was
    invisible to this script, which then reported "not set" while the app
    itself was configured fine.
    """
    try:
        sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))
        from core.config import settings

        return settings.llm_api_key
    except Exception:
        return os.environ.get("OPENROUTER_API_KEY", "")


def probe(model_id: str) -> int:
    """Send one real schema-constrained request and report conformance."""
    api_key = _api_key()
    if not api_key:
        from core.config import ENV_FILES

        print("OPENROUTER_API_KEY is not set.", file=sys.stderr)
        print("Looked in:", file=sys.stderr)
        for path in ENV_FILES:
            marker = "found" if Path(path).exists() else "missing"
            print(f"  {path}  [{marker}]", file=sys.stderr)
        print("...and the process environment.", file=sys.stderr)
        return 1

    schema = {
        "type": "object",
        "additionalProperties": False,
        "required": ["score", "verdict", "reasons"],
        "properties": {
            "score": {"type": "integer"},
            "verdict": {"type": "string"},
            "reasons": {"type": "array", "items": {"type": "string"}},
        },
    }

    print(f"Probing {model_id} ...")
    try:
        response = httpx.post(
            f"{BASE_URL}/chat/completions",
            headers={"Authorization": f"Bearer {api_key}"},
            json={
                "model": model_id,
                "messages": [
                    {
                        "role": "user",
                        "content": "Rate this resume line 0-100: 'Responsible for various tasks.'",
                    }
                ],
                "max_tokens": 300,
                "response_format": {
                    "type": "json_schema",
                    "json_schema": {"name": "probe", "strict": True, "schema": schema},
                },
                "provider": {"require_parameters": True},
            },
            timeout=90,
        )
    except httpx.HTTPError as exc:
        print(f"  request failed: {exc}")
        return 1

    if response.status_code != 200:
        print(f"  HTTP {response.status_code}: {response.text[:300]}")
        return 1

    payload = response.json()
    content = payload["choices"][0]["message"]["content"]
    served_by = payload.get("model", model_id)

    try:
        parsed = json.loads(content)
    except json.JSONDecodeError:
        print(f"  served by {served_by} — NOT valid JSON:\n  {content[:200]}")
        return 1

    missing = [k for k in schema["required"] if k not in parsed]
    if missing:
        print(f"  served by {served_by} — valid JSON but missing {missing}")
        return 1

    print(f"  served by {served_by} — schema conformant ✓")
    print(f"  {json.dumps(parsed, indent=2)[:300]}")
    return 0


def validate_configured() -> int:
    """Check the IDs in settings against the live catalogue.

    A model ID that looks plausible but does not exist fails at the first real
    request with an unhelpful error. Checking them up front turns that into a
    one-line answer.
    """
    sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))
    from core.config import settings

    catalogue = {m["id"]: m for m in fetch_models()}

    key = settings.llm_api_key
    print()
    print(f"API key: {'configured' if key else 'NOT SET — probing will fail'}")

    chains = {
        "PRIMARY_MODEL / FALLBACK_MODELS": settings.model_chain,
        "FAST_PRIMARY_MODEL / FAST_FALLBACK_MODELS": settings.fast_model_chain,
    }

    problems = 0
    print()
    for label, chain in chains.items():
        print(f"{label}")
        for model_id in chain:
            entry = catalogue.get(model_id)
            if entry is None:
                print(f"  ✗ {model_id:<50} DOES NOT EXIST")
                problems += 1
                continue
            cost = estimated_cost(entry)
            tags = []
            tags.append("free" if cost == 0 else f"${cost:.5f}/call")
            tags.append("schema" if supports_structured(entry) else "no schema")
            print(f"  ✓ {model_id:<50} {', '.join(tags)}")
        print()

    if problems:
        print(f"{problems} configured model ID(s) do not exist. Requests using them")
        print("will fail. Fix backend/.env, then re-run this check.\n")
        return 1

    print("All configured model IDs exist.\n")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--all", action="store_true", help="include models without structured outputs")
    parser.add_argument("--free", action="store_true", help="only zero-cost models")
    parser.add_argument("--limit", type=int, default=30)
    parser.add_argument("--probe", metavar="MODEL_ID", help="send one real test request")
    parser.add_argument("--validate", action="store_true", help="check configured IDs exist")
    args = parser.parse_args()

    if args.probe:
        return probe(args.probe)
    if args.validate:
        return validate_configured()

    models = fetch_models()
    if not args.all:
        models = [m for m in models if supports_structured(m)]
    if args.free:
        models = [m for m in models if estimated_cost(m) == 0]

    if not models:
        print("No models matched.", file=sys.stderr)
        return 1

    show(models, args.limit)

    free_total = len([m for m in fetch_models() if estimated_cost(m) == 0])
    free_structured = len(
        [m for m in fetch_models() if estimated_cost(m) == 0 and supports_structured(m)]
    )

    print("Verify a pick with:")
    print("    python scripts/check_models.py --probe <MODEL_ID>\n")
    print(f"Free models available: {free_total}")
    print(f"  ...of which support structured outputs: {free_structured}\n")
    if free_structured == 0:
        print("No free model currently enforces JSON schemas. That is fine —")
        print("core/llm.py degrades to JSON mode and then to prompt-only, and")
        print("validates the result either way. Set STRUCTURED_OUTPUT_MODE=prompt")
        print("to skip the negotiation entirely.\n")
    print("Free tier is ~20 requests/minute and ~200/day, and models can be")
    print("withdrawn without notice — always keep two fallbacks configured.\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
