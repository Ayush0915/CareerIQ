import datetime
import re

from services.section_parser import parse_sections

# A year range is only work experience if it sits under a work heading. Kept as
# two explicit patterns so the "8 years of experience" claim and the
# "2021 - Present" range can be scoped differently — they are written in
# different places on a resume.
_YEAR_RANGE = re.compile(r"(20\d{2})\s*[-–to]+\s*(20\d{2}|present|current|now)")
_EXPLICIT_YEARS = re.compile(r"(\d+)\+?\s*years?\s*(?:of\s*)?(?:experience)?")


def _current_year() -> int:
    """Resolved at call time — never hardcode, or every 'present' role
    silently undercounts as the calendar moves on."""
    return datetime.date.today().year


def _sum_year_ranges(text: str, current_year: int) -> int:
    total = 0
    for start, end in _YEAR_RANGE.findall(text):
        start_yr = int(start)
        end_yr = current_year if end in ("present", "current", "now") else int(end)
        total += max(0, end_yr - start_yr)
    return total


def _experience_scope(resume_text: str) -> tuple[str, bool]:
    """The text whose year ranges count as work experience.

    Measured problem: the ranges were matched across the whole document and
    summed, so a degree dated 2019-2023 added four years of "experience" on top
    of the actual jobs. That inflated seniority, which assess_level() then turns
    into a multiplier on the final score — a candidate three years into their
    career was being scored as senior.

    Returns the Experience section alone when there is one. When there is not —
    an unsectioned resume, or headings this parser does not recognise — falls
    back to the whole document, because a wrong-but-populated number beats
    reporting nought years for every such resume. The caller flags that case.
    """
    experience = (parse_sections(resume_text).get("experience") or "").strip()
    if experience:
        return experience, False
    return resume_text, True


def detect_experience(resume_text: str, job_description: str) -> dict:
    current_year = _current_year()

    scope_text, low_confidence = _experience_scope(resume_text)
    total_years = _sum_year_ranges(scope_text.lower(), current_year)

    # Explicit claims stay whole-document on purpose. "Senior engineer with 8
    # years of experience" is written in a summary or headline, above any
    # section heading, so scoping it to the Experience block would drop it.
    explicit_years = [
        int(n) for n in _EXPLICIT_YEARS.findall(resume_text.lower()) if int(n) < 30
    ]

    detected_years = max(total_years, max(explicit_years) if explicit_years else 0)

    # Detect required years from JD
    jd_lower = job_description.lower()
    jd_required = re.findall(r'(\d+)\+?\s*years?\s*(of\s*)?(experience)?', jd_lower)
    required_years = max([int(m[0]) for m in jd_required if int(m[0]) < 20], default=0)

    if detected_years < 2:
        level = "junior"
    elif detected_years < 5:
        level = "mid"
    else:
        level = "senior"

    meets_requirement = detected_years >= required_years if required_years > 0 else True

    return {
        "detected_years": detected_years,
        "required_years": required_years,
        "level": level,
        "meets_requirement": meets_requirement,
        "gap_years": max(0, required_years - detected_years),
        # True when the years came from the whole document rather than a real
        # Experience section, so consumers can discount them.
        "low_confidence": low_confidence,
    }
