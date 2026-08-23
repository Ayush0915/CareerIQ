"""Text normalization shared by every consumer of resume / JD text.

The critical invariant: the resume and the job description must be normalized
by the *same* function before skill extraction.  The previous implementation
ran the resume through a cleaner that stripped every non-alphanumeric
character while passing the job description through raw, so ``c++``, ``c#``,
``.net``, ``node.js`` and ``ci/cd`` survived on the JD side and were destroyed
on the resume side.  Every role requiring those skills reported them missing.
"""
import re

# Characters that carry meaning inside real skill names:
#   c++, c#, f#, .net, node.js, ci/cd, scikit-learn, ui/ux
SKILL_CHARS = r"a-z0-9+#./\-"

# Boundary class used when matching a skill inside normalized text.  Narrower
# than SKILL_CHARS on purpose: "/" and "." may sit next to a match so that
# "c#/java" yields both skills, while "+" and "#" may not, so the single-letter
# skill "c" cannot match inside "c++".
SKILL_BOUNDARY = "a-z0-9+#"

_EMAIL_RE = re.compile(r"\S+@\S+")
_URL_RE = re.compile(r"https?://\S+|www\.\S+")
_NON_SKILL_RE = re.compile(rf"[^{SKILL_CHARS}\s]")
# "+"/"#" runs that do not attach to a word: keeps "c++", drops "+++"
_LOOSE_PLUS_RE = re.compile(r"(?<![a-z0-9+#])[+#]+")
# "." "/" "-" runs not followed by an alphanumeric: keeps "node.js" and ".net",
# drops the trailing dot in "python."
_LOOSE_PUNCT_RE = re.compile(r"[./-]+(?![a-z0-9])")
_WS_RE = re.compile(r"\s+")


def normalize(text: str) -> str:
    """Lowercase, strip contact noise, and collapse whitespace.

    Punctuation that forms part of a skill name is preserved; punctuation used
    as ordinary sentence furniture is not.
    """
    if not text:
        return ""

    text = text.lower()
    text = _EMAIL_RE.sub(" ", text)
    text = _URL_RE.sub(" ", text)
    text = _NON_SKILL_RE.sub(" ", text)
    text = _LOOSE_PLUS_RE.sub(" ", text)
    text = _LOOSE_PUNCT_RE.sub(" ", text)
    text = _WS_RE.sub(" ", text).strip()
    return text


def clean_text(text: str) -> str:
    """Backwards-compatible alias for :func:`normalize`."""
    return normalize(text)
