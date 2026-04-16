import re


SECTION_KEYWORDS = {
    "summary":    ["summary", "objective", "profile", "about", "overview"],
    "experience": ["experience", "work history", "employment", "internship", "work experience"],
    "education":  ["education", "academic", "qualification", "degree", "university", "college"],
    "skills":     ["skills", "technical skills", "core competencies", "technologies", "tools"],
    "projects":   ["projects", "personal projects", "academic projects", "portfolio"],
    "certifications": ["certification", "certificate", "courses", "training", "achievements"],
}


def parse_sections(text: str) -> dict:
    lines = text.split("\n")
    sections = {k: [] for k in SECTION_KEYWORDS}
    sections["other"] = []
    current_section = "other"

    for line in lines:
        line_lower = line.lower().strip()
        matched = False
        for section, keywords in SECTION_KEYWORDS.items():
            if any(kw in line_lower for kw in keywords) and len(line_lower) < 50:
                current_section = section
                matched = True
                break
        if not matched and line.strip():
            sections[current_section].append(line.strip())

    return {k: "\n".join(v) for k, v in sections.items()}


def score_sections(sections: dict) -> dict:
    scores = {}
    for section, content in sections.items():
        if section == "other":
            continue
        words = len(content.split())
        has_numbers = bool(re.search(r'\d+', content))
        has_bullets = bool(re.search(r'[-•*]', content))

        if words == 0:
            scores[section] = 0
        elif words < 20:
            scores[section] = 30
        elif words < 50:
            scores[section] = 50 + (20 if has_numbers else 0)
        else:
            base = 65
            if has_numbers:
                base += 15
            if has_bullets:
                base += 10
            scores[section] = min(100, base)

    return scores