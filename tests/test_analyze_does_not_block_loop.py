"""The analysis pipeline must not block the event loop.

Regression test for a production incident. Every CPU-bound stage of /analyze
ran inline inside the SSE generator, so one analysis owned the event loop for
its entire duration and nothing else in the process got served. On the deployed
0.1-CPU instance /health went from 1ms to 15.1s during a single analysis, blew
the platform's 5s health-check timeout, and the instance was killed and
restarted mid-request. It presented as a service crash-looping; it was a
service that was simply busy.

This test deliberately does not measure how long an analysis takes — that is a
function of the hardware and would be flaky. It measures the thing that
actually broke: whether the loop stays free while the work happens. A heartbeat
coroutine ticks every 10ms, and the largest gap between ticks is the longest
period the loop was unavailable. Verified both ways: against the fixed code the
worst gap is scheduler noise, against the original inline version it is 1.02s —
the full duration of the stubbed stage.

An end-to-end variant of this (fire the analysis, then probe /health) was
written first and thrown away: it passed against the broken code too, because
the probe can slip in before the request reaches the blocking stage, and you
cannot wait for that stage from a loop the stage is about to block. A test that
does not fail on the bug it names is worse than no test.
"""
import asyncio
import io
import time
from unittest.mock import patch

import httpx
from httpx import ASGITransport
from main import app, limiter

# Long enough to be unambiguous against scheduler noise, short enough not to
# slow the suite down.
BLOCK_SECONDS = 1.0

MINIMAL_PDF = (
    b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n"
    b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n"
    b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R "
    b"/Resources << >> >>\nendobj\n4 0 obj\n<< /Length 55 >>\nstream\n"
    b"BT /F1 12 Tf 100 700 Td (Engineer) Tj ET\nendstream\nendobj\n"
    b"trailer\n<< /Size 5 /Root 1 0 R >>\n%%EOF"
)

MOCK_PARSE_RESULT = {
    "raw_text": (
        "Experienced software engineer with five years building Python and "
        "FastAPI services on Kubernetes. Reduced p99 latency by 38 percent. "
        "Managed PostgreSQL and Redis in production. Built CI/CD on GitHub "
        "Actions and instrumented services with Prometheus."
    ),
    "clean_text": "experienced software engineer python fastapi kubernetes",
    "contact_info": {"email": "dev@example.com", "phone": "1234567890"},
    "word_count": 40,
}

JD_TEXT = (
    "We are hiring a backend engineer with strong Python and FastAPI "
    "experience, comfortable operating services on Kubernetes, familiar with "
    "PostgreSQL, Redis, Prometheus and CI/CD pipelines."
)


def _blocking_similarity(resume_text, jd_text, top_k=5):
    """Stands in for the embedding call, which is the real CPU hog.

    time.sleep is the right stub here rather than a busy loop: like
    onnxruntime's native inference, it releases the GIL, so it blocks the loop
    only if it is called on the loop's own thread. That is precisely the
    distinction under test.
    """
    time.sleep(BLOCK_SECONDS)
    return {
        "final_score": 55.0,
        "top_matches": [("A sentence long enough to survive filtering.", 55.0)],
    }


def _reset_limiter():
    try:
        limiter._storage.reset()
    except Exception:
        try:
            limiter.reset()
        except Exception:
            pass


async def _heartbeat(stop: asyncio.Event, ticks: list[float]) -> None:
    while not stop.is_set():
        ticks.append(time.perf_counter())
        await asyncio.sleep(0.01)


async def test_analysis_leaves_the_event_loop_responsive():
    _reset_limiter()

    ticks: list[float] = []
    stop = asyncio.Event()
    beat = asyncio.create_task(_heartbeat(stop, ticks))

    with (
        patch("routers.analyze.parse_resume", return_value=MOCK_PARSE_RESULT),
        patch("routers.analyze.calculate_similarity", _blocking_similarity),
    ):
        transport = ASGITransport(app=app)
        async with httpx.AsyncClient(
            transport=transport, base_url="http://test"
        ) as client:
            response = await client.post(
                "/api/v1/analyze",
                files={"file": ("resume.pdf", io.BytesIO(MINIMAL_PDF), "application/pdf")},
                data={"job_description": JD_TEXT},
                timeout=60.0,
            )

    stop.set()
    await beat

    assert response.status_code == 200
    assert "complete" in response.text

    # strict=False is deliberate: ticks[1:] is one shorter by construction.
    gaps = [b - a for a, b in zip(ticks, ticks[1:], strict=False)]
    worst = max(gaps) if gaps else 0.0

    # The stubbed stage blocks a thread for BLOCK_SECONDS. If it ran on the
    # loop's thread the worst gap would be ~BLOCK_SECONDS; off the loop it is
    # scheduler noise. Half the block duration separates those two worlds by a
    # wide margin in both directions.
    assert worst < BLOCK_SECONDS / 2, (
        f"event loop stalled for {worst:.2f}s during the analysis — CPU-bound "
        f"work has moved back onto the loop thread"
    )
