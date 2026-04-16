import re


def detect_experience(resume_text: str, job_description: str) -> dict:
    text = resume_text.lower()

    # Extract year ranges like 2019-2023 or 2019 - present
    year_ranges = re.findall(
        r'(20\d{2})\s*[-–to]+\s*(20\d{2}|present|current|now)',
        text
    )

    total_years = 0
    for start, end in year_ranges:
        start_yr = int(start)
        end_yr = 2024 if end in ['present', 'current', 'now'] else int(end)
        total_years += max(0, end_yr - start_yr)

    # Also check explicit mentions
    explicit = re.findall(r'(\d+)\+?\s*years?\s*(of\s*)?(experience)?', text)
    explicit_years = [int(m[0]) for m in explicit if int(m[0]) < 30]

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
        "gap_years": max(0, required_years - detected_years)
    }