<div align="center">

<h1>🎯 CareerIQ</h1>

<p><strong>AI-powered resume intelligence that gets you past the ATS and into the interview room.</strong></p>

[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![Groq](https://img.shields.io/badge/Groq-Llama%203.3-F54E00?style=flat-square)](https://groq.com)
[![Docker](https://img.shields.io/badge/Docker-ready-2496ED?style=flat-square&logo=docker&logoColor=white)](https://docker.com)
[![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](LICENSE)

</div>

---

## The Problem

Over **75% of resumes** are rejected by Applicant Tracking Systems before a human ever reads them — not because the candidate is unqualified, but because of keyword mismatches, formatting issues, and weak impact statements. CareerIQ fixes this with transparent, AI-driven feedback.

---

## What CareerIQ Does

CareerIQ takes your resume and a target job description, then delivers:

- **ATS Compatibility Score** — See exactly how your resume ranks across keywords, formatting, and clarity
- **Skill Gap Analysis** — Pinpoints missing keywords, ranked by how critical they are to the role
- **AI Career Coach** — Three tools powered by Llama 3.3:
  - *Bullet Rewriter*: Turns vague phrases into quantified, action-verb-led achievements
  - *Interview Prep*: Generates 5 technical + 3 behavioral questions tailored to you
  - *LinkedIn Summary*: Writes a keyword-optimized "About" section
- **Live Job Recommendations** — Real-time listings via JSearch API matched to your actual skills
- **Rich Visualizations** — Animated score rings, radar charts, and skill gap bars

---

## Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, Framer Motion, Recharts |
| **Backend** | FastAPI (Python 3.10+), Groq (Llama 3.3-70b), Sentence-Transformers |
| **Parsing** | PDFPlumber (primary), PyPDF2 (fallback), Python-Docx |
| **Infrastructure** | Docker, Docker Compose |
| **External APIs** | Groq API (free), RapidAPI JSearch |

**Semantic model**: `all-MiniLM-L6-v2` — measures meaning, not just keyword presence.  
**Inference engine**: Groq — delivers AI coaching responses in under 500ms.

---

## Project Structure

```
CareerIQ/
├── backend/
│   ├── main.py                   # FastAPI entrypoint & routing
│   ├── routers/
│   │   ├── analyze.py            # Resume scoring endpoints
│   │   ├── coach.py              # AI coaching endpoints
│   │   └── jobs.py               # Live job recommendation endpoints
│   ├── services/
│   │   ├── parser.py             # Multi-stage PDF/DOCX text extraction
│   │   ├── ai_coach.py           # LLM prompt engineering & coaching logic
│   │   └── job_fetcher.py        # JSearch API integration
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/           # Dashboard, SkillBadge, Loading, etc.
│   │   ├── hooks/
│   │   │   └── useAnalysis.js    # Global state management
│   │   └── services/
│   │       └── api.js            # Axios API client
│   ├── index.html
│   ├── Dockerfile
│   └── tailwind.config.js
├── docker-compose.yml
└── .env                          # API keys (not committed)
```

---

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- [Groq API Key](https://console.groq.com/) — free, no credit card required
- [RapidAPI Key](https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch) — for live job listings

### 1. Clone

```bash
git clone https://github.com/Ayush0915/CareerIQ.git
cd CareerIQ
```

### 2. Configure environment

Create a `.env` file in the project root:

```env
GROQ_API_KEY=your_groq_key_here
RAPIDAPI_KEY=your_rapidapi_key_here
```

### 3a. Run with Docker (recommended)

```bash
docker-compose up --build
```

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/docs |

### 3b. Run manually

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**Frontend** (in a separate terminal):
```bash
cd frontend
npm install
npm run dev
```

---

## How It Works

### Resume Parsing (`services/parser.py`)

Reliable text extraction is the foundation of accurate analysis. The parser uses a multi-stage approach to handle the wide variety of resume formats in the wild:

```python
def parse_resume(file_path: str) -> dict:
    validate_file_size(file_path)           # Block oversized files (DOS prevention)

    if ext == "pdf":
        raw_text = extract_text_from_pdf(file_path)   # PDFPlumber → PyPDF2 fallback
    elif ext == "docx":
        raw_text = extract_text_from_docx(file_path)

    contact_info = extract_contact_info(raw_text)     # Regex-based metadata extraction
    cleaned = clean_text(raw_text)                    # Normalize whitespace & encoding

    return {"clean_text": cleaned, "contact_info": contact_info}
```

**Why multi-stage?** PDFPlumber handles most resumes well, but multi-column layouts and scanned documents can break it. The PyPDF2 fallback recovers text in cases that would otherwise silently fail and return an empty analysis.

---

### Semantic Scoring

CareerIQ doesn't just count keyword matches. It uses `sentence-transformers/all-MiniLM-L6-v2` to compute **cosine similarity** between resume sentences and job description requirements. This means a resume mentioning "built and shipped REST APIs" will still match a JD asking for "API development experience" — even with zero word overlap.

---

### AI Coaching (`services/ai_coach.py`)

Each coaching feature uses a structured prompt that enforces output quality through explicit constraints:

```python
def rewrite_bullets(weak_phrases: list, resume_text: str, job_description: str) -> str:
    prompt = f"""You are an expert resume coach. Rewrite the following into 4 improved bullet points.

Rules:
- Start each bullet with a strong past-tense action verb (Led, Built, Reduced, Increased...)
- Include at least one specific metric or quantified outcome per bullet
- Align language to these target keywords: {job_description[:500]}
- Do not use filler phrases like "responsible for" or "helped with"

Weak phrases to improve:
{weak_phrases}

Resume context:
{resume_text[:1000]}
"""
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}]
    )
    return response.choices[0].message.content
```

**Design decisions:**
- **Context injection**: Both the resume and job description are fed in so the rewrite is grounded in the candidate's actual experience — not hallucinated.
- **Constraint-based prompting**: Explicit rules ("do not use filler phrases") consistently outperform soft guidance ("make it better") for structured output tasks.
- **Groq inference**: The same prompt on OpenAI's API takes 3–8 seconds. Groq's hardware delivers it in under 500ms, which matters for UX.

---

## API Reference

The full interactive API reference is available at `http://localhost:8000/docs` when running locally.

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/analyze` | Upload resume + JD, returns full scoring |
| `POST` | `/api/v1/coach/bullets` | Rewrite weak bullet points |
| `POST` | `/api/v1/coach/interview` | Generate interview questions |
| `POST` | `/api/v1/coach/linkedin` | Generate LinkedIn summary |
| `GET` | `/api/v1/jobs` | Fetch live job recommendations |

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GROQ_API_KEY` | Yes | Powers all AI coaching features (Llama 3.3) |
| `RAPIDAPI_KEY` | Yes | Fetches live job listings via JSearch |
| `VITE_API_URL` | No | Frontend API base URL. Defaults to `http://localhost:8000/api/v1` |

---

## Contributing

Contributions are welcome. Please open an issue before submitting a pull request for significant changes.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add your feature'`
4. Push and open a pull request

---

## License

MIT — see [LICENSE](LICENSE) for details.

---

<div align="center">
<p>Built by <a href="https://github.com/Ayush0915">Ayush0915</a></p>
</div>
