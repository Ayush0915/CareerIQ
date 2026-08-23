"""Regression tests for the resume/JD normalization asymmetry.

Before this fix the resume was normalized with a cleaner that stripped every
non-alphanumeric character while the job description was passed through raw.
Symbol-bearing skills (c++, c#, .net, node.js, ci/cd) therefore survived on the
JD side and were destroyed on the resume side, so every role requiring them
reported them as missing skills.
"""
import pytest
from services.skill_extractor import (
    extract_skills_from_text,
    load_skills,
    normalize_text,
)
from utils.text_cleaner import normalize

SYMBOL_RESUME = (
    "Senior Engineer. Built services in C++ and C#, shipped .NET APIs, "
    "Node.js tooling, and CI/CD pipelines on Kubernetes (K8s). "
    "Used scikit-learn for ML work."
)
SYMBOL_JD = (
    "We need C++, C#, .NET, Node.js, CI/CD, Kubernetes and scikit-learn "
    "experience."
)


@pytest.fixture(scope="module")
def taxonomy():
    return load_skills()


class TestNormalizationPreservesSkillPunctuation:
    @pytest.mark.parametrize(
        "raw,expected_fragment",
        [
            ("Strong C++ background", "c++"),
            ("C# and F# developer", "c#"),
            ("Built on .NET Core", ".net"),
            ("Node.js services", "node.js"),
            ("CI/CD pipelines", "ci/cd"),
            ("Used scikit-learn daily", "scikit-learn"),
        ],
    )
    def test_symbol_skills_survive(self, raw, expected_fragment):
        assert expected_fragment in normalize(raw)

    def test_sentence_punctuation_is_dropped(self):
        assert normalize("We use Python.") == "we use python"

    def test_emails_and_urls_removed(self):
        out = normalize("Contact me@example.com or https://example.com/cv")
        assert "@" not in out and "http" not in out

    def test_empty_input(self):
        assert normalize("") == ""
        assert normalize(None) == ""


class TestSymmetry:
    def test_no_false_missing_skills(self, taxonomy):
        """The core regression: everything the JD asks for and the resume has
        must be detected on both sides."""
        resume = set(extract_skills_from_text(SYMBOL_RESUME, taxonomy))
        jd = set(extract_skills_from_text(SYMBOL_JD, taxonomy))
        assert jd - resume == set()

    def test_raw_and_precleaned_input_agree(self, taxonomy):
        """Passing already-normalized text must not change the result — this is
        what stops a caller from normalizing one side and not the other."""
        raw = extract_skills_from_text(SYMBOL_RESUME, taxonomy)
        pre = extract_skills_from_text(normalize_text(SYMBOL_RESUME), taxonomy)
        assert raw == pre


class TestLongestMatchWins:
    def test_cpp_does_not_yield_bare_c(self):
        assert extract_skills_from_text("I write C++ daily", ["c", "c++"]) == ["c++"]

    def test_bare_c_is_still_found(self):
        assert extract_skills_from_text("I write C and Java", ["c", "c++", "java"]) == [
            "c",
            "java",
        ]

    def test_nodejs_does_not_yield_node(self):
        assert extract_skills_from_text("Node.js backend", ["node", "node.js"]) == [
            "node.js"
        ]

    def test_aspnet_does_not_yield_dotnet(self):
        assert extract_skills_from_text("ASP.NET shop", [".net", "asp.net"]) == [
            "asp.net"
        ]

    def test_slash_separated_skills_both_match(self):
        assert extract_skills_from_text("C#/Java polyglot", ["c#", "java"]) == [
            "c#",
            "java",
        ]

    def test_contained_subphrase_is_credited(self, taxonomy):
        """"ci/cd pipelines" must also credit "ci/cd", otherwise a resume
        saying one and a JD saying the other would not agree."""
        found = extract_skills_from_text("Owned CI/CD pipelines", taxonomy)
        assert "ci/cd" in found


class TestSynonyms:
    def test_standalone_shortform_expands(self, taxonomy):
        assert "javascript" in extract_skills_from_text("I know JS well", taxonomy)

    def test_shortform_inside_a_token_is_not_expanded(self, taxonomy):
        """The "js" in "node.js" must not become "node.javascript"."""
        assert "javascript" not in extract_skills_from_text("Node.js only", taxonomy)

    def test_k8s_resolves_to_kubernetes(self, taxonomy):
        assert "kubernetes" in extract_skills_from_text("Ran K8s in prod", taxonomy)


class TestEdgeCases:
    def test_empty_text(self, taxonomy):
        assert extract_skills_from_text("", taxonomy) == []

    def test_empty_taxonomy(self):
        assert extract_skills_from_text("Python and Docker", []) == []

    def test_result_is_sorted_and_unique(self, taxonomy):
        found = extract_skills_from_text("Python python PYTHON docker", taxonomy)
        assert found == sorted(set(found))
