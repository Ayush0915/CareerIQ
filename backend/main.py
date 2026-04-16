from dotenv import load_dotenv
load_dotenv()

import logging
import time
import uuid
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from routers import analyze, ai_coach, jobs

# ── Logging setup ─────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("main")

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="CareerIQ API",
    description="AI-powered resume analysis, scoring, and coaching platform.",
    version="4.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Request-ID + timing middleware ────────────────────────────────────────────
@app.middleware("http")
async def request_middleware(request: Request, call_next):
    request_id = str(uuid.uuid4())[:8]
    request.state.request_id = request_id
    t0 = time.perf_counter()

    response = await call_next(request)

    elapsed = round((time.perf_counter() - t0) * 1000)
    response.headers["X-Request-Id"]   = request_id
    response.headers["X-Process-Time"] = f"{elapsed}ms"

    logger.info(
        f"[{request_id}] {request.method} {request.url.path}"
        f" -> {response.status_code}  ({elapsed}ms)"
    )
    return response


# ── Global error handler ──────────────────────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception(f"Unhandled error on {request.url.path}: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "An unexpected server error occurred. Please try again."},
    )

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(analyze.router,   prefix="/api/v1", tags=["Analysis"])
app.include_router(ai_coach.router,  prefix="/api/v1", tags=["AI Coach"])
app.include_router(jobs.router,      prefix="/api/v1", tags=["Jobs"])


# ── Health + info endpoints ───────────────────────────────────────────────────
@app.get("/health", tags=["System"])
async def health_check():
    import os
    return {
        "status":   "ok",
        "version":  "4.0.0",
        "groq_key": bool(os.environ.get("GROQ_API_KEY")),
        "rapidapi_key": bool(os.environ.get("RAPIDAPI_KEY")),
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
