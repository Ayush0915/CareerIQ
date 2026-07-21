import pytest
from services.ats_simulator import (
    simulate_ats,
    _score_contact_info,
    _score_section_headers,
    _score_keyword_density,
    _score_date_consistency,
    _score_education,
    _score_formatting,
    _score_length,
    _score_quantification,
)


@pytest.fixture
def valid_resume_text():
    return """
    Jane Doe
    email: jane.doe@example.com
    phone: +1-555-0199
    linkedin.com/in/janedoe
    github.com/janedoe

    Summary
    Accomplished Senior Software Engineer with over eight years of hands-on experience designing, developing, and deploying high-performance distributed systems, cloud-native microservices, and enterprise web applications using Python, FastAPI, Docker, Kubernetes, and PostgreSQL. Proven track record of leading cross-functional engineering teams, optimizing database queries, implementing automated CI/CD pipelines, and driving technical excellence across large-scale software engineering projects.

    Objective
    Seeking a Senior Software Engineer position at a growth-oriented technology organization where I can leverage my expertise in cloud architecture, backend systems development, and team leadership to build reliable, high-throughput, and scalable software solutions.

    Experience
    Senior Software Engineer - Tech Corp
    Jan 2021 - Present
    • Architected and implemented scalable microservices using Python, FastAPI, PostgreSQL, and Redis caching to serve over two million monthly active users.
    • Led a high-performing engineering team of 5 software developers in delivering enterprise features ahead of quarterly sprint deadlines.
    • Improved database query execution speed by 45% through strategic indexing and query optimization techniques, leading to significant system performance gains.
    • Reduced cloud infrastructure server costs by $12k annually by optimizing resource utilization, implementing container auto-scaling, and tuning memory allocations.
    • Increased overall user conversion rate by 20% across 100k active users by re-engineering key user onboarding flows and backend REST API endpoints.

    Software Developer - Dev Solutions
    Mar 2018 - Dec 2020
    • Developed robust automated testing pipelines using Pytest and GitHub Actions, increasing test suite coverage from 50% to 80%.
    • Reduced system deployment downtime by 50% through zero-downtime deployment strategies and automated blue-green environment rollouts.
    • Collaborated closely with product managers, UX designers, and frontend engineers to design clean, RESTful APIs and modern GraphQL interfaces.
    • Monitored microservice health, error rates, and system telemetry using Prometheus and Grafana dashboards.

    Projects
    • Created and maintained an open-source Python web framework library with over 1,000 GitHub stars and 50 community contributors.
    • Architected a real-time data streaming pipeline using Apache Kafka and Python to process sensor telemetry data efficiently.

    Education
    Bachelor of Science in Computer Science - University of Technology
    Graduated May 2018

    Certifications
    AWS Certified Solutions Architect – Associate Level
    Certified Kubernetes Application Developer (CKAD)

    Skills
    Programming Languages: Python, JavaScript, TypeScript, SQL, Bash
    Frameworks & Tools: FastAPI, Django, Flask, Pytest, Docker, Kubernetes, Git, CI/CD pipelines, Redis, PostgreSQL, MongoDB

    Awards
    Developer of the Year Award 2022 - Tech Corp

    Publications
    Building High Performance Microservices with Python and FastAPI - Published in Tech Journal 2023
    """


@pytest.fixture
def valid_jd_text():
    return """
    We are looking for a Senior Software Engineer skilled in Python, FastAPI, Docker, and PostgreSQL.
    Responsibilities include leading software engineers, building microservices, and optimizing API performance.
    Requirements: Bachelor degree in Computer Science, experience with CI/CD and Docker.
    """


class TestATSSimulatorNormalCases:
    def test_simulate_ats_normal(self, valid_resume_text, valid_jd_text):
        result = simulate_ats(valid_resume_text, valid_jd_text)

        assert isinstance(result, dict)
        assert "overall_ats_score" in result
        assert "checks" in result
        assert "top_issues" in result
        assert "verdict" in result

        assert result["overall_ats_score"] >= 75.0
        assert result["verdict"] == "ATS-Ready"

        checks = result["checks"]
        expected_checks = [
            "contact_info",
            "section_headers",
            "keyword_density",
            "date_consistency",
            "education",
            "formatting",
            "length",
            "quantification",
        ]
        for check in expected_checks:
            assert check in checks
            assert "score" in checks[check]
            assert 0 <= checks[check]["score"] <= 100

    def test_individual_scorers_normal(self, valid_resume_text, valid_jd_text):
        contact = _score_contact_info(valid_resume_text)
        assert contact["score"] == 100
        assert len(contact["missing"]) == 0

        headers = _score_section_headers(valid_resume_text)
        assert headers["score"] > 80
        assert len(headers["critical_missing"]) == 0

        keywords = _score_keyword_density(valid_resume_text, valid_jd_text)
        assert keywords["score"] > 50
        assert keywords["matched_count"] > 0

        dates = _score_date_consistency(valid_resume_text)
        assert dates["score"] >= 75
        assert not dates["gap_detected"]

        edu = _score_education(valid_resume_text)
        assert edu["score"] == 95
        assert "bachelor" in edu["degrees_found"]

        length = _score_length(valid_resume_text)
        assert length["score"] >= 75
        assert length["word_count"] > 100


class TestATSSimulatorEmptyInput:
    def test_simulate_ats_empty_resume_and_jd(self):
        result = simulate_ats("", "")

        assert isinstance(result, dict)
        assert "overall_ats_score" in result
        assert result["verdict"] == "High ATS Risk"
        assert len(result["checks"]) == 8

    def test_score_keyword_density_empty(self):
        kw_empty = _score_keyword_density("", "")
        assert kw_empty["score"] == 0
        assert kw_empty["matched_count"] == 0

    def test_score_contact_info_empty(self):
        contact = _score_contact_info("")
        assert contact["score"] == 0
        assert len(contact["missing"]) == 4


class TestATSSimulatorEdgeCases:
    def test_very_short_resume_text(self, valid_jd_text):
        short_resume = "John Doe"
        result = simulate_ats(short_resume, valid_jd_text)

        assert result["verdict"] == "High ATS Risk"
        assert result["checks"]["length"]["score"] == 30
        assert result["checks"]["length"]["word_count"] == 2

    def test_no_matching_skills_with_jd(self):
        resume = """
        John Smith
        john@example.com
        +1-555-0100
        linkedin.com/in/jsmith

        Experience
        Jan 2020 - Dec 2022
        • Baked 500 cakes for local bakery operations.
        • Managed pastry inventory and flour shipments.

        Education
        Bachelor of Culinary Arts 2019

        Skills
        Baking, Pastry, Cake Decoration, Oven Maintenance
        """
        jd = """
        Looking for a Quantum Computing Researcher with expertise in Qiskit, Q#, qubit manipulation, and superconduction.
        """
        result = simulate_ats(resume, jd)
        assert result["checks"]["keyword_density"]["score"] == 0
        assert result["checks"]["keyword_density"]["matched_count"] == 0

    def test_forbidden_formatting_elements(self, valid_jd_text):
        bad_resume = """
        | Header 1 | Header 2 |
        |---|---|
        | Experience | Details |
        page 1 of 2
        [photo]
        Special symbol: 😃
        """
        formatting = _score_formatting(bad_resume)
        assert formatting["score"] < 70
        assert len(formatting["issues"]) >= 3

    def test_employment_gap_detected(self):
        resume_with_gap = """
        John Doe
        john@example.com
        +1-555-0199
        linkedin.com/in/johndoe

        Experience
        Jan 2015 - Dec 2016
        • Worked on legacy systems.

        Jan 2021 - Present
        • Worked on new software.

        Education
        Bachelor of Science 2014

        Skills
        Python
        """
        dates = _score_date_consistency(resume_with_gap)
        assert dates["gap_detected"] is True
        assert dates["score"] == 75  # 85 - 10 penalty
