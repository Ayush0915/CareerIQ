import pytest
from services.ai_coach import generate_course_recommendations, _fallback_course_recommendations


def test_fallback_course_recommendations():
    skill_gaps = {
        "critical": ["docker", "kubernetes"],
        "important": ["aws"],
        "optional": ["graphql"]
    }
    result = _fallback_course_recommendations(skill_gaps)
    assert isinstance(result, list)
    assert len(result) > 0
    skills_found = {c["skill"] for c in result}
    assert "docker" in skills_found
    assert "kubernetes" in skills_found
    assert "aws" in skills_found


def test_generate_course_recommendations_empty():
    skill_gaps = {"critical": [], "important": [], "optional": []}
    result = generate_course_recommendations(skill_gaps)
    assert result == []


def test_generate_course_recommendations_structure():
    skill_gaps = {
        "critical": ["fastapi"],
        "important": ["postgresql"],
        "optional": []
    }
    result = generate_course_recommendations(skill_gaps, "Backend Developer position", "Python developer resume")
    assert isinstance(result, list)
    if len(result) > 0:
        first = result[0]
        assert "title" in first
        assert "platform" in first
        assert "skill" in first
        assert "priority" in first
