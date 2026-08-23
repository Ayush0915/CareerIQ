#!/usr/bin/env python3
"""Download the embedding model ahead of time.

Run this as part of the build/deploy step, not at request time. Without it the
first request after a cold start waits for a ~130MB download from HuggingFace
on top of process boot — which is the difference between the "results in ~10s"
promise on the landing page and a minute of silence.

    python scripts/prefetch_model.py

On Render, append it to the build command:

    uv pip install --system -r pyproject.toml && python scripts/prefetch_model.py
"""
from __future__ import annotations

import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))


def main() -> int:
    from services.similarity import EMBEDDING_MODEL, warm_up

    print(f"Fetching {EMBEDDING_MODEL} ...")
    started = time.perf_counter()
    try:
        warm_up()
    except Exception as exc:  # noqa: BLE001
        print(f"  failed: {exc}", file=sys.stderr)
        print("  the app will still start and download on first use", file=sys.stderr)
        return 1

    print(f"  ready in {time.perf_counter() - started:.1f}s")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
