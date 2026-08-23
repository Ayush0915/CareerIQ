"""The Phase 5 scoring changes, each tied to a defect the harness measured.

Every test here corresponds to a number that moved on the scorecard, so a
regression shows up as a failing test rather than as a quietly worse ranking.
"""
import pytest
from services.aliases import expand
from services.evidence import (
    evidence_ratio,
    gather_evidence,
    unsupported_skills,
    weighted_coverage,
)
from services.scoring import assess_level, compute_fit, detect_jd_seniority
from services.skill_extractor import load_skills

SKILLS = load_skills()

DEMONSTRATED = """Kwame Mensah — Data Engineer

Experience
Data Engineer, Northlake  2020 - Present
- Built and operate 60 Airflow DAGs moving 2TB daily into Snowflake
- Rewrote the nightly Spark batch, cutting runtime from 6 hours to 40 minutes
- Modelled 140 dbt tables in Python and SQL

Skills: Python, SQL, Airflow, Spark, Snowflake, dbt
"""

CLAIMED_ONLY = """Alex Turner — Data Professional

Experience
Data Analyst, Vertex  2022 - Present
- Responsible for various reporting tasks
- Worked on data quality initiatives

Technical Skills
Python, SQL, Airflow, Spark, Snowflake, dbt, Docker, Kubernetes, Terraform,
AWS, GCP, Azure, Kafka, PyTorch, TensorFlow, Hadoop, Redis, MongoDB
"""

JD_SKILLS = ["python", "sql", "airflow", "spark", "snowflake", "dbt"]


class TestEvidenceWeighting:
    """Defect: a 48-item skills list with no supporting evidence ranked FIRST,
    above the engineer who had actually built the pipelines."""

    def test_demonstrated_beats_claimed(self):
        shown = weighted_coverage(gather_evidence(DEMONSTRATED, SKILLS), JD_SKILLS)
        listed = weighted_coverage(gather_evidence(CLAIMED_ONLY, SKILLS), JD_SKILLS)
        assert shown > listed, "listing a skill must not equal demonstrating it"

    def test_the_gap_is_substantial(self):
        shown = weighted_coverage(gather_evidence(DEMONSTRATED, SKILLS), JD_SKILLS)
        listed = weighted_coverage(gather_evidence(CLAIMED_ONLY, SKILLS), JD_SKILLS)
        assert shown - listed >= 20, "the penalty must be big enough to reorder"

    def test_skills_list_only_is_flagged_unsupported(self):
        evidence = gather_evidence(CLAIMED_ONLY, SKILLS)
        assert "kubernetes" in unsupported_skills(evidence)

    def test_demonstrated_skill_is_not_flagged(self):
        evidence = gather_evidence(DEMONSTRATED, SKILLS)
        assert "airflow" not in unsupported_skills(evidence)

    def test_evidence_ratio_separates_the_two(self):
        assert evidence_ratio(gather_evidence(DEMONSTRATED, SKILLS)) > evidence_ratio(
            gather_evidence(CLAIMED_ONLY, SKILLS)
        )

    def test_empty_resume(self):
        assert weighted_coverage(gather_evidence("", SKILLS), JD_SKILLS) == 0.0

    def test_no_jd_skills(self):
        assert weighted_coverage(gather_evidence(DEMONSTRATED, SKILLS), []) == 0.0


class TestAliases:
    """Defect: byte-equivalent candidates scored 68.9 and 81.4 — a 12.5 point
    gap — because one wrote K8s and the other wrote Kubernetes."""

    @pytest.mark.parametrize(
        "abbreviated,canonical",
        [
            ("ran k8s in prod", "kubernetes"),
            ("postgres tuning", "postgresql"),
            ("gha pipelines", "github actions"),
            ("prom and grafana", "prometheus"),
            ("wrote py tooling", "python"),
            ("sklearn models", "scikit-learn"),
            ("cicd ownership", "ci/cd"),
        ],
    )
    def test_abbreviation_expands(self, abbreviated, canonical):
        assert canonical in expand(abbreviated)

    def test_abbreviation_inside_a_word_is_left_alone(self):
        assert "javascript" not in expand("node.js services")

    def test_empty(self):
        assert expand("") == ""


class TestAmbiguousAliases:
    """TF is Terraform on an infra resume and TensorFlow on an ML one. A fixed
    mapping read a platform engineer's Terraform experience as TensorFlow."""

    def test_infra_context_resolves_to_terraform(self):
        out = expand("managed k8s clusters and wrote tf modules for aws provisioning")
        assert "terraform" in out
        assert "tensorflow" not in out

    def test_ml_context_resolves_to_tensorflow(self):
        out = expand("trained tf models with keras on a large dataset")
        assert "tensorflow" in out
        assert "terraform" not in out

    def test_no_context_leaves_it_alone(self):
        """A wrong expansion is worse than a missed one."""
        out = expand("used tf daily")
        assert "terraform" not in out and "tensorflow" not in out


class TestLevelFit:
    """Defect: a principal engineer with 15 years ranked SECOND for a role
    advertised at 0-2 years, because seniority was computed and never used."""

    def test_junior_posting_is_detected(self):
        assert detect_jd_seniority("Junior Developer, 0-2 years experience") == "junior"

    def test_senior_posting_is_detected(self):
        assert detect_jd_seniority("Staff Engineer, architecture ownership") == "senior"

    def test_unspecified(self):
        assert detect_jd_seniority("We build payment systems.") == "unspecified"

    def test_senior_candidate_penalised_for_junior_role(self):
        fit = assess_level(15, 0, "Junior Frontend Developer. This is a junior role.")
        assert fit.verdict == "overqualified"
        assert fit.multiplier < 0.8

    def test_graduate_not_penalised_for_junior_role(self):
        """A junior posting states a ceiling, not a floor — penalising a
        graduate for having no experience inverts the role's intent."""
        fit = assess_level(0, 2, "Junior Developer, 0-2 years. Hiring for trajectory.")
        assert fit.multiplier == 1.0
        assert fit.verdict == "appropriate"

    def test_appropriate_experience_is_unpenalised(self):
        fit = assess_level(6, 5, "Senior Engineer, 5+ years required")
        assert fit.multiplier == 1.0

    def test_short_of_a_stated_requirement(self):
        fit = assess_level(1, 8, "Principal Engineer, 8+ years required")
        assert fit.verdict == "underqualified"
        assert fit.multiplier < 1.0


class TestClarityDamping:
    """Defect: a brand designer (grade 0) outranked a sysadmin (grade 1) for a
    platform role, because the designer's prose was better. Both matched zero
    required skills, so writing quality decided relevance."""

    def test_clarity_is_damped_when_nothing_matches(self):
        irrelevant = compute_fit(
            semantic_score=50, coverage_score=0, clarity_score=95, jd_text="Platform Engineer"
        )
        relevant = compute_fit(
            semantic_score=50, coverage_score=0, clarity_score=20, jd_text="Platform Engineer"
        )
        assert irrelevant.overall - relevant.overall < 5

    def test_clarity_counts_fully_for_a_real_match(self):
        strong = compute_fit(
            semantic_score=70, coverage_score=90, clarity_score=95, jd_text="Platform Engineer"
        )
        weak = compute_fit(
            semantic_score=70, coverage_score=90, clarity_score=20, jd_text="Platform Engineer"
        )
        assert strong.overall - weak.overall > 8


class TestComputeFit:
    def test_score_is_bounded(self):
        fit = compute_fit(semantic_score=100, coverage_score=100, clarity_score=100)
        assert 0 <= fit.overall <= 100

    def test_zero_input_is_zero(self):
        assert compute_fit(semantic_score=0, coverage_score=0, clarity_score=0).overall == 0.0

    def test_components_are_reported(self):
        fit = compute_fit(semantic_score=70, coverage_score=60, clarity_score=80)
        assert fit.semantic == 70 and fit.coverage == 60 and fit.clarity == 80

    def test_padded_resume_gets_a_note(self):
        fit = compute_fit(
            semantic_score=60,
            coverage_score=40,
            clarity_score=50,
            evidence_ratio_value=0.1,
            unsupported=[f"skill{i}" for i in range(15)],
        )
        assert any("never shown in context" in note for note in fit.notes)

    def test_serializes(self):
        payload = compute_fit(semantic_score=70, coverage_score=60, clarity_score=80).to_dict()
        assert "level" in payload and payload["level"]["multiplier"] == 1.0
