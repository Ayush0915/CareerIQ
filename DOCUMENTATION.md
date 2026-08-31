# 📖 CareerIQ — Comprehensive Technical & Deployment Documentation

This document contains full setup, architecture, API, and deployment instructions for **CareerIQ**.

---

## 📌 Table of Contents
1. [System Architecture](#-system-architecture)
2. [Repository Structure](#-repository-structure)
3. [Environment Configuration](#-environment-configuration)
4. [Local Development Guide](#-local-development-guide)
5. [API Specification](#-api-specification)
6. [Deployment Guide (Vercel & Render)](#-deployment-guide-vercel--render)
7. [Troubleshooting & FAQ](#-troubleshooting--faq)

---

## 🏗 System Architecture

CareerIQ is designed as a decoupled, high-performance web application consisting of a **React SPA frontend** and a **FastAPI backend microservice**.

```
                           ┌──────────────────────────┐
                           │      React 18 SPA        │
                           │  (Vite + Tailwind CSS)   │
                           └────────────┬─────────────┘
                                        │ HTTP / SSE
                                        ▼
                           ┌──────────────────────────┐
                           │     FastAPI Backend      │
                           └────────────┬─────────────┘
                                        │
             ┌──────────────────────────┴──────────────────────────┐
             ▼                                                     ▼
   ┌───────────────────┐                             ┌───────────────────┐
   │ Fast NLP Pipeline │                             │ Async LLM Engine  │
   │ (fastembed / bge) │                             │ (OpenRouter)      │
   └───────────────────┘                             └───────────────────┘
```

`POST /api/v1/analyze` returns a `StreamingResponse` of Server-Sent Events, not a
single JSON body. The CPU-bound stages run in a thread executor so the event loop
stays free to flush progress events while an analysis is in flight.

### 🛠 Tech Stack

- **Frontend**: React 18 SPA, Vite 5, Tailwind CSS 3.4, Lucide React icons,
  `@tanstack/react-query` for server state, `react-dropzone` for uploads,
  TypeScript for the hooks/services/types layer. Exactly matches
  `frontend/package.json` — there is no charting library and no HTTP client
  dependency; the radar is inline SVG and the client uses `fetch`.
- **Backend**: Python 3.10+, FastAPI, Pydantic v2 schemas, Uvicorn ASGI server,
  slowapi for rate limiting.
- **AI Core / LLM Engine**: **OpenRouter** (OpenAI-compatible) with JSON-schema structured outputs, `provider.require_parameters` so only schema-enforcing endpoints are used, and model-level fallback across vendors. Model IDs are configured in `.env` — run `python scripts/check_models.py` to pick one.
- **NLP & Similarity**: fastembed (`BAAI/bge-small-en-v1.5`) with a numpy cosine implementation.
- **Tooling**: `uv` for dependency management, `pytest` for tests, `ruff` for lint.

---

## 📁 Repository Structure

```
CareerIQ/
├── pyproject.toml             # Dependencies, pytest & ruff config (repo root)
├── uv.lock                    # Resolved dependency lockfile
├── render.yaml                # Render Blueprint for the backend service
├── README.md
├── DOCUMENTATION.md           # This file
├── backend/
│   ├── main.py                # FastAPI entrypoint, middleware & global handlers
│   ├── .env.example           # Backend environment template
│   ├── skills_database.csv    # Skill taxonomy used by the extractor
│   ├── core/
│   │   ├── config.py          # Pydantic settings — all env vars live here
│   │   ├── limiter.py         # slowapi rate limiter
│   │   ├── llm.py             # OpenRouter client, output-mode ladder & TTL cache
│   │   └── redact.py          # Strips resume PII before any prompt leaves
│   ├── models/
│   │   └── schemas.py         # Pydantic request/response models
│   ├── routers/
│   │   ├── analyze.py         # SSE analysis endpoint
│   │   └── ai_coach.py        # Coaching modes & course recommendations
│   ├── services/
│   │   ├── parser.py          # PDF/DOCX text extractors with fallbacks
│   │   ├── ats_simulator.py   # 8-point ATS check engine with evidence extraction
│   │   ├── llm_evaluator.py   # Schema-constrained master evaluation
│   │   ├── ai_coach.py        # Bullet rewrite & roadmap generators
│   │   ├── similarity.py      # Vector similarity via fastembed + numpy cosine
│   │   ├── scoring.py         # compute_fit, assess_level, JD seniority
│   │   ├── evidence.py        # Demonstrated vs merely-listed skills
│   │   ├── experience_detector.py  # Years of experience, scoped to the Experience section
│   │   ├── section_parser.py  # Section boundaries & per-section scores
│   │   ├── signal_noise_analyzer.py # Clarity, weak phrasing, quantification
│   │   ├── skill_extractor.py # Regex + taxonomy skill extraction
│   │   ├── skill_gap_analyzer.py   # Critical/Important/Optional gap classifier
│   │   ├── recommender.py     # Feedback, matching & missing skills
│   │   └── aliases.py         # Skill alias expansion
│   └── utils/
│       └── text_cleaner.py    # Text normalization & cleaning utilities
├── frontend/
│   ├── package.json           # React dependencies & scripts
│   ├── vite.config.js         # Vite configuration with proxy rules
│   ├── tailwind.config.js     # Tailwind theme
│   ├── tsconfig.json          # TypeScript config
│   ├── vercel.json            # Vercel SPA rewrite configuration
│   ├── openapi.json           # Schema snapshot for `npm run gen:types`
│   ├── .env.example           # Frontend environment template
│   └── src/
│       ├── App.jsx            # Main React application shell
│       ├── main.tsx           # Entry point & QueryClient provider
│       ├── index.css          # Core CSS design system & Tailwind setup
│       ├── vite-env.d.ts      # Vite ambient types (incl. VITE_API_URL)
│       ├── components/
│       │   ├── UploadSection.jsx     # Dropzone + JD input
│       │   ├── LoadingScreen.jsx     # SSE stage progress
│       │   ├── ResultsDashboard.jsx  # Main tabbed dashboard
│       │   ├── ATSBreakdown.jsx      # 8-point ATS checklist & evidence UI
│       │   ├── AICoach.jsx           # Bullet rewriter & 30-day roadmap
│       │   ├── InterviewPrep.jsx     # Interview questions from the LLM evaluation
│       │   ├── CourseRecommendations.jsx # Skill gap courses
│       │   ├── KeywordDiff.jsx       # Matching vs missing keywords
│       │   ├── AnalysisHistory.jsx   # LocalStorage persistent history
│       │   ├── ScoreRing.jsx         # Circular score gauge
│       │   ├── SkillBadge.jsx        # Skill pill
│       │   ├── dashboard/
│       │   │   ├── OverviewTab.jsx       # Score & fit overview
│       │   │   ├── SkillsTab.jsx         # Skills and gaps
│       │   │   ├── ScoreSidebar.jsx      # Accordion score breakdown
│       │   │   ├── AccordionSection.jsx  # Collapsible section primitive
│       │   │   └── PerformanceRadar.jsx  # Inline SVG radar (no chart library)
│       │   └── ui/
│       │       ├── Card.jsx
│       │       ├── Badge.jsx
│       │       └── ScoreBar.jsx
│       ├── hooks/
│       │   ├── useAnalysis.ts   # Analysis state, typed from the OpenAPI schema
│       │   ├── useRemoteData.ts # Query wrapper for coach/course endpoints
│       │   └── useTypewriter.js # Text reveal animation
│       ├── services/
│       │   └── api.ts           # fetch-based HTTP client + SSE reader
│       └── types/
│           └── api.ts           # Shared response types
├── evals/
│   ├── README.md              # How to run the harness
│   ├── run.py                 # Deterministic pipeline evaluation
│   ├── bakeoff.py             # Model comparison
│   ├── dataset.py             # Fixture loading
│   ├── metrics.py             # Scoring metrics
│   ├── parse_recall.py        # Parser recall measurement
│   └── data/                  # seed.jsonl, stress_a.jsonl, stress_b.jsonl
├── scripts/
│   ├── check_models.py        # Validate/audit OpenRouter model reachability
│   └── prefetch_model.py      # Warm the embedding model at build time
└── tests/                     # pytest suite (conftest.py + test_*.py)
```

---

## 🔑 Environment Configuration

### Backend (`backend/.env`)
Create `backend/.env` based on `backend/.env.example`, which documents every
variable inline:
```env
OPENROUTER_API_KEY=sk-or-v1-your_key_here
PRIMARY_MODEL=nvidia/nemotron-3-super-120b-a12b:free
FALLBACK_MODELS=...
STRUCTURED_OUTPUT_MODE=auto
ENVIRONMENT=development
TRUST_PROXY_HEADERS=false
RATE_LIMIT=5/minute
```
- **OPENROUTER_API_KEY**: Required for all AI features. Get one at [openrouter.ai/keys](https://openrouter.ai/keys).
- All settings are defined in `backend/core/config.py`.

### Frontend (`frontend/.env`)
Create `frontend/.env` based on `frontend/.env.example`:
```env
VITE_API_URL=http://localhost:8000/api/v1
```

---

## 💻 Local Development Guide

### Step 1: Clone the Repository
```bash
git clone https://github.com/Ayush0915/CareerIQ.git
cd CareerIQ
```

### Step 2: Start Backend Server

`pyproject.toml` and `scripts/` live at the **repository root**. Install from the
root and point the server at `backend/` with `--app-dir`:

```bash
# From the repository root
uv sync

# Create .env file and fill keys
cp backend/.env.example backend/.env

# Run FastAPI dev server
uv run uvicorn main:app --app-dir backend --reload --port 8000
```
- Interactive Swagger API docs: [http://localhost:8000/docs](http://localhost:8000/docs)
- Health check: [http://localhost:8000/health](http://localhost:8000/health)

### Step 3: Start Frontend Client
In a new terminal window:
```bash
cd frontend

# Install node dependencies
npm install

# Create environment file
cp .env.example .env

# Start Vite server
npm run dev
```
- Application UI: [http://localhost:5173](http://localhost:5173)

### Step 4: Tests, Lint & Types
```bash
# From the repository root
uv run pytest
uv run ruff check .

cd frontend
npm run typecheck
npm run build
```

---

## 📡 API Specification

All application endpoints are mounted under the `/api/v1` prefix
(`backend/main.py`). `/health` is mounted at the root.

### 1. `POST /api/v1/analyze`
Full resume and Job Description analysis. Accepts multipart form data and
responds with **Server-Sent Events**, not a single JSON body.
- **Request Body**:
  - `file`: PDF or DOCX file (max 5 MB)
  - `job_description`: Target job text string (min 30 chars)
- **Response (`200 OK`, `text/event-stream`)**: each line is `data: {...}` carrying one of
```json
{ "event": "progress", "progress": 45, "message": "Extracting your skills" }
{ "event": "complete", "progress": 100, "result": { "...": "AnalysisResponse" } }
{ "event": "error",    "message": "..." }
```
- The `complete` event's `result` is the full `AnalysisResponse`:
```json
{
  "semantic_match_score": 82.5,
  "ats_keyword_score": 76.0,
  "resume_skills": ["Python", "FastAPI", "Docker"],
  "jd_skills": ["Python", "FastAPI", "Kubernetes"],
  "matching_skills": ["Python", "FastAPI"],
  "missing_skills": ["Kubernetes"],
  "fit": {
    "overall": 78.8,
    "semantic": 67.8,
    "coverage": 83.3,
    "clarity": 100.0,
    "evidence_ratio": 0.69,
    "unsupported_skills": ["terraform"]
  },
  "experience_info": {
    "detected_years": 8,
    "required_years": 5,
    "level": "senior",
    "meets_requirement": true,
    "gap_years": 0,
    "low_confidence": false
  },
  "ats_simulation": {
    "overall_ats_score": 85.0,
    "verdict": "ATS-Ready",
    "checks": {
      "contact_info": { "score": 100, "note": "All contact fields detected." },
      "quantification": {
        "score": 50,
        "evidence": { "examples": ["Weak bullet: \"Developed APIs...\""] }
      }
    }
  }
}
```
> `experience_info.low_confidence` is `true` when the resume had no recognisable
> Experience section, so the year count came from the whole document and may
> include education dates. Treat the number as indicative in that case.

### 2. `GET /api/v1/ai-coach/modes`
Lists the coaching modes the server supports, so the UI is not hardcoded.
```json
{ "modes": [
  { "id": "bullets", "label": "Improved bullet points" },
  { "id": "roadmap", "label": "30-day skill roadmap" }
] }
```

### 3. `POST /api/v1/ai-coach/generate`
Generates one coaching artefact per call — one request per mode, on demand.
- **Request Body**:
```json
{
  "mode": "bullets",
  "weak_phrases": ["Developed backend APIs for the system"],
  "missing_skills": ["Kubernetes"],
  "job_description": "Senior Software Engineer...",
  "resume_text": "..."
}
```

### 4. `POST /api/v1/ai-coach/course-recommendations`
Personalized learning resources for the detected skill gaps. Accepts either a
`skill_gap_analysis` object or explicit `critical` / `important` / `optional`
lists, plus optional `job_description` and `resume_text`.

### 5. System endpoints
| Path | Method | Purpose |
|---|---|---|
| `/health` | GET | Liveness probe used by Render's health check |
| `/api/v1/usage-stats` | GET | Daily usage counters |
| `/api/v1/capabilities` | GET | Advertised endpoints, embedding model, ATS check names |

---

## 🌐 Deployment Guide (Vercel & Render)

### Architecture Strategy
- **Frontend (Vite + React)**: Deployed to **Vercel** for ultra-fast CDN delivery.
- **Backend (FastAPI)**: Deployed to **Render** as a plain Python Web Service (no containers).

---

### Before you deploy anything

Enable **both** toggles at <https://openrouter.ai/settings/privacy>:

- Free endpoints that may train on request data
- Free endpoints that may publish prompts

This is an account setting, not a config value, and free models do not work
without it. With either toggle off, OpenRouter filters out every free endpoint
and answers `404 No endpoints available matching your guardrail restrictions
and data policy` — which reads like a broken model list and is not one. Resume
PII is stripped before any prompt leaves the process (`backend/core/redact.py`),
but the resume body still goes to a provider that may publish it. If that trade
is unacceptable, add credit and use paid endpoints instead.

Then confirm the models actually answer:

```bash
python scripts/check_models.py --validate --deep
```

Use `--deep`. Plain `--validate` only checks that an ID exists in the
catalogue, and existence is not reachability — two models sat in the defaults
for several commits passing `--validate` while returning
`403 only available on agentic harnesses` to every real request.

---

### Step-by-Step Deployment

#### 1. Backend on Render (Free)

The repository ships a Blueprint. Prefer it over filling the form by hand:

**Render Dashboard → New + → Blueprint → select this repo.** `render.yaml` sets
the root directory, build command, start command, health check and every
non-secret environment variable. Render prompts for the two secrets marked
`sync: false` (`OPENROUTER_API_KEY` and `CORS_ALLOW_ORIGIN_REGEX`).

To configure it manually instead — note that these differ from the obvious
choices, and each difference is a build or runtime failure:

| Setting | Value |
|---|---|
| Root Directory | *(blank — the repo root)* |
| Environment | `Python 3` |
| Build Command | `uv sync --frozen --no-dev && uv run python scripts/prefetch_model.py` |
| Start Command | `uv run uvicorn main:app --app-dir backend --host 0.0.0.0 --port $PORT --workers 1 --proxy-headers --forwarded-allow-ips='*'` |
| Health Check Path | `/health` |

- **Root Directory must be blank, not `backend`.** `pyproject.toml` and
  `scripts/` live at the repo root; with the root set to `backend` the build
  command cannot find either and fails before installing anything.
  `--app-dir backend` is what points the *start* command at the app.
- **`uv run` on the start command is not optional.** `uv sync` installs into
  `.venv`, not system site packages, so a bare `uvicorn` is not on PATH. These
  are the exact commands `render.yaml` uses, which is the configuration the
  service is known to build and boot with.
- **`--workers 1` is not optional.** The LLM output-mode cache, the rate limiter
  and the usage counters are all per-process. A second worker halves the
  effective rate limit and makes each worker re-negotiate the output ladder.

Environment variables:

| Key | Value |
|---|---|
| `OPENROUTER_API_KEY` | your key |
| `ENVIRONMENT` | `production` |
| `TRUST_PROXY_HEADERS` | `true` |
| `MODEL_CACHE_DIR` | `/opt/render/project/src/.model-cache` |
| `RATE_LIMIT` | `5/minute` |
| `EMBEDDING_THREADS` | `1` |
| `CORS_ALLOW_ORIGIN_REGEX` | must match your Vercel domain — see below |

`TRUST_PROXY_HEADERS` is the one that looks skippable and is not. Without it
every request keys to Render's proxy IP, so `RATE_LIMIT=5/minute` becomes five
requests per minute shared by every visitor. Set it **only** here, where Render
overwrites `X-Forwarded-For`; the header is caller-supplied and spoofable
anywhere the app is reachable directly.

`MODEL_CACHE_DIR` points inside the project directory because that survives
from build to runtime. Left at its default, a cold start may re-download 130MB
from HuggingFace.

`EMBEDDING_THREADS=1` because onnxruntime sizes its thread pool from the host's
core count, which on a shared 0.1-CPU instance is eight threads contending for a
tenth of a core — slower than one thread owning it outright, and the contention
is what starves the event loop.

Note the service URL (e.g. `https://careeriq-api.onrender.com`).

#### 2. Frontend on Vercel

1. [Vercel Dashboard](https://vercel.com/dashboard) → **Add New...** → **Project**.
2. Select `Ayush0915/CareerIQ`.
3. Framework Preset `Vite`, Root Directory `frontend`, Build `npm run build`,
   Output `dist`.
4. Environment variable `VITE_API_URL` = `https://careeriq-api.onrender.com/api/v1`
   (keep the `/api/v1` suffix — it is the whole base path the client uses).
   It is read at **build** time, so setting it after a deploy does nothing until
   you redeploy.
5. Deploy, then set `CORS_ALLOW_ORIGIN_REGEX` on the Render service to match the
   domain Vercel gave you, and redeploy the backend.

#### 3. Free-tier cold starts

Render stops a free instance after 15 minutes idle and takes roughly a minute to
start again. Every request timeout in the frontend is 45-65s, so without help
the first analysis after a quiet period aborts before the server has booted.

The frontend calls `GET /health` at module load (`wakeBackend()` in
`src/services/api.ts`), which spends that minute while the user is still
choosing a file. That covers the common case. Beyond it:

- **Ping every 10 minutes** from an external cron. Free tier gives 750
  instance-hours a month and a month is at most 744, so one always-warm free
  service fits — but it uses the entire allowance on that one service.
- **Render Starter, $7/month.** No spin-down, and the "results in ~10s" claim on
  the landing page becomes true.

#### 4. Resource footprint

Measured, not estimated — peak RSS for one full analysis:

| Stage | RSS |
|---|---|
| Application imported | 146 MB |
| Embedding model warmed | 267 MB |
| One full analysis | 290 MB |

The free instance is 512 MB. This fits at one worker and would not fit at two.

---

## ❓ Troubleshooting & FAQ

#### Q: PDF parsing returns empty or fails.
- **Cause**: Scanned image PDF without text layer.
- **Solution**: Upload a text-based PDF exported directly from Word, Google Docs, or Canva.

#### Q: Vercel routes give 404 on page refresh.
- **Cause**: SPA route missing rewrite configuration.
- **Solution**: Ensure `frontend/vercel.json` exists with rewrites to `/index.html`.

#### Q: The deployed frontend gets HTML back instead of JSON from `/analyze`.
- **Cause**: `VITE_API_URL` was not set at build time, so the client fell back to
  the relative `/api/v1`. `vercel.json` rewrites every unmatched path to
  `index.html`, so the request resolves to the SPA shell and the SSE reader
  fails on markup.
- **Solution**: set `VITE_API_URL` in the Vercel project and **redeploy** — the
  value is baked into the bundle at build time.

#### Q: CORS error when the frontend calls the backend.
- **Cause**: `CORS_ALLOW_ORIGIN_REGEX` does not match the deployed domain. The
  default accepts `careeriq*.vercel.app`, `career-iq*.vercel.app` and localhost;
  anything else — a custom domain, a differently-named Vercel project — needs
  the variable set explicitly.
- **Diagnosis**: the backend answers `curl` perfectly while every browser
  request fails. That combination is always CORS, never a dead backend.
- **Solution**: set `CORS_ALLOW_ORIGIN_REGEX` on the Render service to a regex
  matching your domain, then redeploy. There is no `ALLOWED_ORIGINS` list in
  `backend/main.py` — that was removed when configuration moved to
  `backend/core/config.py`.

#### Q: Every LLM panel is empty but the app looks healthy.
- **Cause**: OpenRouter returned `404 No endpoints available matching your
  guardrail restrictions and data policy` for every model. The analysis
  pipeline is deterministic and keeps working without an LLM, so the app
  degrades quietly instead of failing loudly.
- **Solution**: enable both free-endpoint toggles at
  <https://openrouter.ai/settings/privacy>, then confirm with
  `python scripts/check_models.py --validate --deep`.

#### Q: The LLM call takes minutes, or returns truncated JSON.
- **Cause**: a reasoning model spending its whole `max_tokens` budget thinking.
  Reasoning tokens are billed against the same budget as output, so the object
  gets cut off mid-key.
- **Solution**: already handled — `core/llm.py` sends `reasoning.enabled=false`
  and retries once at double the budget on truncation. If you add a model to the
  chain and see this return, check it against
  `python scripts/check_models.py --audit` before trusting it.

#### Q: The first analysis after a quiet period times out.
- **Cause**: Render's free instance spun down and needs about a minute to start.
- **Solution**: see *Free-tier cold starts* in the deployment guide. The
  frontend already pings `/health` on load; a warm instance costs $7/month.
