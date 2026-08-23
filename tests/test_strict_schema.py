"""The Pydantic -> strict-JSON-schema conversion used for structured outputs.

Strict mode requires every object to close itself with additionalProperties
false and to list every property as required, and provider support for $ref is
inconsistent, so references are inlined.
"""
import json
from typing import Dict, List, Optional

import pytest
from pydantic import BaseModel

from core.llm import to_strict_schema
from models.schemas import LLMEvaluation


class Inner(BaseModel):
    value: int


class Outer(BaseModel):
    name: str
    inner: Inner
    tags: List[str]
    optional_note: Optional[str] = None


class WithMap(BaseModel):
    lookup: Dict[str, str]


class TestStructure:
    def test_objects_are_closed(self):
        schema = to_strict_schema(Outer)
        assert schema["additionalProperties"] is False
        assert schema["properties"]["inner"]["additionalProperties"] is False

    def test_every_property_is_required(self):
        schema = to_strict_schema(Outer)
        assert set(schema["required"]) == {"name", "inner", "tags", "optional_note"}

    def test_refs_are_inlined(self):
        rendered = json.dumps(to_strict_schema(Outer))
        assert "$ref" not in rendered
        assert "$defs" not in rendered

    def test_nested_model_keeps_its_properties(self):
        schema = to_strict_schema(Outer)
        assert schema["properties"]["inner"]["properties"]["value"]["type"] == "integer"

    def test_defaults_are_stripped(self):
        rendered = json.dumps(to_strict_schema(Outer))
        assert '"default"' not in rendered

    def test_open_maps_are_left_alone(self):
        """Dict[str, str] must keep its additionalProperties schema rather than
        being closed into an object that permits nothing."""
        schema = to_strict_schema(WithMap)
        lookup = schema["properties"]["lookup"]
        assert lookup["additionalProperties"] != False  # noqa: E712


class TestRealSchema:
    def test_llm_evaluation_converts(self):
        schema = to_strict_schema(LLMEvaluation)
        assert schema["type"] == "object"
        assert schema["additionalProperties"] is False
        assert len(schema["required"]) == len(schema["properties"])

    @pytest.mark.parametrize(
        "field", ["section_scores", "keyword_analysis", "section_feedback"]
    )
    def test_nested_models_are_inlined(self, field):
        schema = to_strict_schema(LLMEvaluation)
        assert "properties" in schema["properties"][field]

    def test_output_is_json_serializable(self):
        json.dumps(to_strict_schema(LLMEvaluation))
