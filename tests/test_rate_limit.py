"""
tests/test_rate_limit.py

Confirms that a 6th request within a 1-minute window to /api/v1/analyze
and /api/v1/ai-coach returns HTTP 429 with a clear error message.

Strategy
--------
slowapi stores per-IP request counts in an in-memory store keyed by
`get_remote_address(request)`.  The TestClient sends all requests from
the same fake IP (127.0.0.1 in ASGI scope), so the window accumulates
naturally across the 6 calls without any time manipulation.

Because the limit is reset per Limiter instance (not globally), we reset
the limiter's storage between test functions with `limiter.reset()` /
patching the storage, or simply restart-safe by using a fresh app state.
The cleanest approach for unit tests is to use `limits` library's
`MemoryStorage.reset()` via `limiter._storage`.
"""
import io
import json
import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

# ── Bootstrap path so pytest can import the backend package ───────────────────
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from main import app, limiter

client = TestClient(app, raise_server_exceptions=False)

# ── Minimal valid PDF fixture ─────────────────────────────────────────────────
MINIMAL_PDF = (
    b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n"
    b"2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n"
    b"3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] "
    b"/Contents 4 0 R /Resources << >> >>\nendobj\n"
    b"4 0 obj\n<< /Length 55 >>\nstream\n"
    b"BT /F1 12 Tf 100 700 Td (Experienced Python Engineer Docker Kubernetes) Tj ET\n"
    b"endstream\nendobj\n"
    b"xref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n"
    b"0000000058 00000 n \n0000000115 00000 n \n0000000220 00000 n \n"
    b"trailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n325\n%%EOF"
)

MOCK_PARSE_RESULT = {
    "raw_text": (
        "Experienced Python Engineer with 5 years experience in Docker "
        "Kubernetes FastAPI PostgreSQL and AWS CI/CD pipelines."
    ),
    "clean_text": (
        "experienced python engineer with 5 years experience in docker "
        "kubernetes fastapi postgresql and aws ci/cd pipelines"
    ),
    "contact_info": {"email": "dev@example.com"},
    "word_count": 20,
}

JD_TEXT = (
    "We are looking for a Senior Python Engineer with experience in Docker, "
    "Kubernetes, FastAPI, PostgreSQL and AWS. Must have CI/CD knowledge."
)


def _reset_limiter():
    """Clear all sliding-window buckets so each test starts fresh."""
    try:
        # limits >= 3.x: storage is accessed via limiter._storage
        limiter._storage.reset()
    except Exception:
        # Fallback: clear internal dict-based MemoryStorage
        try:
            storage = limiter._storage
            if hasattr(storage, "_storage"):
                storage._storage.clear()
            elif hasattr(storage, "storage"):
                storage.storage.clear()
        except Exception:
            pass  # best-effort; test may still pass if storage is fresh


# ── Tests ─────────────────────────────────────────────────────────────────────

@patch("routers.analyze.parse_resume", return_value=MOCK_PARSE_RESULT)
def test_analyze_rate_limit_429_on_6th_request(mock_parse):
    """
    Sends 5 valid requests then a 6th — the 6th must return 429.
    Each request is sent from the same TestClient IP (127.0.0.1).
    """
    _reset_limiter()

    def _post():
        return client.post(
            "/api/v1/analyze",
            files={"file": ("resume.pdf", io.BytesIO(MINIMAL_PDF), "application/pdf")},
            data={"job_description": JD_TEXT},
            headers={"X-Forwarded-For": "10.0.0.99"},  # fixed fake IP per window
        )

    # Requests 1-5 must succeed (200)
    for i in range(5):
        resp = _post()
        assert resp.status_code == 200, (
            f"Request {i+1} should succeed (got {resp.status_code})"
        )

    # Request 6 must be rate-limited (429)
    resp6 = _post()
    assert resp6.status_code == 429, (
        f"6th request should return 429 (got {resp6.status_code}): {resp6.text}"
    )

    body = resp6.json()
    assert "detail" in body, "429 response must include a 'detail' field"
    detail = body["detail"].lower()
    assert "rate limit" in detail or "too many" in detail, (
        f"detail message should mention rate limit, got: {body['detail']}"
    )


def test_ai_coach_rate_limit_429_on_6th_request():
    """
    Sends 5 valid AI Coach requests then a 6th — the 6th must return 429.
    We mock all LLM calls so the test is fast and offline.
    """
    _reset_limiter()

    coach_payload = {
        "weak_phrases":    ["responsible for", "worked on"],
        "matching_skills": ["python", "docker"],
        "missing_skills":  ["kubernetes"],
        "job_description": JD_TEXT,
        "resume_text":     MOCK_PARSE_RESULT["raw_text"],
        "experience_level": "mid",
    }

    with (
        patch("routers.ai_coach.rewrite_bullets",         return_value="• Led Python microservices"),
        patch("routers.ai_coach.generate_cover_letter",   return_value="Dear Hiring Manager,"),
        patch("routers.ai_coach.generate_skill_roadmap",  return_value="1. Learn Kubernetes"),
        patch("routers.ai_coach.generate_interview_prep", return_value="Q: Tell me about Python"),
        patch("routers.ai_coach.generate_linkedin_summary", return_value="Seasoned engineer"),
    ):
        def _post():
            return client.post(
                "/api/v1/ai-coach",
                json=coach_payload,
                headers={"X-Forwarded-For": "10.0.0.88"},  # fixed fake IP
            )

        # Requests 1-5 must succeed (200)
        for i in range(5):
            resp = _post()
            assert resp.status_code == 200, (
                f"Request {i+1} should succeed (got {resp.status_code})"
            )

        # Request 6 must be rate-limited (429)
        resp6 = _post()
        assert resp6.status_code == 429, (
            f"6th request should return 429 (got {resp6.status_code}): {resp6.text}"
        )

        body = resp6.json()
        assert "detail" in body
        detail = body["detail"].lower()
        assert "rate limit" in detail or "too many" in detail, (
            f"detail message should mention rate limit, got: {body['detail']}"
        )
