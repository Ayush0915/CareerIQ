from dotenv import load_dotenv
load_dotenv()

import logging
import re
import time
import uuid
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# ── Logging setup ─────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("main")

# ── Rate limiter ──────────────────────────────────────────────────────────────
# Shared limiter instance — imported by routers via `from main import limiter`
limiter = Limiter(key_func=get_remote_address, default_limits=[])

from routers import analyze, ai_coach, jobs

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="CareerIQ API",
    description="AI-powered resume analysis, scoring, and coaching platform.",
    version="4.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Attach limiter to app state (required by slowapi middleware)
app.state.limiter = limiter

# Return a clear 429 JSON response when rate limit is exceeded
@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={
            "detail": (
                "Rate limit exceeded: too many requests. "
                "You are allowed 5 requests per minute per IP address. "
                "Please wait before trying again."
            )
        },
    )

# ── CORS ──────────────────────────────────────────────────────────────────────
CORS_ALLOWED_ORIGIN_REGEX = re.compile(
    r"https://career-iq.*\.vercel\.app|http://localhost:\d+|http://127\.0\.0\.1:\d+"
)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=CORS_ALLOWED_ORIGIN_REGEX.pattern,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import datetime

# ── Global error handler ──────────────────────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception(f"Unhandled error on {request.url.path}: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "An unexpected server error occurred. Please try again."},
    )

# ── Daily Usage Tracking Store ───────────────────────────────────────────────
_usage_stats = {
    "date": datetime.date.today().isoformat(),
    "analyze_count": 0,
    "ai_coach_count": 0,
    "total_tracked_calls": 0,
    "endpoints": {}
}

def _track_request(path: str):
    today = datetime.date.today().isoformat()
    if _usage_stats["date"] != today:
        _usage_stats["date"] = today
        _usage_stats["analyze_count"] = 0
        _usage_stats["ai_coach_count"] = 0
        _usage_stats["total_tracked_calls"] = 0
        _usage_stats["endpoints"] = {}

    if "/analyze" in path:
        _usage_stats["analyze_count"] += 1
        _usage_stats["total_tracked_calls"] += 1
        _usage_stats["endpoints"][path] = _usage_stats["endpoints"].get(path, 0) + 1
    elif "/ai-coach" in path:
        _usage_stats["ai_coach_count"] += 1
        _usage_stats["total_tracked_calls"] += 1
        _usage_stats["endpoints"][path] = _usage_stats["endpoints"].get(path, 0) + 1


# ── Request-ID + timing + usage tracking middleware ──────────────────────────
@app.middleware("http")
async def request_middleware(request: Request, call_next):
    request_id = str(uuid.uuid4())[:8]
    request.state.request_id = request_id
    t0 = time.perf_counter()

    path = request.url.path
    if path.startswith("/api/v1/analyze") or path.startswith("/api/v1/ai-coach"):
        _track_request(path)

    response = await call_next(request)

    elapsed = round((time.perf_counter() - t0) * 1000)
    response.headers["X-Request-Id"]   = request_id
    response.headers["X-Process-Time"] = f"{elapsed}ms"

    logger.info(
        f"[{request_id}] {request.method} {request.url.path}"
        f" -> {response.status_code}  ({elapsed}ms)"
    )
    return response

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(analyze.router,   prefix="/api/v1", tags=["Analysis"])
app.include_router(ai_coach.router,  prefix="/api/v1", tags=["AI Coach"])
app.include_router(jobs.router,      prefix="/api/v1", tags=["Jobs"])


# ── Health, usage & info endpoints ───────────────────────────────────────────
@app.get("/health", tags=["System"])
async def health_check():
    return {
        "status":   "ok",
        "version":  "4.0.0",
    }


@app.get("/api/v1/usage-stats", tags=["System"])
async def get_usage_stats():
    """Get today's request count for /analyze and /ai-coach endpoints."""
    today = datetime.date.today().isoformat()
    if _usage_stats["date"] != today:
        _usage_stats["date"] = today
        _usage_stats["analyze_count"] = 0
        _usage_stats["ai_coach_count"] = 0
        _usage_stats["total_tracked_calls"] = 0
        _usage_stats["endpoints"] = {}

    return {
        "date": _usage_stats["date"],
        "analyze_count": _usage_stats["analyze_count"],
        "ai_coach_count": _usage_stats["ai_coach_count"],
        "total_tracked_calls": _usage_stats["total_tracked_calls"],
        "endpoints": _usage_stats["endpoints"],
    }


@app.get("/api/v1/capabilities", tags=["System"])
async def capabilities():
    """List all available API features."""
    return {
        "endpoints": [
            {"path": "/api/v1/analyze",              "method": "POST", "desc": "Full resume + JD analysis"},
            {"path": "/api/v1/ai-coach",             "method": "POST", "desc": "Bullet rewrites, cover letter, roadmap, interview prep, LinkedIn"},
            {"path": "/api/v1/ai-coach/interview-prep","method":"POST","desc": "Standalone interview question generator"},
            {"path": "/api/v1/ai-coach/linkedin",    "method": "POST", "desc": "Standalone LinkedIn summary generator"},
            {"path": "/api/v1/ai-coach/course-recommendations", "method": "POST", "desc": "Personalized course recommendations"},
            {"path": "/api/v1/usage-stats",          "method": "GET",  "desc": "Daily usage statistics monitor"},
            {"path": "/api/v1/jobs",                 "method": "POST", "desc": "Live job recommendations"},
        ],
        "models": {
            "primary":  "llama-3.3-70b-versatile",
            "fallback": "llama-3.1-8b-instant",
            "embedding":"all-MiniLM-L6-v2",
        },
        "ats_checks": [
            "contact_info", "section_headers", "keyword_density",
            "date_consistency", "education", "formatting", "length", "quantification"
        ],
    }

