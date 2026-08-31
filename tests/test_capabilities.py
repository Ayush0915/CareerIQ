"""The capabilities endpoint must describe the API that actually exists.

It drifted once: after the live jobs board and the cover-letter / LinkedIn /
interview-prep coaching modes were removed, /api/v1/capabilities went on
advertising `/api/v1/ai-coach`, `/api/v1/ai-coach/interview-prep` and
`/api/v1/ai-coach/linkedin` — none of which route to anything — while omitting
the two endpoints that do. Clients discover the API here, so a stale entry is a
404 waiting to happen rather than a cosmetic error.

These tests compare the advertised list against the app's own route table, so
the next removal fails here instead of in someone's integration.
"""
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def _registered() -> set[tuple[str, str]]:
    """(METHOD, path) for every route the app actually serves.

    Read from the OpenAPI schema rather than app.routes: included routers are
    expanded lazily and surface as _IncludedRouter objects with no .path, so
    walking app.routes silently misses every endpoint that matters here.
    """
    return {
        (method.upper(), path)
        for path, operations in app.openapi()["paths"].items()
        for method in operations
        if method.upper() not in ("HEAD", "OPTIONS")
    }


def _advertised() -> list[dict]:
    response = client.get("/api/v1/capabilities")
    assert response.status_code == 200
    return response.json()["endpoints"]


class TestAdvertisedEndpointsExist:
    def test_every_advertised_path_is_a_real_route(self):
        registered = _registered()
        broken = [
            e for e in _advertised()
            if (e["method"], e["path"]) not in registered
        ]
        assert not broken, f"capabilities advertises routes that do not exist: {broken}"

    def test_the_analysis_endpoint_is_advertised(self):
        paths = {e["path"] for e in _advertised()}
        assert "/api/v1/analyze" in paths

    def test_both_coaching_endpoints_are_advertised(self):
        """Removing a mode must not leave the discovery list pointing at it."""
        paths = {e["path"] for e in _advertised()}
        assert "/api/v1/ai-coach/generate" in paths
        assert "/api/v1/ai-coach/modes" in paths

    def test_no_removed_feature_is_still_advertised(self):
        paths = {e["path"] for e in _advertised()}
        for gone in (
            "/api/v1/jobs",
            "/api/v1/ai-coach",
            "/api/v1/ai-coach/linkedin",
            "/api/v1/ai-coach/interview-prep",
        ):
            assert gone not in paths, f"{gone} was removed but is still advertised"


class TestCapabilitiesPayload:
    def test_reports_the_embedding_model_in_use(self):
        from services.similarity import EMBEDDING_MODEL

        assert client.get("/api/v1/capabilities").json()["models"]["embedding"] == (
            EMBEDDING_MODEL
        )

    def test_ats_check_names_match_the_simulator(self):
        """The eight names clients render as a checklist."""
        from services.ats_simulator import simulate_ats

        advertised = set(client.get("/api/v1/capabilities").json()["ats_checks"])
        actual = set(simulate_ats("Experience\nEngineer 2020 - 2024\n", "engineer")["checks"])
        assert advertised == actual
