def get_missing_skills(resume_skills: list, jd_skills: list) -> list:
    """Return skills present in JD but missing in resume"""
    return list(set(jd_skills) - set(resume_skills))


def get_matching_skills(resume_skills: list, jd_skills: list) -> list:
    """Return common skills"""
    return list(set(resume_skills).intersection(set(jd_skills)))


def generate_feedback(match_score: float, missing_skills: list) -> str:
    """Generate feedback message"""

    if match_score > 70:
        level = "Excellent Match"
    elif match_score > 40:
        level = "Moderate Match"
    else:
        level = "Low Match"

    feedback = f"Overall Match Level: {level}\n\n"

    if missing_skills:
        feedback += "You should improve these skills:\n"
        feedback += ", ".join(missing_skills)
    else:
        feedback += "Great! You match all key skills."

    return feedback


def calculate_keyword_coverage(resume_skills: list, jd_skills: list) -> float:
    if not jd_skills:
        return 0.0

    matched = len(set(resume_skills).intersection(set(jd_skills)))
    total = len(set(jd_skills))

    coverage = (matched / total) * 100
    return round(coverage, 2)


def generate_feedback(match_score: float, missing_skills: list) -> str:

    if match_score >= 75:
        level = "Strong Alignment"
    elif match_score >= 50:
        level = "Moderate Alignment"
    else:
        level = "Low Alignment"

    feedback = f"🔎 Semantic Alignment Level: {level}\n\n"
    feedback += f"📊 Match Score: {match_score}%\n\n"

    if missing_skills:
        feedback += "⚠ Missing Skills Detected:\n"
        for skill in missing_skills:
            feedback += f"- {skill}\n"
    else:
        feedback += "✅ No major skill gaps detected.\n"

    feedback += "\n💡 Recommendation: Add quantified achievements and align projects closely with job requirements."

    return feedback