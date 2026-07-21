import io
import json
import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

MINIMAL_PDF = b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << >> >>\nendobj\n4 0 obj\n<< /Length 55 >>\nstream\nBT /F1 12 Tf 100 700 Td (Experienced Software Engineer Python React Docker FastAPI PostgreSQL Kubernetes AWS CI/CD Agile Development) Tj ET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000220 00000 n \ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n325\n%%EOF"

MOCK_PARSE_RESULT = {
    "raw_text": "Experienced Software Engineer with 5+ years of experience in Python, React, Docker, FastAPI, PostgreSQL, Kubernetes, AWS, CI/CD, and Agile Development. Built scalable microservices and data pipelines for high-traffic web applications.",
    "clean_text": "experienced software engineer with 5+ years of experience in python react docker fastapi postgresql kubernetes aws ci/cd and agile development built scalable microservices and data pipelines for high traffic web applications",
    "contact_info": {"email": "dev@example.com", "phone": "1234567890"},
    "word_count": 35,
}


@patch("routers.analyze.parse_resume", return_value=MOCK_PARSE_RESULT)
def test_analyze_sse_stream(mock_parse):
    pdf_file = ("resume.pdf", io.BytesIO(MINIMAL_PDF), "application/pdf")
    jd_text = "We are seeking a Software Engineer proficient in Python, React, Docker, and PostgreSQL with experience building web applications."

    response = client.post(
        "/api/v1/analyze",
        files={"file": pdf_file},
        data={"job_description": jd_text},
    )

    assert response.status_code == 200
    assert "text/event-stream" in response.headers.get("content-type", "")

    # Parse SSE events from response text
    content = response.text
    blocks = [b for b in content.strip().split("\n\n") if b.strip()]

    events = []
    for block in blocks:
        for line in block.split("\n"):
            if line.startswith("data: "):
                payload = json.loads(line[6:])
                events.append(payload)

    assert len(events) >= 4
    event_types = [e.get("event") for e in events]
    assert "progress" in event_types
    assert "complete" in event_types

    # Verify progress values (25%, 50%, 75%, 100%)
    progress_values = [e.get("progress") for e in events if e.get("event") == "progress"]
    assert 25 in progress_values
    assert 50 in progress_values
    assert 75 in progress_values

    complete_event = next(e for e in events if e.get("event") == "complete")
    assert complete_event.get("progress") == 100
    assert "result" in complete_event
    assert complete_event["result"]["total_skills_detected"] > 0
