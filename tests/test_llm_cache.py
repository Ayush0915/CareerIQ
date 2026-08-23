"""Cache behaviour for the schema-constrained resume evaluation."""
import pytest
from core.config import settings
from models.schemas import KeywordAnalysis, LLMEvaluation, SectionFeedback, SectionScores
from services import llm_evaluator
from services.llm_evaluator import CACHE_TTL, _eval_cache, _get_cache_key, llm_master_evaluate


def make_evaluation(score: float = 85) -> LLMEvaluation:
    return LLMEvaluation(
        overall_score=score,
        experience_level="senior",
        years_detected="5 years",
        section_scores=SectionScores(
            experience=85, skills=90, education=80, projects=85, summary=80
        ),
        keyword_analysis=KeywordAnalysis(
            present=["python", "aws"], missing_critical=[], missing_recommended=[]
        ),
        grammar_issues=[],
        cliches_found=[],
        readability_score=90,
        passive_voice_count=0,
        quantified_achievements=3,
        section_feedback=SectionFeedback(
            experience="Good fit", skills="Strong", projects="Solid", summary="Clear"
        ),
        top_improvements=["Add metrics"],
        ats_compatibility=88,
        job_match_reasoning="Strong match",
        interview_questions=["Tell me about your AWS experience"],
        resume_strengths=["Python expertise"],
        salary_insight="$120k-$150k",
        competition_level="medium",
        fit_verdict="strong_fit",
    )


@pytest.fixture(autouse=True)
def clear_cache():
    _eval_cache.clear()
    yield
    _eval_cache.clear()


@pytest.fixture(autouse=True)
def configured(monkeypatch):
    """Pretend a key is present so the evaluator does not short-circuit."""
    monkeypatch.setattr(settings, "openrouter_api_key", "test-key", raising=False)
    yield


class StubLLM:
    """Counts calls so cache hits are observable."""

    def __init__(self, result):
        self.result = result
        self.calls = 0

    async def __call__(self, *args, **kwargs):
        self.calls += 1
        return self.result


@pytest.mark.asyncio
async def test_cache_hit_avoids_second_call(monkeypatch):
    stub = StubLLM(make_evaluation())
    monkeypatch.setattr(llm_evaluator.llm, "complete_json", stub)

    resume = "Experienced Python developer with Django and AWS expertise."
    jd = "Looking for a Senior Python Engineer with AWS experience."

    first = await llm_master_evaluate(resume, jd)
    assert first.overall_score == 85
    assert stub.calls == 1

    second = await llm_master_evaluate(resume, jd)
    assert second == first
    assert stub.calls == 1, "identical input must be served from cache"


@pytest.mark.asyncio
async def test_different_input_misses_cache(monkeypatch):
    stub = StubLLM(make_evaluation(75))
    monkeypatch.setattr(llm_evaluator.llm, "complete_json", stub)

    jd = "Seeking a Fullstack Software Engineer."
    await llm_master_evaluate("Frontend engineer, React and TypeScript.", jd)
    await llm_master_evaluate("Backend engineer, Go and Kubernetes.", jd)

    assert stub.calls == 2


@pytest.mark.asyncio
async def test_cache_expires_after_ttl(monkeypatch):
    stub = StubLLM(make_evaluation(90))
    monkeypatch.setattr(llm_evaluator.llm, "complete_json", stub)

    resume = "Data scientist with PyTorch."
    jd = "Looking for a Data Scientist."

    await llm_master_evaluate(resume, jd)
    assert stub.calls == 1

    key = _get_cache_key(resume, jd)
    timestamp, value = _eval_cache[key]
    _eval_cache[key] = (timestamp - (CACHE_TTL + 5), value)

    await llm_master_evaluate(resume, jd)
    assert stub.calls == 2, "an expired entry must trigger a fresh call"


@pytest.mark.asyncio
async def test_returns_none_without_api_key(monkeypatch):
    """No key means no fabricated result — the caller renders the
    deterministic half of the analysis instead of a zero-filled evaluation."""
    monkeypatch.setattr(settings, "openrouter_api_key", "", raising=False)
    assert await llm_master_evaluate("resume text", "jd text") is None


@pytest.mark.asyncio
async def test_provider_failure_returns_none(monkeypatch):
    async def boom(*args, **kwargs):
        raise llm_evaluator.llm.LLMError("all providers failed")

    monkeypatch.setattr(llm_evaluator.llm, "complete_json", boom)
    assert await llm_master_evaluate("resume text", "jd text") is None
