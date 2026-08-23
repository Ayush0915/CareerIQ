"""Course recommendations, including the no-fabricated-URLs guarantee."""
import pytest
from core.config import settings
from services import ai_coach
from services.ai_coach import (
    CourseRecommendation,
    CourseRecommendations,
    _fallback_course_recommendations,
    generate_course_recommendations,
)

GAPS = {"critical": ["docker", "kubernetes"], "important": ["aws"], "optional": ["graphql"]}


@pytest.fixture(autouse=True)
def no_api_key(monkeypatch):
    """Default to the offline path; individual tests opt back in."""
    monkeypatch.setattr(settings, "openrouter_api_key", "", raising=False)
    yield


class TestFallback:
    def test_covers_the_named_gaps(self):
        found = {c["skill"] for c in _fallback_course_recommendations(GAPS)}
        assert {"docker", "kubernetes", "aws"} <= found

    def test_urls_are_real_search_endpoints(self):
        """The model used to be asked for course URLs and confidently invented
        them. Every link must now be a search on a known platform."""
        for course in _fallback_course_recommendations(GAPS):
            assert course["url"].startswith("https://")
            assert any(
                host in course["url"]
                for host in ("coursera.org", "udemy.com", "youtube.com", "duckduckgo.com")
            )

    def test_shape_matches_the_ui_contract(self):
        for course in _fallback_course_recommendations(GAPS):
            for key in ("id", "skill", "title", "platform", "url", "priority", "mScore"):
                assert key in course


class TestGeneration:
    @pytest.mark.asyncio
    async def test_no_gaps_returns_empty(self):
        empty = {"critical": [], "important": [], "optional": []}
        assert await generate_course_recommendations(empty) == []

    @pytest.mark.asyncio
    async def test_falls_back_without_api_key(self):
        result = await generate_course_recommendations(GAPS)
        assert result and all("url" in c for c in result)

    @pytest.mark.asyncio
    async def test_falls_back_when_provider_fails(self, monkeypatch):
        monkeypatch.setattr(settings, "openrouter_api_key", "test-key", raising=False)

        async def boom(*args, **kwargs):
            raise ai_coach.llm.LLMError("provider down")

        monkeypatch.setattr(ai_coach.llm, "complete_json", boom)
        result = await generate_course_recommendations(GAPS)
        assert result, "a provider failure must still produce recommendations"

    @pytest.mark.asyncio
    async def test_model_output_is_converted_to_search_urls(self, monkeypatch):
        monkeypatch.setattr(settings, "openrouter_api_key", "test-key", raising=False)

        async def stub(*args, **kwargs):
            return CourseRecommendations(
                courses=[
                    CourseRecommendation(
                        skill="docker",
                        title="Docker Deep Dive",
                        platform="Udemy",
                        provider="Some Instructor",
                        level="intermediate",
                        hours=12,
                        search_query="docker deep dive",
                        desc="Closes the container gap for this backend role.",
                        priority="critical",
                        match_score=94,
                    )
                ]
            )

        monkeypatch.setattr(ai_coach.llm, "complete_json", stub)
        result = await generate_course_recommendations(GAPS)

        assert len(result) == 1
        assert result[0]["url"] == "https://www.udemy.com/courses/search/?q=docker+deep+dive"
        assert result[0]["mScore"] == 94

    @pytest.mark.asyncio
    async def test_handles_missing_gap_argument(self):
        assert await generate_course_recommendations(None) == []
