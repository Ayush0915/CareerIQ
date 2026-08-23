#!/usr/bin/env python3
"""Compare candidate models on the evaluation set.

This is the tool that replaces "switch models until one returns parseable
output". It reports the metric that actually decides the choice — how often the
model returns schema-conformant JSON — alongside how well its scores track
human relevance grades.

    python evals/bakeoff.py --models deepseek/deepseek-chat google/gemini-flash-1.5
    python evals/bakeoff.py --models MODEL_A MODEL_B --limit 6 --json
"""
from __future__ import annotations

import argparse
import asyncio
import json
import sys
import time
from pathlib import Path
from typing import Dict, List

sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))
sys.path.insert(0, str(Path(__file__).parent.parent))

from evals import metrics  # noqa: E402
from evals.dataset import EvalCase, load_cases  # noqa: E402


async def run_model(model: str, cases: List[EvalCase], limit: int) -> Dict:
    from core import llm
    from services.llm_evaluator import build_prompt
    from models.schemas import LLMEvaluation

    conformant = 0
    failures: List[str] = []
    latencies: List[float] = []
    scores: List[float] = []
    grades: List[int] = []

    pairs = [
        (case, candidate)
        for case in cases
        for candidate in case.candidates
    ][:limit]

    for case, candidate in pairs:
        started = time.perf_counter()
        try:
            result = await llm.complete_json(
                build_prompt(candidate.resume_text, case.jd_text),
                LLMEvaluation,
                models=[model],
                max_tokens=2000,
                schema_name="resume_evaluation",
            )
            latencies.append(time.perf_counter() - started)
            conformant += 1
            scores.append(result.overall_score)
            grades.append(candidate.relevance)
        except Exception as exc:
            failures.append(f"{case.id}/{candidate.id}: {type(exc).__name__}: {exc}"[:160])

    total = len(pairs)
    return {
        "model": model,
        "calls": total,
        "schema_conformance_rate": round(conformant / total, 4) if total else 0.0,
        "failures": len(failures),
        "failure_samples": failures[:3],
        "median_latency_s": round(sorted(latencies)[len(latencies) // 2], 2) if latencies else None,
        "spearman_vs_human": round(metrics.spearman(scores, grades), 4),
        "mean_score": round(metrics.mean(scores), 2) if scores else None,
    }


def render(results: List[Dict]) -> str:
    lines = ["", "Model bake-off", "=" * 78, ""]
    header = f"{'MODEL':<38} {'CONFORM':>8} {'FAILS':>6} {'LAT s':>7} {'SPEARMAN':>9}"
    lines.append(header)
    lines.append("-" * 78)

    for row in sorted(results, key=lambda r: (-r["schema_conformance_rate"], -r["spearman_vs_human"])):
        latency = f"{row['median_latency_s']:.2f}" if row["median_latency_s"] else "  —"
        lines.append(
            f"{row['model']:<38} "
            f"{row['schema_conformance_rate']:>7.1%} "
            f"{row['failures']:>6} "
            f"{latency:>7} "
            f"{row['spearman_vs_human']:>9.3f}"
        )

    lines += [
        "",
        "  CONFORM  — share of calls returning schema-valid JSON. Anything below",
        "             100% means the model is unreliable for this workload, no",
        "             matter how good its reasoning benchmarks look.",
        "  SPEARMAN — how well the model's overall_score tracks the human",
        "             relevance grades. Negative means it disagrees with you.",
        "",
    ]

    for row in results:
        if row["failure_samples"]:
            lines.append(f"  {row['model']} failures:")
            lines += [f"    {sample}" for sample in row["failure_samples"]]
            lines.append("")

    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--models", nargs="+", required=True, help="OpenRouter model IDs")
    parser.add_argument("--limit", type=int, default=8, help="candidates per model")
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()

    from core import llm

    if not llm.is_configured():
        print("OPENROUTER_API_KEY is not set — cannot run a bake-off.", file=sys.stderr)
        return 1

    cases = load_cases()
    results = [asyncio.run(run_model(model, cases, args.limit)) for model in args.models]

    print(json.dumps(results, indent=2) if args.json else render(results))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
