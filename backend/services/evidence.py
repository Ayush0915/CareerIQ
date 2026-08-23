"""Evidence-weighted skill detection.

Measured problem this solves: a resume listing 48 technologies under "Technical
Skills" with no evidence of having used any of them ranked *first* — above the
engineer who had actually built the pipelines. Presence-based matching cannot
tell a claim from a demonstration, so the cheapest possible resume wins.

The fix is to weight a skill by *where* it appears. A skill named in an
experience bullet alongside what was built with it is worth far more than the
same word sitting in a comma-separated list, and a skill attached to a
quantified outcome is worth more still.

This is deliberately not a keyword count. Listing a skill is not evidence of
it; that is the entire point.
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Sequence

from services.section_parser import parse_sections
from services.skill_extractor import extract_skills_from_text

# How much a mention is worth, by the section it appears in.
# "skills" is low on purpose: a list is a claim, not a demonstration.
SECTION_WEIGHT: Dict[str, float] = {
    "experience": 1.00,
    "projects": 0.90,
    "certifications": 0.65,
    "summary": 0.50,
    "other": 0.50,
    "education": 0.40,
    "skills": 0.30,
}

# A mention sitting next to a number ("cut p95 by 60%", "serving 40M requests")
# is corroborated in a way a bare mention is not.
QUANTIFIED_BONUS = 0.25
MAX_WEIGHT = 1.0

_QUANTIFIER_RE = re.compile(
    r"\d+\s*%|\$\s*\d+|\d+\s*[kmb]\b|\d+x\b|\d{3,}|"
    r"(?:increased|decreased|reduced|improved|grew|saved|cut|serving|handling)\s+[^.]*\d+",
    re.I,
)


@dataclass
class SkillEvidence:
    """Where a skill was found and how much that is worth."""

    skill: str
    sections: List[str] = field(default_factory=list)
    weight: float = 0.0
    quantified: bool = False

    @property
    def is_demonstrated(self) -> bool:
        """Appears somewhere other than a bare skills list."""
        return any(section not in ("skills",) for section in self.sections)


def _has_quantifier_near(text: str, skill: str) -> bool:
    """Is the skill mentioned in a sentence that also carries a number?"""
    for sentence in re.split(r"(?<=[.!?\n])\s+", text):
        if skill in sentence.lower() and _QUANTIFIER_RE.search(sentence):
            return True
    return False


def gather_evidence(
    resume_text: str,
    skills_list: Sequence[str],
    sections: Optional[Dict[str, str]] = None,
) -> Dict[str, SkillEvidence]:
    """Map each detected skill to the strength of its supporting evidence."""
    parsed = sections if sections is not None else parse_sections(resume_text)
    evidence: Dict[str, SkillEvidence] = {}

    for section_name, section_text in parsed.items():
        if not section_text or not section_text.strip():
            continue

        weight = SECTION_WEIGHT.get(section_name, 0.5)
        for skill in extract_skills_from_text(section_text, skills_list):
            entry = evidence.setdefault(skill, SkillEvidence(skill=skill))
            entry.sections.append(section_name)

            score = weight
            if _has_quantifier_near(section_text, skill):
                entry.quantified = True
                score = min(MAX_WEIGHT, score + QUANTIFIED_BONUS)

            entry.weight = max(entry.weight, score)

    # A skill the section parser missed entirely still counts, at the weight of
    # an unattributed mention — section detection is heuristic and should not
    # silently drop a real skill.
    for skill in extract_skills_from_text(resume_text, skills_list):
        if skill not in evidence:
            evidence[skill] = SkillEvidence(
                skill=skill, sections=["other"], weight=SECTION_WEIGHT["other"]
            )

    return evidence


def weighted_coverage(
    evidence: Dict[str, SkillEvidence],
    jd_skills: Sequence[str],
) -> float:
    """Percentage of the job's skills that are actually evidenced.

    A resume claiming every skill in a list scores roughly a third of one that
    demonstrates the same skills in its experience.
    """
    required = [s for s in {s.strip().lower() for s in jd_skills} if s]
    if not required:
        return 0.0

    total = sum(evidence[skill].weight for skill in required if skill in evidence)
    return round((total / len(required)) * 100, 2)


def evidence_ratio(evidence: Dict[str, SkillEvidence]) -> float:
    """Share of claimed skills that appear outside a bare skills list.

    Near zero is the signature of a padded skills section.
    """
    if not evidence:
        return 0.0
    demonstrated = sum(1 for entry in evidence.values() if entry.is_demonstrated)
    return round(demonstrated / len(evidence), 3)


def unsupported_skills(evidence: Dict[str, SkillEvidence]) -> List[str]:
    """Skills claimed in a list but never shown in context.

    Useful to the candidate directly: these are the lines a recruiter will
    probe and the resume cannot answer.
    """
    return sorted(
        entry.skill for entry in evidence.values() if not entry.is_demonstrated
    )
