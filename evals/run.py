#!/usr/bin/env python3
"""Produce the scorecard.

This is the number Phase 5 has to beat. Run it before touching the pipeline,
keep the output, and re-run it after every change.

    python evals/run.py                 # deterministic pipeline only, no API key needed
    python evals/run.py --with-llm      # include the LLM evaluation
    python evals/run.py --json          # machine-readable, for diffing runs
"""
from __future__ import annotations

import argparse
import asyncio
import json
import sys
from pathlib import Path
from typing import Dict, List

sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))
sys.path.insert(0, str(Path(__file__).parent.parent))

from evals import metrics  # noqa: E402
from evals.dataset import EvalCase, load_cases, summary  # noqa: E402
from evals.parse_recall import DEFAULT_FIXTURES, score_all  # noqa: E402
from services.recommender import calculate_keyword_coverage  # noqa: E402
from services.similarity import calculate_similarity  # noqa: E402
from services.skill_extractor import extract_skills_from_text, load_skills  # noqa: E402


def score_candidates(case: EvalCase, skills: List[str]) -> List[Dict]:
    """Run the deterministic pipeline for every candidate under one JD."""
    jd_skills = extract_skills_from_text(case.jd_text, skills)
    rows = []

    for candidate in case.candidates:
        resume_skills = extract_skills_from_text(candidate.resume_text, skills)
        similarity = calculate_similarity(candidate.resume_text, case.jd_text)
        coverage = calculate_keyword_coverage(resume_skills, jd_skills)
        missing = sorted(set(jd_skills) - set(resume_skills))

        # The blend the dashboard shows the user, so that is what we score.
        combined = similarity["final_score"] * 0.6 + coverage * 0.4

        rows.append({
            "id": candidate.id,
            "relevance": candidate.relevance,
            "semantic": round(similarity["final_score"], 2),
            "coverage": round(coverage, 2),
            "combined": round(combined, 2),
            "skills": resume_skills,
            "missing": missing,
            "expected_skills": candidate.expected_skills,
            "expected_missing": candidate.expected_missing,
        })

    return rows


def evaluate(cases: List[EvalCase]) -> Dict:
    skills = load_skills()

    ndcg_5, ndcg_10, rbos, spearmans = [], [], [], []
    skill_f1, missing_f1 = [], []
    per_case = []
    by_stress: Dict[str, List[float]] = {}
    equivalence: List[Dict] = []

    for case in cases:
        rows = score_candidates(case, skills)
        ranked = sorted(rows, key=lambda r: -r["combined"])
        scores_by_id = {r["id"]: r["combined"] for r in rows}

        # Pairs that describe the same fit must land on the same score. A gap
        # here means the system is keying on surface form, not substance —
        # which the ranking metrics can hide entirely if the order comes out
        # right anyway.
        for pair in case.equivalent_pairs:
            if len(pair) != 2 or not all(p in scores_by_id for p in pair):
                continue
            left, right = scores_by_id[pair[0]], scores_by_id[pair[1]]
            equivalence.append({
                "case": case.id,
                "stress": case.stress,
                "pair": pair,
                "scores": [round(left, 2), round(right, 2)],
                "gap": round(abs(left - right), 2),
            })

        predicted_relevances = [r["relevance"] for r in ranked]
        case_ndcg5 = metrics.ndcg(predicted_relevances, k=5)
        case_ndcg10 = metrics.ndcg(predicted_relevances, k=10)
        case_rbo = metrics.rbo([r["id"] for r in ranked], case.ideal_order())
        case_spearman = metrics.spearman(
            [r["combined"] for r in rows], [r["relevance"] for r in rows]
        )

        ndcg_5.append(case_ndcg5)
        ndcg_10.append(case_ndcg10)
        rbos.append(case_rbo)
        spearmans.append(case_spearman)

        for row in rows:
            if row["expected_skills"]:
                skill_f1.append(metrics.prf(row["skills"], row["expected_skills"])["f1"])
            if row["expected_missing"]:
                missing_f1.append(metrics.prf(row["missing"], row["expected_missing"])["f1"])

        by_stress.setdefault(case.stress or "general", []).append(case_ndcg5)

        per_case.append({
            "id": case.id,
            "job_title": case.job_title,
            "stress": case.stress or "general",
            "ndcg@5": round(case_ndcg5, 4),
            "rbo": round(case_rbo, 4),
            "spearman": round(case_spearman, 4),
            "predicted_order": [r["id"] for r in ranked],
            "ideal_order": case.ideal_order(),
        })

    return {
        "dataset": summary(cases),
        "ranking": {
            "ndcg@5": round(metrics.mean(ndcg_5), 4),
            "ndcg@10": round(metrics.mean(ndcg_10), 4),
            "rbo": round(metrics.mean(rbos), 4),
            "spearman": round(metrics.mean(spearmans), 4),
        },
        "by_stress": {
            name: round(metrics.mean(values), 4) for name, values in sorted(by_stress.items())
        },
        "equivalence": {
            "pairs_checked": len(equivalence),
            "max_gap": round(max((e["gap"] for e in equivalence), default=0.0), 2),
            "mean_gap": round(metrics.mean([e["gap"] for e in equivalence]), 2),
            "detail": sorted(equivalence, key=lambda e: -e["gap"]),
        },
        "extraction": {
            "skill_f1": round(metrics.mean(skill_f1), 4),
            "missing_skill_f1": round(metrics.mean(missing_f1), 4),
            "cases_with_skill_labels": len(skill_f1),
        },
        "parsing": score_all(DEFAULT_FIXTURES),
        "per_case": per_case,
    }


async def evaluate_llm(cases: List[EvalCase]) -> Dict:
    """Schema conformance and agreement of the LLM evaluation."""
    from core import llm
    from services.llm_evaluator import llm_master_evaluate

    if not llm.is_configured():
        return {"skipped": "OPENROUTER_API_KEY is not set"}

    conformant, failed = 0, 0
    llm_scores, true_grades = [], []

    for case in cases:
        for candidate in case.candidates:
            try:
                result = await llm_master_evaluate(candidate.resume_text, case.jd_text)
            except Exception:
                result = None

            if result is None:
                failed += 1
                continue
            conformant += 1
            llm_scores.append(result.overall_score)
            true_grades.append(candidate.relevance)

    total = conformant + failed
    return {
        "schema_conformance_rate": round(conformant / total, 4) if total else 0.0,
        "calls": total,
        "failures": failed,
        "spearman_vs_human_grade": round(metrics.spearman(llm_scores, true_grades), 4),
    }


def render(report: Dict) -> str:
    lines = []
    add = lines.append

    add("")
    add("CareerIQ evaluation scorecard")
    add("=" * 58)

    data = report["dataset"]
    add(f"  dataset          {data['job_descriptions']} JDs, {data['candidates']} candidates")

    add("")
    add("  RANKING")
    for name, value in report["ranking"].items():
        add(f"    {name:<22} {value:.4f}")

    add("")
    add("  RANKING BY STRESS TYPE          ndcg@5")
    for name, value in report["by_stress"].items():
        flag = "   <-- weakest" if value == min(report["by_stress"].values()) else ""
        add(f"    {name:<28} {value:.4f}{flag}")

    equivalence = report["equivalence"]
    if equivalence["pairs_checked"]:
        add("")
        add("  EQUIVALENCE (pairs that describe the same fit)")
        add(f"    {'pairs checked':<28} {equivalence['pairs_checked']}")
        add(f"    {'mean score gap':<28} {equivalence['mean_gap']:.2f}")
        add(f"    {'worst score gap':<28} {equivalence['max_gap']:.2f}")
        for item in equivalence["detail"][:3]:
            add(f"      {item['pair'][0]} {item['scores'][0]:.1f}  vs  "
                f"{item['pair'][1]} {item['scores'][1]:.1f}   gap {item['gap']:.1f}  [{item['stress']}]")

    add("")
    add("  SKILL EXTRACTION")
    for name, value in report["extraction"].items():
        formatted = f"{value:.4f}" if isinstance(value, float) else str(value)
        add(f"    {name:<22} {formatted}")

    add("")
    add("  PARSER FIELD RECALL")
    parsing = report["parsing"]
    add(f"    {'overall':<22} {parsing['overall_recall']:.4f}")
    for layout, value in parsing["by_layout"].items():
        add(f"    {layout:<22} {value:.4f}")
    for name, value in parsing["by_field"].items():
        add(f"    field: {name:<15} {value:.4f}")

    if "llm" in report:
        add("")
        add("  LLM EVALUATION")
        for name, value in report["llm"].items():
            formatted = f"{value:.4f}" if isinstance(value, float) else str(value)
            add(f"    {name:<22} {formatted}")

    add("")
    add("  WEAKEST CASES")
    for case in sorted(report["per_case"], key=lambda c: c["ndcg@5"])[:3]:
        add(f"    {case['id']:<26} ndcg@5={case['ndcg@5']:.3f}")
        add(f"      predicted {case['predicted_order']}")
        add(f"      ideal     {case['ideal_order']}")

    add("")
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--with-llm", action="store_true", help="include LLM evaluation (uses API credits)")
    parser.add_argument("--json", action="store_true", help="emit JSON instead of a table")
    parser.add_argument("--data", type=Path, default=None, help="a specific .jsonl file")
    args = parser.parse_args()

    cases = load_cases(args.data)
    report = evaluate(cases)

    if args.with_llm:
        report["llm"] = asyncio.run(evaluate_llm(cases))

    print(json.dumps(report, indent=2) if args.json else render(report))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
