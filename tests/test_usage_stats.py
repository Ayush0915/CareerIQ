import pytest
from fastapi.testclient import TestClient
import main
from main import app, _usage_stats

client = TestClient(app)


@pytest.fixture(autouse=True)
def reset_usage():
    _usage_stats["analyze_count"] = 0
    _usage_stats["ai_coach_count"] = 0
    _usage_stats["total_tracked_calls"] = 0
    _usage_stats["endpoints"] = {}
    yield


def test_usage_stats_endpoint():
    response = client.get("/api/v1/usage-stats")
    assert response.status_code == 200
    data = response.json()
    assert "date" in data
    assert data["analyze_count"] == 0
    assert data["ai_coach_count"] == 0
    assert data["total_tracked_calls"] == 0


def test_usage_tracking_increment():
    main._track_request("/api/v1/analyze")
    main._track_request("/api/v1/ai-coach/interview-prep")
    main._track_request("/api/v1/ai-coach/course-recommendations")

    response = client.get("/api/v1/usage-stats")
    assert response.status_code == 200
    data = response.json()
    assert data["analyze_count"] == 1
    assert data["ai_coach_count"] == 2
    assert data["total_tracked_calls"] == 3
    assert "/api/v1/analyze" in data["endpoints"]
    assert "/api/v1/ai-coach/interview-prep" in data["endpoints"]
