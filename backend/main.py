import datetime
import logging
import time
import uuid
from contextlib import asynccontextmanager

from core.config import settings
from core.limiter import limiter
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from routers import ai_coach, analyze, jobs
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

# ── Logging setup ─────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("main")


# ── Lifespan ──────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Warm the embedding model at startup.

    It used to load lazily on the first request, so the first user after an
    idle period waited for a model download and load on top of container boot.
    """
    missing = settings.missing_credentials()
    if missing:
        logger.warning(
            "Starting without: %s — the features that need them will fail.",
            ", ".join(missing),
        )

    if settings.using_free_models:
        logger.info(
            "Free-tier models configured (%s). Expect ~20 requests/minute and "
            "~200/day per account; one analysis is 1 call and the AI Coach "
            "bundle is 5. Schema enforcement is negotiated per model — see "
            "core/llm.py.",
            settings.primary_model,
        )

    if settings.warm_up_embeddings:
        try:
            from services.similarity import EMBEDDING_MODEL, warm_up

            t0 = time.perf_counter()
            warm_up()
            logger.info(
                "Embedding model %s ready in %.2fs",
                EMBEDDING_MODEL,
                time.perf_counter() - t0,
            )
        except Exception as exc:  # pragma: no cover - startup best effort
            logger.warning("Embedding warm-up failed (%s); will load on demand.", exc)

    yield


# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title=settings.app_name,
    description="AI-powered resume analysis, scoring, and coaching platform.",
    version=settings.version,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
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
                f"You are allowed {settings.rate_limit} per IP address. "
                "Please wait before trying again."
            )
        },
    )


# ── Middleware ────────────────────────────────────────────────────────────────
# SlowAPIMiddleware MUST be added before CORSMiddleware so rate-limit rejection
# happens before CORS headers are added and — critically — before a
# StreamingResponse generator is started.  This ensures the 429 is returned
# synchronously even on the SSE /analyze route.
app.add_middleware(SlowAPIMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=settings.cors_allow_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Global error handler ──────────────────────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception(f"Unhandled error on {request.url.path}: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "An unexpected server error occurred. Please try again."},
    )


# ── Daily usage tracking store ────────────────────────────────────────────────
# In-process and therefore per-worker, and reset on every deploy.  Adequate at
# one replica; Phase 7 replaces this with real metrics.
_usage_stats = {
    "date": datetime.date.today().isoformat(),
    "analyze_count": 0,
    "ai_coach_count": 0,
    "total_tracked_calls": 0,
    "endpoints": {},
}


def _roll_over_if_new_day() -> None:
    today = datetime.date.today().isoformat()
    if _usage_stats["date"] != today:
        _usage_stats["date"] = today
        _usage_stats["analyze_count"] = 0
        _usage_stats["ai_coach_count"] = 0
        _usage_stats["total_tracked_calls"] = 0
        _usage_stats["endpoints"] = {}


def _track_request(path: str):
    _roll_over_if_new_day()

    if "/analyze" in path:
        bucket = "analyze_count"
    elif "/ai-coach" in path:
        bucket = "ai_coach_count"
    else:
        return

    _usage_stats[bucket] += 1
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
    response.headers["X-Request-Id"] = request_id
    response.headers["X-Process-Time"] = f"{elapsed}ms"

    logger.info(
        f"[{request_id}] {request.method} {request.url.path}"
        f" -> {response.status_code}  ({elapsed}ms)"
    )
    return response


# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(analyze.router, prefix="/api/v1", tags=["Analysis"])
app.include_router(ai_coach.router, prefix="/api/v1", tags=["AI Coach"])
app.include_router(jobs.router, prefix="/api/v1", tags=["Jobs"])


# ── Health, usage & info endpoints ───────────────────────────────────────────
@app.get("/health", tags=["System"])
async def health_check():
    return {"status": "ok", "version": settings.version}


@app.get("/api/v1/usage-stats", tags=["System"])
async def get_usage_stats():
    """Today's request count for /analyze and /ai-coach endpoints."""
    _roll_over_if_new_day()
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
    from services.similarity import EMBEDDING_MODEL

    return {
        "endpoints": [
            {"path": "/api/v1/analyze", "method": "POST", "desc": "Full resume + JD analysis"},
            {"path": "/api/v1/ai-coach", "method": "POST", "desc": "Bullet rewrites, cover letter, roadmap, interview prep, LinkedIn"},
            {"path": "/api/v1/ai-coach/interview-prep", "method": "POST", "desc": "Standalone interview question generator"},
            {"path": "/api/v1/ai-coach/linkedin", "method": "POST", "desc": "Standalone LinkedIn summary generator"},
            {"path": "/api/v1/ai-coach/course-recommendations", "method": "POST", "desc": "Personalized course recommendations"},
            {"path": "/api/v1/usage-stats", "method": "GET", "desc": "Daily usage statistics monitor"},
            {"path": "/api/v1/jobs", "method": "POST", "desc": "Live job recommendations"},
        ],
        "models": {"embedding": EMBEDDING_MODEL},
        "ats_checks": [
            "contact_info", "section_headers", "keyword_density",
            "date_consistency", "education", "formatting", "length", "quantification",
        ],
    }
