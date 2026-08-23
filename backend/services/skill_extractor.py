"""Skill extraction against the local taxonomy.

Both the resume and the job description are normalized *inside* this module so
the two sides can never drift apart again — callers pass raw text.

Matching is longest-first with span masking, so "node.js" wins over "node",
"c++" over "c", and "asp.net" over ".net".
"""
import csv
import os
import re
from functools import lru_cache
from typing import List, Pattern, Sequence, Tuple

from services.aliases import expand as expand_aliases
from utils.text_cleaner import SKILL_BOUNDARY, SKILL_CHARS, normalize

# Short forms with exactly one reading. Ambiguous ones (notably "tf", which is
# Terraform on an infra resume and TensorFlow on an ML one) live in
# services.aliases, which resolves them from document context.
SYNONYMS = {
    "ml": "machine learning",
    "dl": "deep learning",
    "js": "javascript",
    "py": "python",
    "np": "numpy",
    "nlp": "natural language processing",
    "k8s": "kubernetes",
    "postgres": "postgresql",
    "golang": "go",
}

_SKILLS_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "skills_database.csv")

# Sentinel written over an already-matched span so shorter skills cannot match
# inside it.  Not a member of SKILL_BOUNDARY, so it never blocks a legitimate
# neighbouring match.
_MASK = "\x00"

FALLBACK_SKILLS = [
    "python", "fastapi", "django", "flask", "react", "javascript", "typescript",
    "vue", "angular", "node.js", "express", "html", "css", "tailwind", "docker",
    "kubernetes", "aws", "azure", "gcp", "devops", "ci/cd", "git", "github",
    "sql", "postgresql", "mysql", "mongodb", "redis", "pandas", "numpy",
    "scikit-learn", "tensorflow", "pytorch", "machine learning", "deep learning",
    "nlp", "data analysis", "java", "spring", "c++", "c#", "go", "rust",
]


def load_skills(file_path: str = None) -> List[str]:
    """Load the skill taxonomy from CSV, falling back to a built-in list."""
    path = file_path or _SKILLS_PATH
    try:
        if os.path.exists(path):
            with open(path, newline="", encoding="utf-8") as fh:
                rows = list(csv.DictReader(fh))
            skills = [
                str(row["skill"]).strip().lower()
                for row in rows
                if row.get("skill") and str(row["skill"]).strip()
            ]
            if skills:
                return skills
    except Exception as exc:  # pragma: no cover - defensive
        print(f"[skill_extractor] Warning reading {path}: {exc}")
    return list(FALLBACK_SKILLS)


def apply_synonyms(text: str) -> str:
    """Expand known short forms to their canonical skill name.

    Uses the *wide* character class as the boundary so a short form is only
    expanded when it stands alone — otherwise the "js" inside "node.js" would
    be rewritten to "node.javascript".
    """
    for short, full in SYNONYMS.items():
        text = re.sub(
            rf"(?<![{SKILL_CHARS}]){re.escape(short)}(?![{SKILL_CHARS}])",
            full,
            text,
        )
    return text


def normalize_text(text: str) -> str:
    """Full normalization pipeline applied to both resume and JD.

    Alias expansion runs here rather than at the call site so the resume and
    the job description can never be expanded differently — which is the same
    class of bug as the original clean_text asymmetry.
    """
    return expand_aliases(apply_synonyms(normalize(text)))


@lru_cache(maxsize=8)
def _subphrases(skills: Tuple[str, ...]) -> dict:
    """Map each multi-word skill to the shorter taxonomy skills inside it.

    The taxonomy contains overlapping entries such as "ci/cd" and
    "ci/cd pipelines".  Longest-first masking would credit only the longer one,
    which makes matching asymmetric: a resume saying "CI/CD pipelines" and a JD
    saying "CI/CD" would not agree.  Crediting the contained skill as well
    keeps both sides consistent.  Only whitespace-delimited sub-phrases count,
    so "node" is never credited from "node.js".
    """
    unique = {s.strip().lower() for s in skills if s and s.strip()}
    contained = {}
    for skill in unique:
        if " " not in skill:
            continue
        tokens = skill.split()
        inner = set()
        for start in range(len(tokens)):
            for end in range(start + 1, len(tokens) + 1):
                if end - start == len(tokens):
                    continue
                phrase = " ".join(tokens[start:end])
                if phrase in unique:
                    inner.add(phrase)
        if inner:
            contained[skill] = inner
    return contained


@lru_cache(maxsize=8)
def _compiled(skills: Tuple[str, ...]) -> List[Tuple[str, Pattern]]:
    """Compile one pattern per skill, longest first."""
    unique = {s.strip().lower() for s in skills if s and s.strip()}
    ordered = sorted(unique, key=len, reverse=True)
    return [
        (
            skill,
            re.compile(
                rf"(?<![{SKILL_BOUNDARY}]){re.escape(skill)}(?![{SKILL_BOUNDARY}])"
            ),
        )
        for skill in ordered
    ]


def extract_skills_from_text(text: str, skills_list: Sequence[str]) -> List[str]:
    """Return the sorted set of taxonomy skills present in ``text``.

    ``text`` is raw — normalization happens here so callers cannot normalize
    one side of a comparison and not the other.
    """
    if not text or not skills_list:
        return []

    key = tuple(skills_list)
    haystack = normalize_text(text)
    detected = set()

    for skill, pattern in _compiled(key):
        spans = [m.span() for m in pattern.finditer(haystack)]
        if not spans:
            continue
        detected.add(skill)
        # Mask matched spans so shorter overlapping skills cannot match.
        chars = list(haystack)
        for start, end in spans:
            for i in range(start, end):
                chars[i] = _MASK
        haystack = "".join(chars)

    # Credit taxonomy skills contained as whole-word sub-phrases of a match.
    contained = _subphrases(key)
    for skill in list(detected):
        detected.update(contained.get(skill, ()))

    return sorted(detected)
