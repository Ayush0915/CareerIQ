def classify_skill_gaps(missing_skills, jd_skills, jd_text):

    classification = {
        "critical": [],
        "important": [],
        "optional": []
    }

    jd_text = jd_text.lower()

    for skill in missing_skills:

        frequency = jd_text.count(skill)

        if frequency >= 2:
            classification["critical"].append(skill)

        elif frequency == 1:
            classification["important"].append(skill)

        else:
            classification["optional"].append(skill)

    return classification