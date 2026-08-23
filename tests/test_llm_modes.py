"""The output-mode degradation ladder.

Free-tier models mostly cannot enforce a JSON schema, so complete_json
negotiates downwards: strict schema -> JSON mode -> prompt-only, remembering
what worked per model. These tests cover that negotiation without a network.
"""
import pytest
from core import llm
from core.config import settings
from pydantic import BaseModel


class Simple(BaseModel):
    score: int
    verdict: str


VALID = '{"score": 72, "verdict": "good_fit"}'
FENCED = '```json\n{"score": 72, "verdict": "good_fit"}\n```'
CHATTY = 'Here is my assessment:\n\n{"score": 72, "verdict": "good_fit"}\n\nHope that helps!'
THINKING = '<think>Let me reason about this.</think>{"score": 72, "verdict": "good_fit"}'


@pytest.fixture(autouse=True)
def clean_state(monkeypatch):
    llm.reset_client()
    monkeypatch.setattr(settings, "openrouter_api_key", "test-key", raising=False)
    monkeypatch.setattr(settings, "structured_output_mode", "auto", raising=False)
    monkeypatch.setattr(settings, "llm_max_retries", 1, raising=False)
    yield
    llm.reset_client()


class Recorder:
    """Stands in for the network, recording each request body."""

    def __init__(self, behaviour):
        self.behaviour = behaviour
        self.bodies = []

    async def __call__(self, body):
        self.bodies.append(body)
        result = self.behaviour(body, len(self.bodies) - 1)
        if isinstance(result, Exception):
            raise result
        return result

    def mode_of(self, index):
        body = self.bodies[index]
        fmt = body.get("response_format")
        if fmt is None:
            return llm.PROMPT
        return llm.STRICT if fmt["type"] == "json_schema" else llm.JSON_OBJECT


class TestExtractJson:
    @pytest.mark.parametrize("raw", [VALID, FENCED, CHATTY, THINKING])
    def test_recovers_the_object(self, raw):
        assert Simple.model_validate_json(llm.extract_json(raw)).score == 72

    def test_nested_braces_survive(self):
        raw = 'text {"score": 1, "verdict": "a", "meta": {"x": {"y": 2}}} trailing'
        assert '"y": 2' in llm.extract_json(raw)

    def test_no_json_returns_input(self):
        assert llm.extract_json("no object here") == "no object here"


class TestLadder:
    @pytest.mark.asyncio
    async def test_strict_is_tried_first(self, monkeypatch):
        recorder = Recorder(lambda body, i: VALID)
        monkeypatch.setattr(llm, "_send", recorder)

        result = await llm.complete_json("prompt", Simple, models=["m/a"])
        assert result.score == 72
        assert recorder.mode_of(0) == llm.STRICT
        assert recorder.bodies[0]["extra_body"]["provider"]["require_parameters"] is True

    @pytest.mark.asyncio
    async def test_degrades_when_schema_unsupported(self, monkeypatch):
        def behaviour(body, index):
            if body.get("response_format", {}).get("type") == "json_schema":
                return RuntimeError("No endpoints found that support response_format")
            return VALID

        recorder = Recorder(behaviour)
        monkeypatch.setattr(llm, "_send", recorder)

        result = await llm.complete_json("prompt", Simple, models=["m/free:free"])
        assert result.score == 72
        assert recorder.mode_of(0) == llm.STRICT
        assert recorder.mode_of(1) == llm.JSON_OBJECT

    @pytest.mark.asyncio
    async def test_degrades_all_the_way_to_prompt(self, monkeypatch):
        def behaviour(body, index):
            if body.get("response_format") is not None:
                return RuntimeError("model does not support response_format")
            return CHATTY

        recorder = Recorder(behaviour)
        monkeypatch.setattr(llm, "_send", recorder)

        result = await llm.complete_json("prompt", Simple, models=["m/free:free"])
        assert result.score == 72
        assert recorder.mode_of(2) == llm.PROMPT
        assert "conforming exactly to this schema" in recorder.bodies[2]["messages"][0]["content"]

    @pytest.mark.asyncio
    async def test_require_parameters_dropped_when_degraded(self, monkeypatch):
        def behaviour(body, index):
            if body.get("response_format", {}).get("type") == "json_schema":
                return RuntimeError("not support structured output")
            return VALID

        recorder = Recorder(behaviour)
        monkeypatch.setattr(llm, "_send", recorder)
        await llm.complete_json("prompt", Simple, models=["m/free:free"])

        degraded = recorder.bodies[1].get("extra_body", {})
        assert "provider" not in degraded

    @pytest.mark.asyncio
    async def test_working_mode_is_remembered(self, monkeypatch):
        def behaviour(body, index):
            if body.get("response_format", {}).get("type") == "json_schema":
                return RuntimeError("no endpoints found")
            return VALID

        recorder = Recorder(behaviour)
        monkeypatch.setattr(llm, "_send", recorder)

        await llm.complete_json("p", Simple, models=["m/free:free"])
        calls_after_first = len(recorder.bodies)
        await llm.complete_json("p", Simple, models=["m/free:free"])

        # Second call skips the strict rung it already knows fails.
        assert recorder.mode_of(calls_after_first) == llm.JSON_OBJECT

    @pytest.mark.asyncio
    async def test_forced_mode_skips_negotiation(self, monkeypatch):
        monkeypatch.setattr(settings, "structured_output_mode", "prompt", raising=False)
        recorder = Recorder(lambda body, i: VALID)
        monkeypatch.setattr(llm, "_send", recorder)

        await llm.complete_json("prompt", Simple, models=["m/a"])
        assert len(recorder.bodies) == 1
        assert recorder.mode_of(0) == llm.PROMPT


class TestRepair:
    @pytest.mark.asyncio
    async def test_invalid_content_triggers_one_repair(self, monkeypatch):
        def behaviour(body, index):
            return '{"score": "not a number"}' if index == 0 else VALID

        recorder = Recorder(behaviour)
        monkeypatch.setattr(llm, "_send", recorder)

        result = await llm.complete_json("prompt", Simple, models=["m/a"])
        assert result.score == 72
        assert "could not be parsed" in recorder.bodies[1]["messages"][0]["content"]

    @pytest.mark.asyncio
    async def test_gives_up_cleanly(self, monkeypatch):
        recorder = Recorder(lambda body, i: '{"nope": true}')
        monkeypatch.setattr(llm, "_send", recorder)

        with pytest.raises(llm.LLMError):
            await llm.complete_json("prompt", Simple, models=["m/a"])


class TestConfiguration:
    @pytest.mark.asyncio
    async def test_no_key_raises_a_useful_message(self, monkeypatch):
        monkeypatch.setattr(settings, "openrouter_api_key", "", raising=False)
        with pytest.raises(llm.LLMError, match="OPENROUTER_API_KEY"):
            await llm.complete_json("prompt", Simple)

    def test_free_model_detection(self, monkeypatch):
        monkeypatch.setattr(settings, "primary_model", "a/b:free", raising=False)
        monkeypatch.setattr(settings, "fallback_models", "c/d:free", raising=False)
        assert settings.using_free_models is True

        monkeypatch.setattr(settings, "fallback_models", "c/d", raising=False)
        assert settings.using_free_models is False
