"""Alias expansion for skill vocabulary.

Measured problem this solves: two candidates with byte-equivalent substance
scored 68.9 and 81.4 — a 12.5 point gap — purely because one wrote ``K8s``,
``TF`` and ``Postgres`` while the other spelled them out. Exact substring
matching against a canonical list cannot see through abbreviation.

This is the pragmatic version of the taxonomy work. A full ESCO ingestion
(~13,900 skills with alias sets) is the eventual answer; this closes the
measured gap now with a curated map covering the abbreviations engineers
actually write on resumes.
"""
from __future__ import annotations

import re
from functools import lru_cache
from typing import Dict, List, Tuple

from utils.text_cleaner import SKILL_CHARS

# alias -> canonical taxonomy term.
#
# Entries removed on purpose: "cv" (means curriculum vitae here), "es" (too
# common as an ordinary word), "pg"/"pd" (ambiguous), "api"/"apis" (would
# rewrite "rest api" into "rest rest api").
# Deliberately conservative: every entry here is an abbreviation with one
# obvious expansion in an engineering context. Ambiguous short forms ("go" for
# golang vs the verb, "r" the language) are left to exact matching.
ALIASES: Dict[str, str] = {
    # ── Orchestration / infrastructure ──────────────────────────────────
    "k8s": "kubernetes",
    "k3s": "kubernetes",
    "eks": "kubernetes",
    "aks": "kubernetes",
    "gke": "kubernetes",
    "iac": "infrastructure as code",
    "cfn": "cloudformation",
    "gha": "github actions",
    "github action": "github actions",
    "ci cd": "ci/cd",
    "cicd": "ci/cd",
    "continuous integration": "ci/cd",
    "continuous delivery": "ci/cd",
    "continuous deployment": "ci/cd",
    # ── Data stores ─────────────────────────────────────────────────────
    "postgres": "postgresql",
    "psql": "postgresql",
    "mongo": "mongodb",
    "dynamo": "dynamodb",
    "bq": "bigquery",
    # ── Languages / runtimes ────────────────────────────────────────────
    "py": "python",
    "js": "javascript",
    "ts": "typescript",
    "golang": "go",
    "c sharp": "c#",
    "csharp": "c#",
    "cpp": "c++",
    "c plus plus": "c++",
    "dotnet": ".net",
    "dot net": ".net",
    "node": "node.js",
    "nodejs": "node.js",
    "reactjs": "react",
    "react js": "react",
    "vuejs": "vue",
    "nextjs": "next.js",
    # ── ML / data ───────────────────────────────────────────────────────
    "ml": "machine learning",
    "dl": "deep learning",
    "nlp": "natural language processing",
    "sklearn": "scikit-learn",
    "scikit learn": "scikit-learn",
    "np": "numpy",
    "llm": "large language models",
    "llms": "large language models",
    # ── Observability ───────────────────────────────────────────────────
    "prom": "prometheus",
    "otel": "opentelemetry",
    "obs": "observability",
    # ── Practices ───────────────────────────────────────────────────────
    "oop": "object-oriented programming",
    "fp": "functional programming",
    "tdd": "test driven development",
    "ddd": "domain driven design",
    "rest apis": "rest api",
    "restful api": "rest api",
    "restful apis": "rest api",
    "gql": "graphql",
    "a11y": "accessibility",
    "ux": "ui/ux",
    "ui": "ui/ux",
}


# Some abbreviations genuinely mean different things in different fields.
# "TF" is Terraform on an infrastructure resume and TensorFlow on an ML one,
# and picking one globally is wrong roughly half the time — which is how a
# platform engineer's Terraform experience was being read as TensorFlow.
# Resolved per document by looking at what else is in it.
AMBIGUOUS: Dict[str, Dict[str, Tuple[str, ...]]] = {
    "tf": {
        "terraform": (
            "terraform", "kubernetes", "infrastructure", "provisioning",
            "aws", "gcp", "azure", "cloud", "module", "cluster", "devops",
        ),
        "tensorflow": (
            "tensorflow", "pytorch", "keras", "model", "training", "neural",
            "machine learning", "inference", "dataset", "jupyter",
        ),
    },
}


def _resolve_ambiguous(text: str) -> Dict[str, str]:
    """Pick a reading for each ambiguous alias, based on the whole document."""
    resolved: Dict[str, str] = {}

    for alias, candidates in AMBIGUOUS.items():
        scores = {
            canonical: sum(1 for term in context if term in text)
            for canonical, context in candidates.items()
        }
        best = max(scores.values())
        # A tie means the document gives no signal, so leave it alone rather
        # than guessing — a wrong expansion is worse than a missed one.
        if best > 0 and list(scores.values()).count(best) == 1:
            resolved[alias] = max(scores, key=scores.get)

    return resolved


@lru_cache(maxsize=1)
def _compiled() -> List[Tuple["re.Pattern[str]", str]]:
    """Longest alias first, so "c plus plus" wins over "c"."""
    ordered = sorted(ALIASES.items(), key=lambda item: len(item[0]), reverse=True)
    return [
        (
            re.compile(rf"(?<![{SKILL_CHARS}]){re.escape(alias)}(?![{SKILL_CHARS}])"),
            canonical,
        )
        for alias, canonical in ordered
    ]


def expand(text: str) -> str:
    """Rewrite recognised abbreviations to their canonical taxonomy term.

    Runs on normalized text, and on both the resume and the job description —
    expanding only one side would recreate the asymmetry this exists to fix.
    """
    if not text:
        return ""
    out = text
    for pattern, canonical in _compiled():
        out = pattern.sub(canonical, out)

    for alias, canonical in _resolve_ambiguous(out).items():
        out = re.sub(
            rf"(?<![{SKILL_CHARS}]){re.escape(alias)}(?![{SKILL_CHARS}])", canonical, out
        )

    return out


def canonical_for(term: str) -> str:
    """The canonical form of a single term, or the term unchanged."""
    return ALIASES.get(term.strip().lower(), term.strip().lower())
