# 📌 CareerIQ — AI Resume Analyzer

> **Turn your resume from overlooked to interview-ready.**
> An end-to-end AI platform that scores your resume against any job description, simulates real ATS systems, maps skill gaps, and generates personalized coaching — all in under 10 seconds.

[\![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=flat&logo=fastapi)](https://fastapi.tiangolo.com/)
[\![React](https://img.shields.io/badge/Frontend-React_18-61DAFB?style=flat&logo=react)](https://reactjs.org/)
[\![LLM](https://img.shields.io/badge/AI-Llama_3.3_70B-blueviolet?style=flat)](https://groq.com/)
[\![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 🚀 Overview

### What does it do?

CareerIQ accepts your resume (PDF or DOCX) and a job description, then runs a full multi-layer analysis:

1. **Parses** your resume text and contact info
2. **Scores** semantic similarity between your resume and the JD using BERT embeddings
3. **Simulates** an ATS system across 8 dimensions (formatting, keywords, length, and more)
4. **Classifies** skill gaps into critical / important / optional tiers
5. **Evaluates** writing quality — weak phrases, strong verbs, quantified impact
6. **Calls Llama 3.3-70b** for deep qualitative evaluation, interview questions, salary insight, and improvement recommendations
7. **Recommends** live job listings and curated courses to close identified skill gaps

### The problem it solves

Over 75% of resumes are rejected by ATS software before a human ever reads them. Most candidates have no visibility into *why* they got rejected, what skills the JD actually requires, or how to rewrite their resume to pass screening. CareerIQ makes all of this transparent, actionable, and instant.

### Who is it for?

- **Job seekers** preparing for applications and interviews
- **Career changers** mapping their existing skills to a new domain
- **Students** entering the job market for the first time
- **Recruiters** benchmarking candidate fit against open roles

---

## 🧠 Features

| Feature | Description |
|---|---|
| **Semantic Match Scoring** | BERT (all-MiniLM-L6-v2) encodes resume sentences and the JD, then measures cosine similarity. Filters out education/contact noise before scoring |
| **8-Point ATS Simulation** | Checks contact info, section headers, keyword density, date consistency, education, formatting, length, and quantified impact — all weighted |
| **Skill Gap Analysis** | Extracts skills from both resume and JD using a 2,000+ skill database, then classifies missing ones as critical / important / optional based on JD frequency |
| **Signal-to-Noise Analysis** | Detects weak phrases ("responsible for", "helped with"), buzzwords, passive voice, and counts strong action verbs |
| **LLM Deep Evaluation** | Llama 3.3-70b provides overall score, section-by-section feedback, keyword analysis, grammar issues, cliché detection, and fit verdict |
| **Interview Prep** | AI generates tailored interview questions with STAR-method coaching tips, resume strengths, salary range, and competition level |
| **ATS Report Tab** | Dedicated panel showing all 8 ATS check results with expandable details, pass/warn/fail status, and weighted progress bars |
| **Live Job Recommendations** | Real-time job listings matched to your skills from LinkedIn, Indeed & Glassdoor via the JSearch API |
| **Course Recommendations** | 28-course curated database mapped to 80+ skill keywords — auto-suggests based on your specific gaps |
| **AI Career Coach** | Generates improved bullet points and a 30-day skill roadmap using Llama 3.3-70b |
| **Animated Loading Screen** | Hex-step checklist + live score gauge — analysis progress visualized in real time |

---

## 🏗️ Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 18.3 | UI framework |
| Vite | 5.3 | Build tool & dev server |
| Tailwind CSS | 3.4 | Utility-first styling |
| Lucide React | 0.383 | Icon library |
| Recharts | 2.12 | Radar chart + score visualizations |
| Axios | 1.7 | HTTP client |
| react-dropzone | 14.2 | Resume file upload |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| FastAPI | latest | REST API framework |
| Uvicorn | latest | ASGI server |
| Pydantic | latest | Request/response validation |
| Python | 3.10+ | Runtime |

### AI / ML
| Technology | Purpose |
|---|---|
| Sentence Transformers (`all-MiniLM-L6-v2`) | BERT embeddings for semantic similarity |
| scikit-learn | Cosine similarity computation |
| Groq SDK | LLM API client |
| Llama 3.3-70b-versatile | Primary model — deep evaluation, interview prep, coaching |
| Llama 3.1-8b-instant | Fallback model when primary is rate-limited |

### Parsing
| Library | Purpose |
|---|---|
| pdfplumber | Primary PDF text extraction |
| PyPDF2 | Fallback PDF parser |
| python-docx | DOCX file parsing |

### Infrastructure
| Tool | Purpose |
|---|---|
| Docker + Docker Compose | Containerised deployment |
| python-dotenv | Environment variable management |

---

## 📂 Project Structure

```
ai-resume-analyzer/
│
├── backend/                        # FastAPI Python server
│   ├── main.py                     # App entry point, CORS, middleware, routers
│   ├── requirements.txt            # Python dependencies
│   │
│   ├── routers/                    # API route handlers
│   │   ├── analyze.py              # POST /api/v1/analyze  (main endpoint)
│   │   ├── ai_coach.py             # POST /api/v1/ai-coach
│   │   └── jobs.py                 # POST /api/v1/jobs
│   │
│   ├── services/                   # Business logic layer
│   │   ├── parser.py               # PDF/DOCX text extraction + contact parsing
│   │   ├── skill_extractor.py      # Skill detection against skills_database.csv
│   │   ├── similarity.py           # BERT semantic similarity scoring
│   │   ├── skill_gap_analyzer.py   # Critical / important / optional gap classification
│   │   ├── signal_noise_analyzer.py# Weak phrase, strong verb, buzzword detection
│   │   ├── recommender.py          # Keyword coverage, missing skills, feedback
│   │   ├── llm_evaluator.py        # Llama 3.3 deep evaluation + retry/fallback logic
│   │   ├── ats_simulator.py        # 8-point ATS check engine
│   │   ├── experience_detector.py  # Years of experience extraction
│   │   ├── section_parser.py       # Resume section identification + scoring
│   │   └── ai_coach.py             # Bullet rewriter, roadmap, interview prep
│   │
│   ├── models/
│   │   └── schemas.py              # Pydantic request/response models
│   │
│   ├── utils/
│   │   └── text_cleaner.py         # Text normalisation helpers
│   │
│   └── skills_database.csv         # 2,000+ skill keywords
│
├── frontend/                       # React + Vite application
│   ├── index.html                  # Entry HTML
│   ├── vite.config.js              # Vite + API proxy config
│   ├── tailwind.config.js          # Custom design tokens (accent, navy, bg, etc.)
│   │
│   └── src/
│       ├── App.jsx                 # Root component, routing between views
│       ├── main.jsx                # React DOM mount
│       ├── index.css               # Global styles, ev-card, ev-badge, btn-primary
│       │
│       ├── components/
│       │   ├── UploadSection.jsx       # File dropzone + JD textarea
│       │   ├── LoadingScreen.jsx       # Animated hex checklist + gauge
│       │   ├── ResultsDashboard.jsx    # Tabbed results view + sticky sidebar
│       │   ├── ScoreRing.jsx           # SVG circular + semi-circle score gauges
│       │   ├── SkillBadge.jsx          # Colour-coded skill pill component
│       │   ├── LLMInsights.jsx         # AI analysis tab (accordion cards)
│       │   ├── ATSBreakdown.jsx        # ATS Report tab (8-check panel)
│       │   ├── InterviewPrep.jsx       # Interview tab (Q&A + strengths + insights)
│       │   ├── JobRecommendations.jsx  # Live jobs tab (tabbed, filterable)
│       │   ├── CourseRecommendations.jsx# Courses tab (skill-matched 28 courses)
│       │   └── AICoach.jsx             # AI Coach tab (bullet rewrites + roadmap)
│       │
│       ├── hooks/
│       │   └── useAnalysis.js      # State management for analysis flow + progress
│       │
│       └── services/
│           └── api.js              # Axios API calls (analyzeResume, getJobs, etc.)
│
├── docker-compose.yml              # Run frontend + backend together
├── .env.example                    # Environment variable template
└── README.md                       # Project readme + upgrade log
```

---

## ⚙️ Setup & Installation Guide

### Prerequisites

Make sure you have these installed before you start:

- **Python 3.10 or higher** — [Download here](https://www.python.org/downloads/)
- **Node.js 18 or higher** — [Download here](https://nodejs.org/)
- **Git** — [Download here](https://git-scm.com/)

You'll also need two API keys (both have free tiers):
- **Groq API key** — [Get it here](https://console.groq.com/) (free, needed for AI features)
- **RapidAPI key** — [Get it here](https://rapidapi.com/) (needed for live job listings only)

---

### Step 1 — Clone the Repository

```bash
git clone https://github.com/Ayush0915/ai-resume-analyzer.git
cd ai-resume-analyzer
```

---

### Step 2 — Set Up the Backend

Navigate into the backend folder:

```bash
cd backend
```

Create a Python virtual environment (this keeps your dependencies isolated):

```bash
# On macOS / Linux
python3 -m venv venv
source venv/bin/activate

# On Windows
python -m venv venv
venv\Scripts\activate
```

You'll see `(venv)` appear at the start of your terminal line — that means it worked.

Install all Python dependencies:

```bash
pip install -r requirements.txt
```

> ⚠️ This step downloads the `all-MiniLM-L6-v2` BERT model (~80 MB) on first run. That's normal.

---

### Step 3 — Configure Environment Variables (Backend)

Copy the example env file:

```bash
# From the project root
cp .env.example .env
```

Open `.env` and fill in your keys:

```env
GROQ_API_KEY=your_groq_api_key_here
RAPIDAPI_KEY=your_rapidapi_key_here
```

---

### Step 4 — Run the Backend Server

```bash
# Make sure you're in the /backend directory with venv active
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

You should see:

```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
```

Visit [http://localhost:8000/docs](http://localhost:8000/docs) to see the interactive API documentation.

---

### Step 5 — Set Up the Frontend

Open a **new terminal tab/window**, then:

```bash
cd frontend
npm install
```

Copy the frontend env example:

```bash
cp .env.example .env
```

The default value already points to the local backend:

```env
VITE_API_URL=http://localhost:8000/api/v1
```

Start the frontend dev server:

```bash
npm run dev
```

You should see:

```
  VITE v5.3.1  ready in 400ms
  ➜  Local:   http://localhost:5173/
```

Open [http://localhost:5173](http://localhost:5173) in your browser — you're live\!

---

### Alternative: Run with Docker

If you have Docker installed, you can run the entire stack in one command from the project root:

```bash
docker-compose up --build
```

This starts both the backend (port 8000) and frontend (port 5173) automatically.

---

## 🔑 Environment Variables

### Backend (`/.env`)

| Variable | Required | Description |
|---|---|---|
| `GROQ_API_KEY` | ✅ Yes | Powers all AI features. Used to call Llama 3.3-70b (primary) and Llama 3.1-8b (fallback) via Groq's ultra-fast inference API. Get yours free at [console.groq.com](https://console.groq.com) |
| `RAPIDAPI_KEY` | ⚠️ Optional | Fetches real-time job listings from LinkedIn, Indeed, and Glassdoor via the JSearch API on RapidAPI. Only needed for the Live Jobs tab. Get it at [rapidapi.com](https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch) |

### Frontend (`/frontend/.env`)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | ⚠️ Optional | The base URL of the backend API. Defaults to `/api/v1` (relative, works with Vite proxy). Set to `http://localhost:8000/api/v1` for local development |

---

## 💻 Code Explanation

### 1. Semantic Similarity Engine

**File:** `backend/services/similarity.py`

```python
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

model = SentenceTransformer("all-MiniLM-L6-v2")

def calculate_similarity(resume_text: str, jd_text: str, top_k: int = 5):
    sentences = simple_sentence_split(resume_text)

    # Filter out noise (education lines, contact info)
    filtered_sentences = [
        s for s in sentences
        if not re.search(r'\b(email|phone|linkedin|bachelor|cgpa)\b', s.lower())
    ]

    jd_embedding = model.encode([jd_text])
    sentence_embeddings = model.encode(filtered_sentences)

    similarities = cosine_similarity(sentence_embeddings, jd_embedding).flatten()

    sentence_scores = sorted(zip(filtered_sentences, similarities), key=lambda x: x[1], reverse=True)
    top_matches = sentence_scores[:top_k]

    final_score = np.mean([score for _, score in top_matches])
    return {"final_score": round(float(final_score) * 100, 2), "top_matches": ...}
```

**What this does:**
This is the core intelligence of the scoring engine. It doesn't just count keywords — it *understands meaning*.

**How it works step by step:**
1. The resume is split into individual sentences
2. Noisy sentences (contact info, education headers) are filtered out so they don't distort the score
3. Both the job description and each resume sentence are converted into **384-dimensional vectors** using the BERT model
4. `cosine_similarity` measures the *angle* between each resume sentence vector and the JD vector — sentences that are semantically close score high even if they use different words
5. The top 5 matching sentences are averaged into a final score

**Why BERT instead of keyword matching:**
A resume saying *"built distributed microservices handling 2M daily requests"* matches a JD saying *"experience with scalable backend systems"* — even though none of the words overlap. Keyword matching would score this zero. BERT scores it high because it understands context.

---

### 2. ATS 8-Point Simulator

**File:** `backend/services/ats_simulator.py`

```python
def simulate_ats(resume_text: str, jd_text: str) -> Dict:
    checks = {
        "contact_info":     _score_contact_info(resume_text),
        "section_headers":  _score_section_headers(resume_text),
        "keyword_density":  _score_keyword_density(resume_text, jd_text),
        "date_consistency": _score_date_consistency(resume_text),
        "education":        _score_education(resume_text),
        "formatting":       _score_formatting(resume_text),
        "length":           _score_length(resume_text),
        "quantification":   _score_quantification(resume_text),
    }

    weights = {
        "keyword_density": 0.25, "formatting": 0.15,
        "quantification":  0.15, "section_headers": 0.12,
        # ... etc
    }

    overall = sum(checks[k]["score"] * weights[k] for k in checks)
    verdict = "ATS-Ready" if overall >= 75 else "Needs Improvement" if overall >= 50 else "High ATS Risk"

    return {"overall_ats_score": overall, "checks": checks, "verdict": verdict}
```

**What this does:**
Simulates how a real ATS (Applicant Tracking System like Workday, Greenhouse, or Lever) would score a resume before a human ever reads it.

**How each check works:**
- **Contact Info** — regex searches for email, phone, LinkedIn, GitHub patterns
- **Section Headers** — looks for standard headings: Experience, Education, Skills, Projects
- **Keyword Density** — compares significant words (3+ chars, not stopwords) between resume and JD; scores the overlap ratio
- **Date Consistency** — detects employment dates with regex, flags potential gaps > 2 years
- **Education** — searches for degree keywords (Bachelor, B.Tech, MBA, PhD, etc.)
- **Formatting** — penalises tables, multi-column layouts, emojis, and missing bullet points
- **Length** — scores word count: ideal is 350–700 words (one page); too short or too long both lose points
- **Quantification** — regex hunts for numbers with impact context: percentages, dollar amounts, user counts, multipliers

---

### 3. LLM Evaluation with Retry + Fallback

**File:** `backend/services/llm_evaluator.py`

```python
PRIMARY_MODEL  = "llama-3.3-70b-versatile"
FALLBACK_MODEL = "llama-3.1-8b-instant"
MAX_RETRIES    = 3

def _call_llm(prompt: str, max_tokens: int = 1500) -> str:
    models_to_try = [PRIMARY_MODEL, FALLBACK_MODEL]
    for model_name in models_to_try:
        for attempt in range(MAX_RETRIES):
            try:
                response = client.chat.completions.create(
                    model=model_name,
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=max_tokens,
                    temperature=0.1,
                )
                return response.choices[0].message.content.strip()
            except Exception as e:
                time.sleep(RETRY_DELAY * (attempt + 1))
    raise RuntimeError("All LLM attempts failed")
```

**What this does:**
Calls the AI model to generate the deep qualitative analysis. Built for production reliability — it never crashes on a single API hiccup.

**How the retry + fallback logic works:**
1. First tries `llama-3.3-70b-versatile` — the most capable model, best quality answers
2. If it fails (rate limit, timeout, network error), it waits `1.5s × attempt` before retrying (exponential backoff)
3. After 3 failed attempts on the primary model, it *automatically switches* to `llama-3.1-8b-instant` — a smaller, faster model that's less likely to be rate-limited
4. If even the fallback exhausts all retries, the error is caught gracefully in the router and the response is returned without LLM data (other scores still work)

**Why `temperature=0.1`:**
Lower temperature = more deterministic, consistent JSON output. We want the model to return structured data, not creative prose.

---

### 4. Parallel Async AI Calls

**File:** `backend/routers/analyze.py`

```python
async def _run_llm():
    return await _run_sync(llm_master_evaluate, resume_raw, jd)

async def _run_exp():
    return await _run_sync(detect_experience, resume_raw, jd)

async def _run_sections():
    sections = await _run_sync(parse_sections, resume_raw)
    return await _run_sync(score_sections, sections)

llm_raw, exp_raw, section_raw = await asyncio.gather(
    _run_llm(), _run_exp(), _run_sections(),
    return_exceptions=True
)
```

**What this does:**
Runs three independent AI operations at the same time instead of sequentially.

**Why this matters for performance:**

Without parallelism:
```
LLM call (4s) → Experience detection (1s) → Section scoring (1s) = 6s total
```

With `asyncio.gather`:
```
LLM call  ─────────────────── 4s ─┐
Experience detection ── 1s ────────┤  = 4s total (saves 2s per request)
Section scoring ────── 1s ─────────┘
```

`return_exceptions=True` means if one task fails, the other two still complete — partial results are always better than a full failure.

---

### 5. Skill Gap Classification

**File:** `backend/services/skill_gap_analyzer.py`

```python
def classify_skill_gaps(missing_skills, jd_skills, jd_text):
    classification = {"critical": [], "important": [], "optional": []}
    jd_text = jd_text.lower()

    for skill in missing_skills:
        frequency = jd_text.count(skill)

        if frequency >= 2:
            classification["critical"].append(skill)
        elif frequency == 1:
            classification["important"].append(skill)
        else:
            classification["optional"].append(skill)

    return classification
```

**What this does:**
Takes the list of skills missing from your resume and ranks them by how urgently you need to add them.

**The ranking logic:**
- **Critical** — skill appears 2+ times in the JD. The employer is clearly emphasising it; not having it is likely a hard rejection
- **Important** — skill appears once. Mentioned but not stressed; worth adding if you have it
- **Optional** — skill is in the extracted JD skill list but not explicitly mentioned in the raw text. Nice to have

**Why frequency instead of ML:**
Counting frequency is a deliberate choice — it directly mirrors how ATS systems prioritise keywords, it's explainable to the user, and it requires zero extra model inference time.

---

### 6. Signal-to-Noise Analysis

**File:** `backend/services/signal_noise_analyzer.py`

```python
WEAK_PHRASES = [
    "responsible for", "worked on", "helped with",
    "involved in", "participated in", "good communication",
    "team player", "hard worker", "results-driven", ...
]

STRONG_VERBS = [
    "engineered", "architected", "built", "deployed",
    "optimized", "launched", "led", "reduced", "increased", ...
]

def analyze_signal_to_noise(text: str):
    weak   = [p for p in WEAK_PHRASES if p in text.lower()]
    strong = [v for v in STRONG_VERBS  if v in text.lower()]

    clarity_score = max(0, 100 - (len(weak) * 8) + (len(strong) * 3))
    return {
        "clarity_score":        min(clarity_score, 100),
        "weak_phrases_found":   weak,
        "strong_verbs_found":   strong,
        "buzzwords_found":      [b for b in BUZZWORDS if b in text.lower()],
        "quantified_sentences": count_quantified_sentences(text),
    }
```

**What this does:**
Measures whether your resume *shows* impact or just *describes* responsibilities.

**The problem it catches:**
"Responsible for managing a team of engineers" → *weak* (no result, no action)
"Led a team of 6 engineers, shipping 3 features per sprint" → *strong* (action + metric)

Recruiters spend ~6 seconds on first resume scan. Every weak phrase wastes one of those seconds. This analyzer surfaces exactly which phrases are dragging down your clarity score so you can fix them.

---

### 7. React Analysis Hook

**File:** `frontend/src/hooks/useAnalysis.js`

```javascript
export function useAnalysis() {
  const [data, setData]         = useState(null)
  const [loading, setLoading]   = useState(false)
  const [progress, setProgress] = useState(0)

  async function run(file, jobDescription) {
    setLoading(true)
    setProgress(0)

    // Fake step-by-step progress for UX
    const steps = [
      { pct: 20 }, { pct: 40 }, { pct: 65 }, { pct: 85 }, { pct: 95 }
    ]
    let i = 0
    const interval = setInterval(() => {
      if (i < steps.length) setProgress(steps[i++].pct)
      else clearInterval(interval)
    }, 1200)

    try {
      const result = await analyzeResume(file, jobDescription)
      clearInterval(interval)
      setProgress(100)
      setTimeout(() => setData(result), 300)
    } catch (err) {
      setError(err.response?.data?.detail || 'Analysis failed.')
    } finally {
      setLoading(false)
    }
  }

  return { data, loading, error, progress, run, reset }
}
```

**What this does:**
Manages the entire frontend analysis lifecycle as a reusable React hook.

**Why the fake progress steps:**
The real API call takes 5–10 seconds. Showing a static spinner for 10 seconds loses users. The animated progress steps (using `setInterval`) create the *perception* of progress, which significantly improves perceived performance. When the real API call finishes, progress instantly jumps to 100% regardless of where the fake steps are.

**Why a custom hook instead of inline state:**
This separates data-fetching logic from UI rendering. `App.jsx` stays clean and just calls `run(file, jd)` — all the complexity is encapsulated here.

---

## 🔗 API Reference

All endpoints are documented interactively at [http://localhost:8000/docs](http://localhost:8000/docs) (Swagger UI) once the backend is running.

### `POST /api/v1/analyze`
The main endpoint. Accepts a resume file + job description, returns the full analysis.

**Request (multipart/form-data):**
| Field | Type | Description |
|---|---|---|
| `file` | File | Resume in PDF or DOCX format (max 5 MB) |
| `job_description` | string | The full job description text (min 30 chars) |

**Response (JSON):**
```json
{
  "semantic_match_score": 72.4,
  "ats_keyword_score": 65.0,
  "matching_skills": ["Python", "FastAPI", "Docker"],
  "missing_skills": ["Kubernetes", "Terraform"],
  "skill_gap_analysis": { "critical": ["Kubernetes"], "important": ["Terraform"], "optional": [] },
  "llm_evaluation": {
    "overall_score": 68,
    "experience_level": "mid",
    "interview_questions": ["Tell me about a time you optimised a slow API..."],
    "fit_verdict": "Strong candidate with minor skill gaps"
  },
  "ats_simulation": {
    "overall_ats_score": 74.2,
    "verdict": "Needs Improvement",
    "checks": { "keyword_density": { "score": 65, "note": "..." }, ... }
  },
  "processing_time_s": 6.4
}
```

### `POST /api/v1/ai-coach`
Generates improved bullet points and a 30-day skill roadmap.

### `POST /api/v1/jobs`
Returns live job listings matched to extracted skills.

**Request:**
```json
{ "skills": ["Python", "React", "Docker"], "location": "India" }
```

---

## 🧪 Running Tests

```bash
# Backend: syntax check all Python files
cd backend
python3 -m py_compile services/*.py routers/*.py models/*.py
echo "All files OK"

# Backend: start server and hit health check
uvicorn main:app --port 8000 &
curl http://localhost:8000/health

# Frontend: build check
cd frontend
npm run build
```

---

## 🐳 Docker Deployment

```bash
# Build and run everything
docker-compose up --build

# Run in background
docker-compose up -d --build

# Stop
docker-compose down
```

The `docker-compose.yml` starts:
- **Backend** on port `8000`
- **Frontend** (production build served by Nginx) on port `80`

---

## 🚀 Recent Upgrades

See [README.md](README.md#-recent-upgrades) for the full upgrade log with feature details.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes — keep commits focused and descriptive
4. Run the build checks (see Testing section above)
5. Open a pull request with a clear description of what changed and why

---

## 📄 License

MIT — see [LICENSE](LICENSE) for details.

---

## 👤 Author

Built by [Ayush Bhadani](https://github.com/Ayush0915)

---

<div align="center">
  <p>If this project helped you land an interview, give it a ⭐</p>
</div>
