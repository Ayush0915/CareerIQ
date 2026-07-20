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
             ┌──────────────────────────┼──────────────────────────┐
             ▼                          ▼                          ▼
   ┌───────────────────┐      ┌───────────────────┐      ┌───────────────────┐
   │ Fast NLP Pipeline │      │ Async LLM Engine  │      │ Live Job Fetcher  │
   │ (SentenceTransformers│     │ (Groq Llama 3.3)  │      │ (RapidAPI JSearch)│
   └───────────────────┘      └───────────────────┘      └───────────────────┘
```

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
│   │   ├── llm_evaluator.py   # Groq Llama 3.3 orchestration & prompt sanitization
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
│   │   │   └── useAnalysis.js # Custom hook for analysis state management
│   │   └── services/
│   │       └── api.js         # Axios HTTP service client
└── DOCUMENTATION.md           # Full technical documentation
```

---

## 🔑 Environment Configuration

### Backend (`backend/.env`)
Create `backend/.env` based on `backend/.env.example`:
```env
GROQ_API_KEY=gsk_your_groq_api_key_here
RAPIDAPI_KEY=your_rapidapi_jsearch_key_here
```
- **GROQ_API_KEY**: Required for Llama 3.3 AI features. Get a free key at [console.groq.com](https://console.groq.com).
- **RAPIDAPI_KEY**: Required for live job search. Get a free key at [rapidapi.com](https://rapidapi.com).

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
pip install -r requirements.txt

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

### 3. `POST /api/v1/jobs`
Fetches real-time matching jobs.
- **Request Body**:
```json
{
  "skills": ["Python", "React"],
  "location": "India"
}
```

---

## 🌐 Deployment Guide (Vercel & Render)

### Architecture Strategy
- **Frontend (Vite + React)**: Deployed to **Vercel** for ultra-fast CDN delivery.
- **Backend (FastAPI)**: Deployed to **Render / Koyeb** (Docker or Python Web Service).

---

### Step-by-Step Deployment

#### 1. Backend Deployment on Render (Free)
1. Go to [Render Dashboard](https://dashboard.render.com).
2. Click **New +** → **Web Service**.
3. Connect repository: `https://github.com/Ayush0915/CareerIQ`.
4. Set configurations:
   - **Root Directory**: `backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add Environment Variables:
   - `GROQ_API_KEY`: `your_key`
   - `RAPIDAPI_KEY`: `your_key`
6. Click **Create Web Service** and note your URL (e.g. `https://careeriq-backend.onrender.com`).

#### 2. Frontend Deployment on Vercel
1. Go to [Vercel Dashboard](https://vercel.com/dashboard) → **Add New...** → **Project**.
2. Select repository `Ayush0915/CareerIQ`.
3. Configure Project Settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Select `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add Environment Variable:
   - `VITE_API_URL` = `https://careeriq-backend.onrender.com/api/v1`
5. Click **Deploy**.

---

## ❓ Troubleshooting & FAQ

#### Q: PDF parsing returns empty or fails.
- **Cause**: Scanned image PDF without text layer.
- **Solution**: Upload a text-based PDF exported directly from Word, Google Docs, or Canva.

#### Q: Vercel routes give 404 on page refresh.
- **Cause**: SPA route missing rewrite configuration.
- **Solution**: Ensure `frontend/vercel.json` exists with rewrites to `/index.html`.

#### Q: CORS Error when frontend calls backend.
- **Cause**: Backend CORS allowed origins list does not include the Vercel domain.
- **Solution**: Add your Vercel URL to `ALLOWED_ORIGINS` in `backend/main.py`.
