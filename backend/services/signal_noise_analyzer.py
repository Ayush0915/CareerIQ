import re


# ── Phrase lists ─────────────────────────────────────────────────────────────

WEAK_PHRASES = [
    # Vague responsibility language
    "responsible for", "worked on", "helped with", "assisted in",
    "involved in", "participated in", "contributed to", "took part in",
    "supported the team", "was part of", "tasked with", "duties included",
    "duties include", "in charge of",
    # Effort without outcome
    "tried to", "attempted to", "worked to improve", "worked towards",
    # Generic soft claims
    "good communication", "team player", "hard worker", "quick learner",
    "fast learner", "detail oriented", "self-motivated", "results-driven",
    "passionate about", "enthusiastic about", "strong background in",
    # Weak openers
    "helped to", "was responsible", "was involved", "was tasked",
]

STRONG_VERBS = [
    # Engineering / Technical
    "engineered", "architected", "developed", "implemented", "designed",
    "built", "deployed", "automated", "integrated", "optimized",
    "refactored", "migrated", "scaled", "secured", "containerized",
    "orchestrated", "configured", "debugged", "profiled", "benchmarked",
    # Data / AI / ML
    "trained", "fine-tuned", "evaluated", "modelled", "analyzed",
    "visualized", "predicted", "classified", "clustered", "extracted",
    # Leadership / Impact
    "led", "spearheaded", "launched", "pioneered", "drove",
    "delivered", "shipped", "accelerated", "reduced", "increased",
    "improved", "streamlined", "transformed", "established", "founded",
    # Collaboration
    "mentored", "collaborated", "presented", "negotiated", "facilitated",
    "coordinated", "recruited", "onboarded",
]

BUZZWORDS = [
    "synergy", "leverage", "paradigm shift", "disruptive", "innovative",
    "thought leader", "guru", "ninja", "rockstar", "wizard",
    "out-of-the-box", "proactive", "go-getter", "value-add",
    "deep dive", "low-hanging fruit", "circle back", "move the needle",
    "bandwidth", "ecosystem", "holistic", "seamless", "robust",
    "bleeding edge", "cutting edge", "next-generation",
]

QUANTIFICATION_PATTERNS = [
    r"\d+\s*%",                           # percentages: 40%
    r"\$\s*\d+[kmb]?",                  # money: $500k
    r"\d+[kmb]\+?",                      # short-form: 10k, 2M+
    r"\d+\s*(users|customers|clients|engineers|developers|teams)",
    r"\d+\s*(requests|transactions|records|rows|files|queries)",
    r"\d+x",                               # multiplier: 3x
    r"\d+\s*(hours|days|weeks|months)",   # time savings
    r"\d+\s*(features|modules|services|components|apis)",
    r"from\s+\d+.*?to\s+\d+",          # from X to Y
    r"(increased|decreased|reduced|improved|grew|saved|cut).*?\d+",
]

PASSIVE_VOICE_PATTERNS = [
    r"\bwas\s+(built|developed|implemented|created|designed|managed|handled)\b",
    r"\bwere\s+(built|developed|implemented|created|designed|managed|handled)\b",
    r"\bhas\s+been\s+\w+ed\b",
    r"\bhave\s+been\s+\w+ed\b",
    r"\bwas\s+done\b",
    r"\bwas\s+completed\b",
    r"\bwas\s+used\b",
    r"\bwas\s+utilized\b",
]


# ── Helpers ───────────────────────────────────────────────────────────────────

def _split_sentences(text: str):
    sentences = re.split(r"(?<=[.\!?])\s+", text)
    return [s.strip() for s in sentences if len(s.strip()) > 12]


def _extract_experience_sections(text: str) -> str:
    """Pull lines from Experience / Projects / Work sections only."""
    lines = text.split("\n")
    capture = False
    collected = []

    for line in lines:
        ll = line.lower().strip()
        if any(kw in ll for kw in ["experience", "project", "internship", "work history", "employment"]):
            capture = True
            continue
        if any(kw in ll for kw in ["education", "certif", "award", "languages", "references"]):
            capture = False
        if capture:
            collected.append(line)

    result = " ".join(collected)
    return result if result.strip() else text   # fallback to full text


# ── Main analyser ─────────────────────────────────────────────────────────────

def analyze_signal_to_noise(resume_text: str) -> dict:
    relevant_text = _extract_experience_sections(resume_text)
    sentences     = _split_sentences(relevant_text)

    if not sentences:
        return _empty_result()

    total = len(sentences)
    weak_found    = []
    strong_found  = []
    buzzwords_found = []
    passive_count = 0
    quantified_count = 0

    for sentence in sentences:
        s = sentence.lower()

        # Weak phrases
        for phrase in WEAK_PHRASES:
            if phrase in s:
                weak_found.append(phrase)

        # Strong verbs
        for verb in STRONG_VERBS:
            if re.search(r"\b" + re.escape(verb) + r"\b", s):
                strong_found.append(verb)

        # Buzzwords
        for bw in BUZZWORDS:
            if re.search(r"\b" + re.escape(bw) + r"\b", s):
                buzzwords_found.append(bw)

        # Quantification
        if any(re.search(p, s) for p in QUANTIFICATION_PATTERNS):
            quantified_count += 1

        # Passive voice
        if any(re.search(p, s) for p in PASSIVE_VOICE_PATTERNS):
            passive_count += 1

    weak_count   = len(weak_found)
    strong_count = len(set(strong_found))

    # Scoring formula (0-100)
    weak_ratio  = weak_count  / total
    strong_ratio = min(strong_count, total) / total
    quant_ratio  = quantified_count / total

    clarity_score = (
        55
        - (weak_ratio  * 35)
        - (passive_count / max(total, 1) * 10)
        + (strong_ratio * 28)
        + (quant_ratio  * 22)
    )
    clarity_score = round(max(0.0, min(100.0, clarity_score)), 1)

    return {
        "clarity_score":        clarity_score,
        "weak_phrases_found":   list(set(weak_found)),
        "strong_verbs_found":   list(set(strong_found)),
        "quantified_sentences": quantified_count,
        "passive_voice_count":  passive_count,
        "buzzwords_found":      list(set(buzzwords_found)),
        "total_sentences_analyzed": total,
    }


def _empty_result() -> dict:
    return {
        "clarity_score": 0,
        "weak_phrases_found": [],
        "strong_verbs_found": [],
        "quantified_sentences": 0,
        "passive_voice_count": 0,
        "buzzwords_found": [],
        "total_sentences_analyzed": 0,
    }
