import time
from unittest.mock import patch
import pytest
from services.llm_evaluator import (
    llm_master_evaluate,
    _eval_cache,
    _get_cache_key,
    CACHE_TTL,
)


@pytest.fixture(autouse=True)
def clear_llm_cache():
    _eval_cache.clear()
    yield
    _eval_cache.clear()


def test_llm_evaluator_cache_hit():
    resume = "Jane Doe\nExperienced Python developer with Django and AWS expertise."
    jd = "Looking for a Senior Python Engineer with AWS experience."

    dummy_json_response = """
    {
        "overall_score": 85,
        "experience_level": "senior",
        "years_detected": "5 years",
        "section_scores": {"experience": 85, "skills": 90, "education": 80, "projects": 85, "summary": 80},
        "keyword_analysis": {"present": ["python", "aws"], "missing_critical": [], "missing_recommended": []},
        "grammar_issues": [],
        "cliches_found": [],
        "readability_score": 90,
        "passive_voice_count": 0,
        "quantified_achievements": 3,
        "section_feedback": {"experience": "Good fit", "skills": "Strong", "projects": "Solid", "summary": "Clear"},
        "top_improvements": ["Add metrics"],
        "ats_compatibility": 88,
        "job_match_reasoning": "Strong match",
        "interview_questions": ["Tell me about AWS experience"],
        "resume_strengths": ["Python expertise"],
        "salary_insight": "$120k-$150k",
        "competition_level": "medium",
        "fit_verdict": "strong_fit"
    }
    """

    with patch("services.llm_evaluator._call_llm", return_value=dummy_json_response) as mock_llm:
        res1 = llm_master_evaluate(resume, jd)
        assert res1["overall_score"] == 85
        assert mock_llm.call_count == 1

        # Second call with identical input should hit cache and NOT invoke _call_llm again
        res2 = llm_master_evaluate(resume, jd)
        assert res2["overall_score"] == 85
        assert mock_llm.call_count == 1
        assert res1 == res2


def test_llm_evaluator_cache_miss_different_input():
    resume1 = "Alice Smith\nFrontend Engineer with React and TypeScript."
    resume2 = "Bob Jones\nBackend Engineer with Go and Kubernetes."
    jd = "Seeking Fullstack Software Engineer."

    dummy_json_response = """
    {
        "overall_score": 75,
        "experience_level": "mid",
        "years_detected": "3 years",
        "section_scores": {"experience": 75, "skills": 75, "education": 75, "projects": 75, "summary": 75},
        "keyword_analysis": {"present": [], "missing_critical": [], "missing_recommended": []},
        "grammar_issues": [],
        "cliches_found": [],
        "readability_score": 80,
        "passive_voice_count": 0,
        "quantified_achievements": 1,
        "section_feedback": {"experience": "Good", "skills": "OK", "projects": "Good", "summary": "OK"},
        "top_improvements": [],
        "ats_compatibility": 75,
        "job_match_reasoning": "Decent fit",
        "interview_questions": [],
        "resume_strengths": [],
        "salary_insight": "",
        "competition_level": "medium",
        "fit_verdict": "good_fit"
    }
    """

    with patch("services.llm_evaluator._call_llm", return_value=dummy_json_response) as mock_llm:
        res1 = llm_master_evaluate(resume1, jd)
        res2 = llm_master_evaluate(resume2, jd)

        assert mock_llm.call_count == 2
        assert res1 == res2


def test_llm_evaluator_cache_expiration():
    resume = "Charlie Brown\nData Scientist with PyTorch."
    jd = "Looking for Data Scientist."

    dummy_json_response = """
    {
        "overall_score": 90,
        "experience_level": "senior",
        "years_detected": "6 years",
        "section_scores": {"experience": 90, "skills": 90, "education": 90, "projects": 90, "summary": 90},
        "keyword_analysis": {"present": ["pytorch"], "missing_critical": [], "missing_recommended": []},
        "grammar_issues": [],
        "cliches_found": [],
        "readability_score": 95,
        "passive_voice_count": 0,
        "quantified_achievements": 4,
        "section_feedback": {"experience": "Excellent", "skills": "Top", "projects": "Great", "summary": "Clear"},
        "top_improvements": [],
        "ats_compatibility": 92,
        "job_match_reasoning": "Excellent fit",
        "interview_questions": [],
        "resume_strengths": [],
        "salary_insight": "",
        "competition_level": "low",
        "fit_verdict": "strong_fit"
    }
    """

    with patch("services.llm_evaluator._call_llm", return_value=dummy_json_response) as mock_llm:
        llm_master_evaluate(resume, jd)
        assert mock_llm.call_count == 1

        # Simulate time passing beyond TTL (e.g. 601 seconds)
        cache_key = _get_cache_key(resume, jd)
        old_time, val = _eval_cache[cache_key]
        _eval_cache[cache_key] = (old_time - (CACHE_TTL + 5), val)

        # Evaluating again should miss cache and trigger a new LLM call
        llm_master_evaluate(resume, jd)
        assert mock_llm.call_count == 2
