"""Experience detection, scoped to the section that actually describes work.

The defect these cover: year ranges were matched across the whole document and
summed, so a degree dated 2019-2023 contributed four years of "experience" on
top of the real jobs. detected_years feeds assess_level(), which turns it into a
multiplier on the final score, so the over-count moved rankings — a candidate
three years into their career was scored as senior.
"""
import datetime

from services.experience_detector import detect_experience

CURRENT_YEAR = datetime.date.today().year

# The case from the bug report: one job, one degree, dates in both.
EXPERIENCE_AND_EDUCATION = """Priya Raman — Backend Engineer

Experience
Backend Engineer, Meridian Payments
2023 - Present
- Built and operated Python services handling 4.2M transactions per day
- Cut p99 checkout latency from 840ms to 310ms

Education
B.S. Computer Science, State University
2019 - 2023
"""

# No headings this parser recognises, so there is nothing to scope to.
UNSECTIONED = """Sam Okafor

Backend Engineer, Meridian Payments  2023 - Present
- Built Python services

B.S. Computer Science, State University  2019 - 2023
"""

JD = "We are looking for a backend engineer with 5+ years of experience."


class TestSectionScoping:
    def test_education_dates_are_not_counted_as_experience(self):
        """The whole point: 2019-2023 in Education must not add four years."""
        result = detect_experience(EXPERIENCE_AND_EDUCATION, JD)

        experience_only = CURRENT_YEAR - 2023
        buggy_sum = experience_only + 4  # what summing both ranges produced

        assert result["detected_years"] == experience_only
        assert result["detected_years"] != buggy_sum

    def test_experience_section_found_means_full_confidence(self):
        result = detect_experience(EXPERIENCE_AND_EDUCATION, JD)
        assert result["low_confidence"] is False

    def test_projects_and_certifications_are_also_excluded(self):
        resume = """Dev Patel

Experience
Engineer, Acme
2022 - 2024
- Shipped things

Projects
Portfolio site
2015 - 2019

Certifications
AWS Solutions Architect
2016 - 2020
"""
        # Only the 2022-2024 range counts; the other two would add eight years.
        assert detect_experience(resume, "")["detected_years"] == 2

    def test_multiple_jobs_in_the_section_still_sum(self):
        """Scoping must not break the ordinary case of consecutive roles."""
        resume = """Lin Wei

Experience
Senior Engineer, Beta Corp
2021 - 2024
- Led the platform team

Engineer, Alpha Inc
2018 - 2021
- Built the ingest pipeline

Education
B.S. Computer Science
2014 - 2018
"""
        assert detect_experience(resume, "")["detected_years"] == 6


class TestFallback:
    def test_unsectioned_resume_falls_back_to_whole_document(self):
        result = detect_experience(UNSECTIONED, JD)
        assert result["detected_years"] > 0

    def test_fallback_is_flagged_as_low_confidence(self):
        assert detect_experience(UNSECTIONED, JD)["low_confidence"] is True

    def test_empty_resume_does_not_raise(self):
        result = detect_experience("", JD)
        assert result["detected_years"] == 0
        assert result["low_confidence"] is True


class TestExplicitClaims:
    def test_explicit_years_in_a_summary_are_still_read(self):
        """Written above any heading, so scoping must not swallow them."""
        resume = """Ana Silva
Senior engineer with 9 years of experience.

Experience
Engineer, Acme
2023 - Present
- Shipped things
"""
        assert detect_experience(resume, "")["detected_years"] == 9

    def test_explicit_claim_does_not_lower_a_longer_measured_history(self):
        resume = """Ravi Kumar
Engineer with 2 years of experience in Go.

Experience
Engineer, Acme
2012 - 2024
- Shipped things
"""
        assert detect_experience(resume, "")["detected_years"] == 12


class TestContractIsUnchanged:
    """assess_level() consumes this dict, so the shape must not drift."""

    def test_returns_every_key_scoring_depends_on(self):
        result = detect_experience(EXPERIENCE_AND_EDUCATION, JD)
        for key in (
            "detected_years",
            "required_years",
            "level",
            "meets_requirement",
            "gap_years",
        ):
            assert key in result

    def test_required_years_still_read_from_the_job_description(self):
        result = detect_experience(EXPERIENCE_AND_EDUCATION, JD)
        assert result["required_years"] == 5

    def test_level_and_gap_follow_the_corrected_years(self):
        result = detect_experience(EXPERIENCE_AND_EDUCATION, JD)
        detected = result["detected_years"]

        expected_level = "junior" if detected < 2 else "mid" if detected < 5 else "senior"
        assert result["level"] == expected_level
        assert result["gap_years"] == max(0, 5 - detected)
        assert result["meets_requirement"] is (detected >= 5)

    def test_result_still_constructs_the_response_model(self):
        from models.schemas import ExperienceInfo

        info = ExperienceInfo(**detect_experience(EXPERIENCE_AND_EDUCATION, JD))
        assert info.detected_years == CURRENT_YEAR - 2023
