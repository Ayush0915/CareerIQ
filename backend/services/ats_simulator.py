"""
ats_simulator.py
Detailed ATS (Applicant Tracking System) simulation.
Scores the resume on 8 dimensions that real ATS systems evaluate.
"""
import re
from typing import Dict, List


# ── ATS-unfriendly formatting patterns ───────────────────────────────────────

HEADER_PATTERNS = [
    r"experience",  r"education",   r"skills",
    r"projects",    r"certif",      r"summary",
    r"objective",   r"awards",      r"publications",
]

CONTACT_PATTERNS = {
    "email":    r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}",
    "phone":    r"(\+?\d[\d\s\-().]{7,}\d)",
    "linkedin": r"linkedin\.com",
    "github":   r"github\.com",
}

DATE_PATTERN    = r"(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{4}|\d{4}\s*[-–]\s*(\d{4}|present|current)"
DEGREE_PATTERNS = ["bachelor", "master", "b.s", "m.s", "b.e", "m.e", "phd", "mba", "b.tech", "m.tech"]
BULLET_PATTERN  = r"^[\s]*[•\-\*\>\u2022\u25aa]"

FORBIDDEN_ELEMENTS = [
    ("table_likely",   r"\|.*\|",                 "Tables may break ATS parsing"),
    ("header_footer",  r"page \d+ of \d+",        "Page numbers can confuse ATS"),
    ("image_text",     r"\[image\]|\[photo\]",  "Embedded images are ignored by ATS"),
    ("columns",        r"\t{3,}",                   "Multi-column layout may parse incorrectly"),
    ("special_chars",  r"[\u2600-\u27bf]",         "Emoji/special symbols may not parse"),
]


# ── Scorer functions ──────────────────────────────────────────────────────────

def _score_contact_info(text: str) -> Dict:
    found   = {}
    missing = []
    for field, pattern in CONTACT_PATTERNS.items():
        if re.search(pattern, text, re.I):
            found[field] = True
        else:
            missing.append(field)

    score = (len(found) / len(CONTACT_PATTERNS)) * 100
    return {
        "score":   round(score),
        "found":   list(found.keys()),
        "missing": missing,
        "note":    "All contact fields detected." if not missing else f"Missing: {', '.join(missing)}",
    }


def _score_section_headers(text: str) -> Dict:
    text_lower = text.lower()
    found   = [h for h in HEADER_PATTERNS if h in text_lower]
    missing = [h for h in ["experience", "education", "skills"] if h not in text_lower]

    score = min(100, round((len(found) / len(HEADER_PATTERNS)) * 100))
    return {
        "score":           score,
        "headers_found":   found,
        "critical_missing": missing,
        "note": "All critical sections present." if not missing else f"Add missing sections: {', '.join(missing)}",
    }


def _score_keyword_density(resume_text: str, jd_text: str) -> Dict:
    """How well does resume keyword density match JD?"""
    # Extract significant words (3+ chars, not stopwords)
    stopwords = {"and", "the", "for", "with", "that", "this", "will", "have", "from",
                 "are", "our", "you", "your", "not", "all", "can", "has", "its"}
    def significant_words(t):
        words = re.findall(r"\b[a-z][a-z0-9+#.]{2,}\b", t.lower())
        return [w for w in words if w not in stopwords]

    jd_words      = set(significant_words(jd_text))
    resume_words  = set(significant_words(resume_text))

    matched  = jd_words & resume_words
    unmatched = list(jd_words - resume_words)[:15]

    score = round((len(matched) / max(len(jd_words), 1)) * 100)
    score = min(score, 100)
    return {
        "score":           score,
        "matched_count":   len(matched),
        "jd_total_keywords": len(jd_words),
        "top_missing":     sorted(unmatched)[:10],
        "note": f"{len(matched)} of {len(jd_words)} JD keywords found in resume.",
    }


def _score_date_consistency(text: str) -> Dict:
    dates = re.findall(DATE_PATTERN, text.lower())
    has_dates = len(dates) > 0

    # Check for employment gap red flag (simple heuristic)
    year_mentions = re.findall(r"20\d{2}", text)
    years = sorted(set(int(y) for y in year_mentions))
    gap_flag = False
    if len(years) >= 2:
        for i in range(1, len(years)):
            if years[i] - years[i-1] > 2:
                gap_flag = True
                break

    score = 85 if has_dates else 30
    if gap_flag:
        score -= 10
    return {
        "score":      round(score),
        "dates_found": len(dates),
        "gap_detected": gap_flag,
        "note": "Dates look consistent." if not gap_flag else "Possible employment gap detected — consider addressing it.",
    }


def _score_education(text: str) -> Dict:
    text_lower = text.lower()
    found_degrees = [d for d in DEGREE_PATTERNS if d in text_lower]
    has_year = bool(re.search(r"20\d{2}", text))

    score = 90 if found_degrees else 40
    if has_year:
        score = min(100, score + 5)
    return {
        "score":          round(score),
        "degrees_found":  found_degrees,
        "has_grad_year":  has_year,
        "note": f"Degree detected: {', '.join(found_degrees)}." if found_degrees else "No degree keyword found — ATS may not score education section.",
    }


def _score_formatting(text: str) -> Dict:
    issues    = []
    penalties = 0
    for key, pattern, msg in FORBIDDEN_ELEMENTS:
        if re.search(pattern, text, re.I | re.M):
            issues.append(msg)
            penalties += 12

    bullet_lines = sum(1 for line in text.splitlines() if re.match(BULLET_PATTERN, line))
    has_bullets  = bullet_lines > 3
    if not has_bullets:
        issues.append("Few or no bullet points — ATS and recruiters prefer structured lists")
        penalties += 8

    score = max(0, 100 - penalties)
    return {
        "score":         score,
        "issues":        issues,
        "bullet_lines":  bullet_lines,
        "note": "No major formatting issues." if not issues else "; ".join(issues[:3]),
    }


def _score_length(text: str) -> Dict:
    words  = len(text.split())
    pages  = round(words / 400, 1)   # ~400 words per resume page

    if words < 200:
        score, note = 30, "Resume too short — add more detail"
    elif words < 350:
        score, note = 55, "Resume is brief — consider expanding experience bullets"
    elif words <= 700:
        score, note = 98, "Ideal length (1 page equivalent)"
    elif words <= 1000:
        score, note = 90, "Good length (approx 2 pages)"
    elif words <= 1400:
        score, note = 75, "Slightly long — consider trimming older experience"
    else:
        score, note = 55, "Resume is very long — ATS may truncate; target 1-2 pages"

    return {
        "score": score,
        "word_count": words,
        "estimated_pages": pages,
        "note": note,
    }


def _score_quantification(text: str) -> Dict:
    patterns = [
        r"\d+\s*%", r"\$\s*\d+[kmb]?", r"\d+[kmb]\+?",
        r"\d+x", r"\d+\s*(users|customers|engineers|teams|clients)",
        r"(increased|decreased|reduced|improved|grew|saved).*?\d+",
    ]
    hits = set()
    for p in patterns:
        for m in re.finditer(p, text.lower()):
            hits.add(m.group(0)[:40])

    count = len(hits)
    if count == 0:
        score, note = 20, "No quantified achievements found — add numbers to every bullet"
    elif count < 3:
        score, note = 50, f"Only {count} quantified achievement(s) — aim for 5+"
    elif count < 6:
        score, note = 75, f"{count} quantified achievements — good, try to reach 8+"
    else:
        score, note = 95, f"{count} quantified achievements — excellent"

    return {
        "score":   score,
        "count":   count,
        "samples": list(hits)[:6],
        "note":    note,
    }


# ── Main entry point ──────────────────────────────────────────────────────────

def simulate_ats(resume_text: str, jd_text: str) -> Dict:
    """Run all 8 ATS checks and return a combined score + breakdown."""
    checks = {
        "contact_info":     _score_contact_info(resume_text),
        "section_headers":  _score_section_headers(resume_text),
        "keyword_density":  _score_keyword_density(resume_text, jd_text),
        "date_consistency": _score_date_consistency(resume_text),
        "education":        _score_education(resume_text),
        "formatting":       _score_formatting(resume_text),
        "length":           _score_length(resume_text),
        "quantification":   _score_quantification(resume_text),
    }

    # Weighted overall score
    weights = {
        "contact_info":     0.08,
        "section_headers":  0.12,
        "keyword_density":  0.25,
        "date_consistency": 0.08,
        "education":        0.07,
        "formatting":       0.15,
        "length":           0.10,
        "quantification":   0.15,
    }

    overall = sum(checks[k]["score"] * weights[k] for k in checks)
    overall = round(overall, 1)

    top_issues = []
    for key, data in sorted(checks.items(), key=lambda x: x[1]["score"]):
        if data["score"] < 70:
            top_issues.append(data["note"])
        if len(top_issues) >= 4:
            break

    return {
        "overall_ats_score": overall,
        "checks":            checks,
        "top_issues":        top_issues,
        "verdict":           "ATS-Ready" if overall >= 75 else "Needs Improvement" if overall >= 50 else "High ATS Risk",
    }
