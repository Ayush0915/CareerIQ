"""The single place a fit score is computed.

Previously the number was assembled in three places that disagreed: the
dashboard blended semantic 40 / keyword 35 / clarity 25, the evaluation harness
blended semantic 60 / coverage 40, and the LLM produced its own unrelated
figure. Optimising any of them told you nothing about the others.

Everything now goes through :func:`compute_fit`, so the harness measures the
number the user is actually shown.
"""
from __future__ import annotations

import re
from dataclasses import asdict, dataclass, field
from typing import Dict, List, Optional, Sequence

# Component weights. Semantic similarity carries the most because it is the
# only signal that reads the résumé as prose rather than as a bag of terms.
WEIGHT_SEMANTIC = 0.45
WEIGHT_COVERAGE = 0.40
WEIGHT_CLARITY = 0.15

# Writing quality only counts when the candidate is in the running. Measured
# problem: a brand designer (grade 0) outranked a sysadmin (grade 1) for a
# platform role, because the designer's resume was well written and the
# sysadmin's was weak-phrase heavy. Both matched zero required skills, so
# prose quality decided a question it has no business deciding.
CLARITY_FLOOR = 0.20
CLARITY_FULL_AT_COVERAGE = 40.0

# Level mismatch scales the result rather than subtracting from it: a principal
# engineer applying to a junior role is not "85% minus a bit", they are a
# different kind of candidate.
OVERQUALIFIED_FLOOR = 0.62
UNDERQUALIFIED_FLOOR = 0.70

_JUNIOR_HINTS = re.compile(
    r"\b(junior|entry[\s-]?level|graduate|intern(?:ship)?|first role|early career|"
    r"0\s*[-–]\s*2\s*years?|no experience required)\b",
    re.I,
)
_SENIOR_HINTS = re.compile(
    r"\b(senior|staff|principal|lead|head of|director|architect)\b", re.I
)


@dataclass
class LevelFit:
    detected_years: int = 0
    required_years: int = 0
    jd_seniority: str = "unspecified"  # junior | senior | unspecified
    multiplier: float = 1.0
    verdict: str = "appropriate"  # appropriate | overqualified | underqualified
    note: str = ""


@dataclass
class FitScore:
    overall: float
    semantic: float
    coverage: float
    clarity: float
    level: LevelFit = field(default_factory=LevelFit)
    evidence_ratio: float = 1.0
    unsupported_skills: List[str] = field(default_factory=list)
    notes: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict:
        payload = asdict(self)
        payload["level"] = asdict(self.level)
        return payload


def detect_jd_seniority(jd_text: str) -> str:
    """Junior roles say so explicitly; that is the signal worth trusting."""
    if _JUNIOR_HINTS.search(jd_text or ""):
        return "junior"
    if _SENIOR_HINTS.search(jd_text or ""):
        return "senior"
    return "unspecified"


def assess_level(
    detected_years: int,
    required_years: int,
    jd_text: str,
) -> LevelFit:
    """How well the candidate's seniority matches what the role asked for.

    Measured problem: a principal engineer with fifteen years ranked second for
    a role advertised at nought to two years, because seniority was computed
    and then never consumed by anything.
    """
    seniority = detect_jd_seniority(jd_text)
    fit = LevelFit(
        detected_years=detected_years,
        required_years=required_years,
        jd_seniority=seniority,
    )

    # Explicit junior posting, substantially senior candidate.
    if seniority == "junior" and detected_years >= 6:
        overshoot = min((detected_years - 5) / 10, 1.0)
        fit.multiplier = round(1.0 - (1.0 - OVERQUALIFIED_FLOOR) * overshoot, 3)
        fit.verdict = "overqualified"
        fit.note = (
            f"Role is advertised as junior; the resume shows about "
            f"{detected_years} years. Strong candidates are routinely screened "
            "out of roles far below their level."
        )
        return fit

    # A junior posting asking for "0-2 years" states a ceiling, not a floor.
    # Penalising a graduate for having no experience inverts the role's intent.
    if seniority == "junior":
        return fit

    if required_years:
        # Well above a stated requirement.
        if detected_years >= required_years * 3 and detected_years - required_years >= 6:
            overshoot = min((detected_years - required_years) / 12, 1.0)
            fit.multiplier = round(1.0 - (1.0 - OVERQUALIFIED_FLOOR) * overshoot, 3)
            fit.verdict = "overqualified"
            fit.note = (
                f"About {detected_years} years against a stated {required_years}+. "
                "Worth addressing directly in a cover letter."
            )
            return fit

        # Short of a stated requirement.
        if detected_years < required_years:
            shortfall = min((required_years - detected_years) / max(required_years, 1), 1.0)
            fit.multiplier = round(1.0 - (1.0 - UNDERQUALIFIED_FLOOR) * shortfall, 3)
            fit.verdict = "underqualified"
            fit.note = (
                f"About {detected_years} years against a stated {required_years}+."
            )
            return fit

    return fit


def compute_fit(
    *,
    semantic_score: float,
    coverage_score: float,
    clarity_score: float,
    detected_years: int = 0,
    required_years: int = 0,
    jd_text: str = "",
    evidence_ratio_value: float = 1.0,
    unsupported: Optional[Sequence[str]] = None,
) -> FitScore:
    """Blend the components into the single number the user is shown."""
    # Damp clarity when nothing about the role matches.
    relevance = min(1.0, CLARITY_FLOOR + coverage_score / CLARITY_FULL_AT_COVERAGE)
    base = (
        semantic_score * WEIGHT_SEMANTIC
        + coverage_score * WEIGHT_COVERAGE
        + clarity_score * relevance * WEIGHT_CLARITY
    )

    level = assess_level(detected_years, required_years, jd_text)
    overall = base * level.multiplier

    notes: List[str] = []
    if level.note:
        notes.append(level.note)

    unsupported_list = list(unsupported or [])
    if evidence_ratio_value < 0.35 and len(unsupported_list) >= 8:
        notes.append(
            f"{len(unsupported_list)} skills are listed but never shown in context. "
            "Recruiters probe exactly these."
        )

    return FitScore(
        overall=round(max(0.0, min(100.0, overall)), 2),
        semantic=round(semantic_score, 2),
        coverage=round(coverage_score, 2),
        clarity=round(clarity_score, 2),
        level=level,
        evidence_ratio=evidence_ratio_value,
        unsupported_skills=unsupported_list[:12],
        notes=notes,
    )
