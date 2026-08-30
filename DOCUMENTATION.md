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
                                        │ HTTP / JSON
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

### 🛠 Tech Stack
- **Frontend**: React 18 SPA, Vite, Tailwind CSS, Lucide React icons
- **Backend**: Python 3.10+, FastAPI microservice, Pydantic data schemas, Uvicorn ASGI server
- **AI Core / LLM Engine**: **OpenRouter** (OpenAI-compatible) with JSON-schema structured outputs, `provider.require_parameters` so only schema-enforcing endpoints are used, and model-level fallback across vendors. Model IDs are configured in `.env` — run `python scripts/check_models.py` to pick one
- **NLP & Similarity**: fastembed (`BAAI/bge-small-en-v1.5`) with a numpy cosine implementation

---

## 📁 Repository Structure

```
CareerIQ/
├── backend/
│   ├── main.py                # FastAPI entrypoint, middleware & global handlers
│   ├── requirements.txt       # Pinned Python package dependencies
│   ├── .env.example           # Backend environment template
│   ├── models/
│   │   └── schemas.py         # Pydantic data models & request/response schemas
│   ├── routers/
│   │   ├── analyze.py         # Resume parsing and scoring endpoints
│   │   ├── ai_coach.py        # AI coaching, interview prep, and rewrite endpoints
│   │   └── jobs.py            # Live job recommendation endpoints
│   ├── services/
│   │   ├── parser.py          # PDF/DOCX text extractors with fallbacks
│   │   ├── ats_simulator.py   # 8-point ATS check engine with evidence extraction
│   │   ├── llm_evaluator.py   # Schema-constrained evaluation + TTL cache
│   │   ├── job_fetcher.py     # Real-time job search & skill-match calculator
│   │   ├── similarity.py      # Vector similarity scoring via SentenceTransformers
│   │   ├── skill_extractor.py # Regex + taxonomy skill extraction
│   │   └── skill_gap_analyzer.py # Critical/Important/Optional gap classifier
│   └── utils/
│       └── text_cleaner.py    # Text normalization & cleaning utilities
├── frontend/
│   ├── package.json           # React dependencies & scripts
│   ├── vite.config.js         # Vite configuration with proxy rules
│   ├── vercel.json            # Vercel SPA rewrite configuration
│   ├── .env.example           # Frontend environment template
│   ├── src/
│   │   ├── App.jsx            # Main React application shell
│   │   ├── index.css          # Core CSS design system & Tailwind setup
│   │   ├── components/
│   │   │   ├── ResultsDashboard.jsx  # Main tabbed dashboard
│   │   │   ├── ATSBreakdown.jsx      # 8-point ATS checklist & evidence UI
│   │   │   ├── LLMInsights.jsx       # AI recommendations & score feedback
│   │   │   ├── AICoach.jsx           # Bullet rewriter & LinkedIn generator
│   │   │   ├── InterviewPrep.jsx     # AI interview question generator
│   │   │   ├── JobRecommendations.jsx# Live jobs list
│   │   │   ├── CourseRecommendations.jsx # Skill gap courses
│   │   │   └── AnalysisHistory.jsx   # LocalStorage persistent history
│   │   ├── hooks/
│   │   │   └── useAnalysis.ts # Analysis state, typed from the OpenAPI schema
│   │   └── services/
│   │       └── api.ts         # fetch-based HTTP client
└── DOCUMENTATION.md           # Full technical documentation
```

---

## 🔑 Environment Configuration

### Backend (`backend/.env`)
Create `backend/.env` based on `backend/.env.example`:
```env
OPENROUTER_API_KEY=sk-or-v1-your_key_here
```
- **OPENROUTER_API_KEY**: Required for all AI features. Get one at [openrouter.ai/keys](https://openrouter.ai/keys).

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
```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# Linux / macOS:
source venv/bin/activate

# Install requirements
uv pip install -r pyproject.toml

# Create .env file and fill keys
cp .env.example .env

# Run FastAPI dev server
uvicorn main:app --reload --port 8000
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

---

## 📡 API Specification

### 1. `POST /api/v1/analyze`
Full resume and Job Description analysis. Accepts multipart form data.
- **Request Body**:
  - `file`: PDF or DOCX file (max 5 MB)
  - `job_description`: Target job text string (min 30 chars)
- **Response (`200 OK`)**:
```json
{
  "semantic_match_score": 82.5,
  "ats_keyword_score": 76.0,
  "resume_skills": ["Python", "FastAPI", "Docker"],
  "jd_skills": ["Python", "FastAPI", "Kubernetes"],
  "matching_skills": ["Python", "FastAPI"],
  "missing_skills": ["Kubernetes"],
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

### 2. `POST /api/v1/ai-coach`
Generates bullet rewrites, interview questions, or LinkedIn summaries.
- **Request Body**:
```json
{
  "mode": "rewrite",
  "text": "Created backend APIs for the system",
  "job_description": "Senior Software Engineer"
}
```

---

## 🌐 Deployment Guide (Vercel & Render)

### Architecture Strategy
- **Frontend (Vite + React)**: Deployed to **Vercel** for ultra-fast CDN delivery.
- **Backend (FastAPI)**: Deployed to **Render / Koyeb** as a plain Python Web Service (no containers).

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
non-secret environment variable. Render prompts for the three secrets.

To configure it manually instead — note that these differ from the obvious
choices, and each difference is a build or runtime failure:

| Setting | Value |
|---|---|
| Root Directory | *(blank — the repo root)* |
| Environment | `Python 3` |
| Build Command | `pip install uv && uv pip install --system -r pyproject.toml && python scripts/prefetch_model.py` |
| Start Command | `uvicorn main:app --app-dir backend --host 0.0.0.0 --port $PORT --workers 1 --proxy-headers --forwarded-allow-ips='*'` |
| Health Check Path | `/health` |

- **Root Directory must be blank, not `backend`.** `pyproject.toml` and
  `scripts/` live at the repo root; with the root set to `backend` the build
  command cannot find either and fails before installing anything.
  `--app-dir backend` is what points the *start* command at the app.
- **`pip install uv` first.** Render's Python runtime ships `python3-pip` and
  `python3-setuptools`. It does not ship `uv`.
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
| `CORS_ALLOW_ORIGIN_REGEX` | must match your Vercel domain — see below |

`TRUST_PROXY_HEADERS` is the one that looks skippable and is not. Without it
every request keys to Render's proxy IP, so `RATE_LIMIT=5/minute` becomes five
requests per minute shared by every visitor. Set it **only** here, where Render
overwrites `X-Forwarded-For`; the header is caller-supplied and spoofable
anywhere the app is reachable directly.

`MODEL_CACHE_DIR` points inside the project directory because that survives
from build to runtime. Left at its default, a cold start may re-download 130MB
from HuggingFace.

Note the service URL (e.g. `https://careeriq-api.onrender.com`).

#### 2. Frontend on Vercel

1. [Vercel Dashboard](https://vercel.com/dashboard) → **Add New...** → **Project**.
2. Select `Ayush0915/CareerIQ`.
3. Framework Preset `Vite`, Root Directory `frontend`, Build `npm run build`,
   Output `dist`.
4. Environment variable `VITE_API_URL` = `https://careeriq-api.onrender.com/api/v1`
   (keep the `/api/v1` suffix — it is the whole base path the client uses).
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
