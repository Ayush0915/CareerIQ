"""Parser field-extraction recall.

This measures the thing that actually kills applications: whether a parser can
recover the structured fields from a document.  It is also the foundation for
the Phase 5 reframing of ATS simulation — "here is what a real parser lost from
your resume" is a stronger, checkable claim than a weighted rubric with
unvalidated coefficients.

Usage: build a fixture with known ground truth, run it through the parser, and
report which fields survived.
"""
from __future__ import annotations

import sys
from dataclasses import dataclass, field
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

from services.parser import extract_contact_info  # noqa: E402

TRACKED_FIELDS = ("name", "email", "phone", "linkedin", "github")


@dataclass
class ParseFixture:
    """A document plus what a correct parser should recover from it."""

    id: str
    text: str
    expected: dict[str, str]
    layout: str = "single-column"  # single-column | two-column | table-heavy
    notes: str = ""


@dataclass
class ParseResult:
    fixture_id: str
    layout: str
    recovered: dict[str, bool] = field(default_factory=dict)

    @property
    def recall(self) -> float:
        if not self.recovered:
            return 0.0
        return sum(self.recovered.values()) / len(self.recovered)

    @property
    def lost_fields(self) -> list[str]:
        return [name for name, ok in self.recovered.items() if not ok]


def _matches(actual: str, expected: str) -> bool:
    """Loose comparison — casing and surrounding punctuation do not matter."""
    if not expected:
        return True
    if not actual:
        return False
    normalize = lambda s: "".join(ch for ch in s.lower() if ch.isalnum())  # noqa: E731
    return normalize(expected) in normalize(actual) or normalize(actual) in normalize(expected)


def score_fixture(fixture: ParseFixture) -> ParseResult:
    extracted = extract_contact_info(fixture.text)
    result = ParseResult(fixture_id=fixture.id, layout=fixture.layout)

    for name in TRACKED_FIELDS:
        expected = fixture.expected.get(name, "")
        if not expected:
            continue  # not asserted for this fixture
        result.recovered[name] = _matches(extracted.get(name, ""), expected)

    return result


def score_all(fixtures: list[ParseFixture]) -> dict[str, object]:
    results = [score_fixture(f) for f in fixtures]

    by_layout: dict[str, list[float]] = {}
    for result in results:
        by_layout.setdefault(result.layout, []).append(result.recall)

    field_totals: dict[str, list[bool]] = {}
    for result in results:
        for name, ok in result.recovered.items():
            field_totals.setdefault(name, []).append(ok)

    return {
        "overall_recall": sum(r.recall for r in results) / len(results) if results else 0.0,
        "by_layout": {
            layout: sum(scores) / len(scores) for layout, scores in by_layout.items()
        },
        "by_field": {
            name: sum(oks) / len(oks) for name, oks in field_totals.items()
        },
        "worst": sorted(
            [{"id": r.fixture_id, "recall": r.recall, "lost": r.lost_fields} for r in results],
            key=lambda item: item["recall"],
        )[:5],
    }


# ── Built-in fixtures ─────────────────────────────────────────────────────────
# Two-column resumes are where pdfplumber's lack of reading-order handling
# shows up; the reversed-flow fixture simulates what column interleaving does to
# the header region the contact extractor scans.

DEFAULT_FIXTURES: list[ParseFixture] = [
    ParseFixture(
        id="clean-single-column",
        layout="single-column",
        text=(
            "Priya Raman\n"
            "priya.raman@example.com | +91 98765 43210\n"
            "linkedin.com/in/priyaraman | github.com/priyar\n\n"
            "Summary\nBackend engineer with six years building payment systems.\n"
        ),
        expected={
            "name": "Priya Raman",
            "email": "priya.raman@example.com",
            "phone": "+91 98765 43210",
            "linkedin": "priyaraman",
            "github": "priyar",
        },
    ),
    ParseFixture(
        id="two-column-interleaved",
        layout="two-column",
        text=(
            "SKILLS                          Daniel Osei\n"
            "Python  Go  Kubernetes          daniel.osei@example.com\n"
            "Terraform  PostgreSQL           +44 7700 900123\n"
            "                                github.com/dosei\n"
        ),
        expected={
            "name": "Daniel Osei",
            "email": "daniel.osei@example.com",
            "phone": "+44 7700 900123",
            "github": "dosei",
        },
        notes="Header text interleaved with the skills column, as pdfplumber emits it.",
    ),
    ParseFixture(
        id="contact-in-footer",
        layout="single-column",
        text=(
            "Marcus Feld\nSenior Data Engineer\n\n"
            + ("Experience bullet describing pipeline work.\n" * 40)
            + "marcus.feld@example.com | linkedin.com/in/marcusfeld\n"
        ),
        expected={
            "name": "Marcus Feld",
            "email": "marcus.feld@example.com",
            "linkedin": "marcusfeld",
        },
        notes="Contact details below the 1500-character header window the extractor scans.",
    ),
    ParseFixture(
        id="table-header",
        layout="table-heavy",
        text=(
            "| Name | Aisha Khan |\n"
            "| Email | aisha.khan@example.com |\n"
            "| Phone | +1 (415) 555-0142 |\n\n"
            "Experience\nLed platform migration.\n"
        ),
        expected={
            "email": "aisha.khan@example.com",
            "phone": "+1 (415) 555-0142",
        },
        notes="Contact block inside a table, which many resume templates use.",
    ),
]


if __name__ == "__main__":
    import json

    print(json.dumps(score_all(DEFAULT_FIXTURES), indent=2))
