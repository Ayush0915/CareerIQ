"""Strip personal identifiers before text leaves the process.

Why this exists: the free OpenRouter endpoints require consenting to providers
that train on request data, and some publish prompts and completions to public
datasets. A resume is dense with personal data — name, phone, email, social
handles, sometimes a home address — and none of it contributes anything to a
fit assessment. The model is judging skills and achievements, not identity.

So the identifiers are removed before the prompt is built. This is not a
substitute for choosing an endpoint you trust; it means that when the endpoint
is untrustworthy, what leaks is a skills profile rather than a person.
"""
from __future__ import annotations

import re

EMAIL_RE = re.compile(r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}")
# Deliberately conservative: needs a separator or a leading +, so that
# "processed 4500000 records" is not mistaken for a phone number.
PHONE_RE = re.compile(
    r"(?:\+\d{1,3}[\s.\-]?)?(?:\(\d{2,4}\)[\s.\-]?)?\d{3,5}[\s.\-]\d{3,5}(?:[\s.\-]\d{2,5})?"
)
LINKEDIN_RE = re.compile(r"(?:https?://)?(?:www\.)?linkedin\.com/in/[\w\-%]+/?", re.I)
GITHUB_RE = re.compile(r"(?:https?://)?(?:www\.)?github\.com/[\w\-.]+/?", re.I)
URL_RE = re.compile(r"https?://[^\s)>\]]+")

EMAIL_TOKEN = "[EMAIL]"
PHONE_TOKEN = "[PHONE]"
LINKEDIN_TOKEN = "[LINKEDIN]"
GITHUB_TOKEN = "[GITHUB]"
URL_TOKEN = "[URL]"
NAME_TOKEN = "[CANDIDATE]"


def redact(text: str, names: list[str] | None = None) -> tuple[str, dict[str, int]]:
    """Return the text with identifiers replaced, plus a count per category.

    Order matters: social URLs are matched before the generic URL rule so they
    keep their specific token, and emails before phones so an email containing
    digits is not partly eaten by the phone pattern.
    """
    if not text:
        return "", {}

    counts: dict[str, int] = {}

    def substitute(pattern: re.Pattern, token: str, label: str, subject: str) -> str:
        replaced, hits = pattern.subn(token, subject)
        if hits:
            counts[label] = counts.get(label, 0) + hits
        return replaced

    out = text
    out = substitute(EMAIL_RE, EMAIL_TOKEN, "email", out)
    out = substitute(LINKEDIN_RE, LINKEDIN_TOKEN, "linkedin", out)
    out = substitute(GITHUB_RE, GITHUB_TOKEN, "github", out)
    out = substitute(URL_RE, URL_TOKEN, "url", out)
    out = substitute(PHONE_RE, PHONE_TOKEN, "phone", out)

    for name in names or []:
        cleaned = (name or "").strip()
        # Two characters would match far too much; a full name is the target.
        if len(cleaned) < 3:
            continue
        pattern = re.compile(re.escape(cleaned), re.I)
        out = substitute(pattern, NAME_TOKEN, "name", out)
        # Also catch the given name used alone later in the document.
        first = cleaned.split()[0]
        if len(first) >= 3:
            out = substitute(
                re.compile(rf"\b{re.escape(first)}\b", re.I), NAME_TOKEN, "name", out
            )

    return out, counts


def redact_for_prompt(text: str, contact_info: dict[str, str] | None = None) -> str:
    """Convenience wrapper taking the parser's contact_info dict."""
    names = []
    if contact_info:
        candidate_name = contact_info.get("name", "")
        if candidate_name:
            names.append(candidate_name)
    redacted, _ = redact(text, names=names)
    return redacted
