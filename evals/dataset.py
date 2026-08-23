"""Evaluation dataset: JD groups, each with graded candidate resumes.

Grouping candidates under a shared job description is what makes ranking
metrics possible.  A flat list of (resume, jd, score) pairs can only measure
absolute error, which says nothing about whether the system puts the right
candidate first.

Relevance grades (the convention used throughout):
    3 — strong fit, would shortlist
    2 — good fit, worth a call
    1 — stretch, missing something material
    0 — not a fit

Add your own cases to ``evals/data/*.jsonl``. Target 40-60 candidates total;
public starting points are the HuggingFace ``cnamuangtoun/resume-job-description-fit``
set and the Kaggle resume + job-description collections.
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Dict, Iterator, List, Optional

from pydantic import BaseModel, Field

DATA_DIR = Path(__file__).parent / "data"


class Candidate(BaseModel):
    id: str
    resume_text: str
    relevance: int = Field(ge=0, le=3, description="0 not a fit .. 3 strong fit")
    expected_skills: List[str] = Field(
        default_factory=list,
        description="Skills a correct extractor must find in this resume",
    )
    expected_missing: List[str] = Field(
        default_factory=list,
        description="JD skills this candidate genuinely lacks",
    )
    notes: str = ""


class EvalCase(BaseModel):
    """One job description and the candidates graded against it."""

    id: str
    job_title: str
    jd_text: str
    candidates: List[Candidate]

    stress: str = Field(
        default="",
        description=(
            "Which failure mode this case probes — vocabulary, keyword_stuffing, "
            "career_change, overqualification, near_tie, mangled_extraction. "
            "Empty means a general case."
        ),
    )
    equivalent_pairs: List[List[str]] = Field(
        default_factory=list,
        description=(
            "Candidate id pairs that describe substantively the same fit and so "
            "should receive near-identical scores. A large gap is a defect even "
            "when the ranking order happens to come out right — it means the "
            "system is keying on surface form rather than substance."
        ),
    )

    def ideal_order(self) -> List[str]:
        return [c.id for c in sorted(self.candidates, key=lambda c: -c.relevance)]

    def relevance_by_id(self) -> Dict[str, int]:
        return {c.id: c.relevance for c in self.candidates}


def load_cases(path: Optional[Path] = None) -> List[EvalCase]:
    """Load every ``*.jsonl`` file in the data directory (or one file)."""
    target = path or DATA_DIR
    files = [target] if target.is_file() else sorted(target.glob("*.jsonl"))

    cases: List[EvalCase] = []
    for file in files:
        for line_number, line in enumerate(file.read_text(encoding="utf-8").splitlines(), 1):
            line = line.strip()
            if not line or line.startswith("//"):
                continue
            try:
                cases.append(EvalCase.model_validate_json(line))
            except Exception as exc:
                raise ValueError(f"{file.name}:{line_number} is not a valid case — {exc}") from exc

    if not cases:
        raise FileNotFoundError(
            f"No evaluation cases found in {target}. "
            "Add JSONL files following the EvalCase schema."
        )
    return cases


def iter_pairs(cases: List[EvalCase]) -> Iterator[tuple[EvalCase, Candidate]]:
    for case in cases:
        for candidate in case.candidates:
            yield case, candidate


def summary(cases: List[EvalCase]) -> Dict[str, int]:
    candidates = [c for _, c in iter_pairs(cases)]
    grades: Dict[int, int] = {}
    for candidate in candidates:
        grades[candidate.relevance] = grades.get(candidate.relevance, 0) + 1
    return {
        "job_descriptions": len(cases),
        "candidates": len(candidates),
        **{f"grade_{grade}": count for grade, count in sorted(grades.items(), reverse=True)},
    }
