"""Personal identifiers must not reach the model.

Free OpenRouter endpoints require consenting to providers that may train on
request data, and some publish prompts to public datasets. A resume is dense
with personal data and none of it contributes to a fit assessment, so it is
stripped before the prompt is built.
"""
import pytest

from core.redact import redact, redact_for_prompt
from services.llm_evaluator import build_prompt

RESUME = """Rebecca Lauren Ashford
rebecca.ashford@example.com | +1 (206) 555-0188
linkedin.com/in/rlashford | github.com/rlashford
Portfolio: https://rebecca.dev

Experience
Senior Frontend Engineer, Windrow  2019 - Present
- Led the React rebuild serving 90k monthly users
- Reduced LCP from 4.1s to 1.2s across the top 20 routes
- Rebecca also mentored three junior engineers
"""


class TestIdentifierRemoval:
    def test_email_removed(self):
        out, counts = redact(RESUME)
        assert "rebecca.ashford@example.com" not in out
        assert "[EMAIL]" in out
        assert counts["email"] == 1

    def test_phone_removed(self):
        out, _ = redact(RESUME)
        assert "555-0188" not in out
        assert "[PHONE]" in out

    def test_linkedin_removed(self):
        out, _ = redact(RESUME)
        assert "rlashford" not in out.split("[GITHUB]")[0].replace("[LINKEDIN]", "")
        assert "[LINKEDIN]" in out

    def test_github_removed(self):
        out, _ = redact(RESUME)
        assert "github.com/rlashford" not in out
        assert "[GITHUB]" in out

    def test_generic_url_removed(self):
        out, _ = redact(RESUME)
        assert "rebecca.dev" not in out

    def test_name_removed_when_supplied(self):
        out, counts = redact(RESUME, names=["Rebecca Lauren Ashford"])
        assert "Rebecca" not in out
        assert "Ashford" not in out
        assert counts.get("name", 0) >= 1

    def test_given_name_removed_from_body_text(self):
        """The name often reappears mid-document, not just in the header."""
        out, _ = redact(RESUME, names=["Rebecca Lauren Ashford"])
        assert "Rebecca also mentored" not in out


class TestSubstanceIsPreserved:
    """Redaction must not damage the thing being evaluated."""

    @pytest.mark.parametrize(
        "fragment",
        [
            "Senior Frontend Engineer",
            "React rebuild",
            "90k monthly users",
            "4.1s",
            "1.2s",
            "top 20 routes",
            "2019 - Present",
        ],
    )
    def test_experience_survives(self, fragment):
        out, _ = redact(RESUME, names=["Rebecca Lauren Ashford"])
        assert fragment in out

    def test_metrics_are_not_mistaken_for_phone_numbers(self):
        text = "Processed 4500000 records and served 90000 users in 2024"
        out, counts = redact(text)
        assert "4500000" in out
        assert "90000" in out
        assert counts.get("phone", 0) == 0

    def test_skill_punctuation_survives(self):
        text = "Built with C++, C#, .NET, Node.js and CI/CD pipelines"
        out, _ = redact(text)
        for skill in ("C++", "C#", ".NET", "Node.js", "CI/CD"):
            assert skill in out


class TestEdgeCases:
    def test_empty_input(self):
        assert redact("") == ("", {})

    def test_no_identifiers_is_a_no_op(self):
        text = "Engineered a distributed queue handling 40k messages per second"
        out, counts = redact(text)
        assert out == text
        assert counts == {}

    def test_short_names_are_ignored(self):
        """A two-character name would match far too much."""
        out, _ = redact("Ed reviewed the deployment pipeline", names=["Ed"])
        assert "Ed reviewed" in out

    def test_missing_contact_info_is_tolerated(self):
        assert "[EMAIL]" in redact_for_prompt(RESUME, None)


class TestPromptIntegration:
    def test_built_prompt_contains_no_identifiers(self):
        prompt = build_prompt(
            RESUME,
            "Senior Frontend Engineer wanted",
            {"name": "Rebecca Lauren Ashford"},
        )
        for identifier in [
            "rebecca.ashford@example.com",
            "555-0188",
            "github.com/rlashford",
            "Rebecca",
        ]:
            assert identifier not in prompt, f"{identifier} leaked into the prompt"

    def test_built_prompt_keeps_the_evidence(self):
        prompt = build_prompt(RESUME, "Senior Frontend Engineer wanted", None)
        assert "React rebuild" in prompt
        assert "90k monthly users" in prompt
