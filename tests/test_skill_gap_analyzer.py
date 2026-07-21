import pytest
from services.skill_gap_analyzer import classify_skill_gaps


class TestSkillGapAnalyzerNormalCases:
    def test_classify_skill_gaps_normal(self):
        missing_skills = ["docker", "kubernetes", "aws", "graphql"]
        jd_skills = ["python", "docker", "kubernetes", "aws", "graphql"]
        jd_text = (
            "We need strong experience in docker deployment. Docker containers are essential. "
            "Kubernetes experience is preferred. Knowledge of aws cloud is nice to have."
        )

        result = classify_skill_gaps(missing_skills, jd_skills, jd_text)

        assert isinstance(result, dict)
        assert set(result.keys()) == {"critical", "important", "optional"}

        # "docker" appears 2 times in jd_text -> critical
        assert "docker" in result["critical"]

        # "kubernetes" appears 1 time in jd_text -> important
        assert "kubernetes" in result["important"]

        # "aws" appears 1 time in jd_text -> important
        assert "aws" in result["important"]

        # "graphql" appears 0 times in jd_text -> optional
        assert "graphql" in result["optional"]


class TestSkillGapAnalyzerEmptyInput:
    def test_empty_missing_skills_and_empty_jd(self):
        result = classify_skill_gaps([], [], "")
        assert result == {"critical": [], "important": [], "optional": []}

    def test_missing_skills_with_empty_jd(self):
        missing_skills = ["python", "fastapi"]
        result = classify_skill_gaps(missing_skills, [], "")
        assert result == {
            "critical": [],
            "important": [],
            "optional": ["python", "fastapi"],
        }


class TestSkillGapAnalyzerEdgeCases:
    def test_no_missing_skills(self):
        jd_text = "Python FastAPI Docker Kubernetes PostgreSQL"
        result = classify_skill_gaps([], ["python", "fastapi"], jd_text)
        assert result == {"critical": [], "important": [], "optional": []}

    def test_case_insensitivity_in_jd_text(self):
        missing_skills = ["python"]
        jd_text = "PYTHON is required. Python skills are mandatory for this role."

        result = classify_skill_gaps(missing_skills, ["python"], jd_text)
        assert "python" in result["critical"]

    def test_no_matching_skills_in_jd_text(self):
        missing_skills = ["react", "vue", "angular"]
        jd_text = "We are seeking a C++ Embedded Firmware Engineer working with microcontroller hardware."

        result = classify_skill_gaps(missing_skills, [], jd_text)
        assert result["critical"] == []
        assert result["important"] == []
        assert set(result["optional"]) == {"react", "vue", "angular"}

    def test_high_frequency_critical_skills(self):
        missing_skills = ["redis"]
        jd_text = "Redis caching. Redis cluster. Redis pub/sub. Redis persistence."

        result = classify_skill_gaps(missing_skills, ["redis"], jd_text)
        assert result["critical"] == ["redis"]
        assert result["important"] == []
        assert result["optional"] == []
