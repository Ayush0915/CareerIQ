# 📌 CareerIQ — AI Resume Intelligence Platform

> **The ultimate bridge between your resume and your dream job.**
> CareerIQ is a professional-grade platform that leverages Large Language Models (LLMs) to provide deep resume analysis, skill gap detection, and personalized career coaching.

---

# 🚀 Overview

**CareerIQ** solves the "ATS Black Hole" problem. Most job seekers never hear back because their resumes aren't optimized for Applicant Tracking Systems (ATS). This project provides a transparent, AI-driven evaluation of how a resume matches a specific Job Description (JD).

### The Problem
- **Keyword Mismatch**: Missing critical technical skills mentioned in the JD.
- **Formatting Issues**: Resumes that look great to humans but are unreadable to parsers.
- **Weak Quantification**: Bullet points that lack measurable impact.

### The Solution: CareerIQ
- **Deep Analysis**: Uses sentence-level semantic similarity to score resumes.
- **Actionable Coaching**: Generates improved bullet points, cover letters, and roadmaps.
- **Live Job Matching**: connects users directly to relevant roles based on their true skill set.

---

# 🧠 Features

- **✅ Deep Resume Scoring**: Comprehensive ATS compatibility check with detailed scoring on keywords, formatting, and clarity.
- **🔍 Skill Gap Analysis**: Automatically identifies missing critical keywords and categorizes them by importance.
- **🤖 AI Career Coach**: 
  - **Bullet Rewriter**: Transforms weak phrases into high-impact, quantified achievements.
  - **Interview Prep**: Generates 5 technical and 3 behavioral questions tailored to the candidate.
  - **LinkedIn Summary**: Creates a punchy, keyword-optimized "About" section.
- **💼 Live Job Recommendations**: Fetches real-time job listings from the JSearch API based on detected skills.
- **📊 Premium Visualizations**: Interactive radar charts, skill gap bars, and animated score rings for a 10/10 UX.

---

# 🏗️ Tech Stack

### Frontend
- **React 18** + **Vite**: Ultra-fast development and optimized builds.
- **Tailwind CSS**: Modern styling with custom glassmorphism effects.
- **Framer Motion**: Smooth micro-animations and transitions.
- **Recharts**: Data visualization for scoring and skill gaps.

### Backend
- **FastAPI (Python)**: High-performance, asynchronous REST API.
- **Groq (Llama 3.3/3.1)**: State-of-the-art LLMs for nearly-instant AI coaching.
- **Sentence-Transformers**: `all-MiniLM-L6-v2` for semantic matching.
- **PDFPlumber & Python-Docx**: Robust multi-stage text extraction.

### Infrastructure & Tools
- **Docker & Docker Compose**: For seamless, one-command deployment.
- **RapidAPI (JSearch)**: Powering the live job recommendation engine.

---

# 📂 Project Structure

```bash
ai-resume-analyzer/
├── backend/                  
│   ├── main.py               # FastAPI entrypoint + Routing
│   ├── routers/              # API endpoint definitions (Analyze, Coach, Jobs)
│   ├── services/             # Core Logic (LLM, Similarity, Parsing)
│   │   ├── parser.py         # Multi-stage PDF/DOCX extraction
│   │   ├── ai_coach.py       # Prompt engineering for AI career advice
│   │   └── job_fetcher.py    # Live job API integration
│   ├── Dockerfile
│   └── requirements.txt      # Python dependencies
├── frontend/                 
│   ├── src/
│   │   ├── components/       # UI (Dashboard, Loading, SkillBadge)
│   │   ├── hooks/            # useAnalysis.js (State management)
│   │   └── services/         # api.js (Axios client)
│   ├── index.html
│   ├── Dockerfile
│   └── tailwind.config.js    # Design system tokens
└── docker-compose.yml        # Multi-container orchestration
```

---

# ⚙️ Setup & Installation Guide

### Prerequisites
- Python 3.10+
- Node.js 18+
- [Groq API Key](https://console.groq.com/) (Free)
- [RapidAPI Key](https://rapidapi.com/) (For JSearch)

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/ai-resume-analyzer.git
cd ai-resume-analyzer
```

### 2. Environment Setup
Create a `.env` file in the root directory:
```env
GROQ_API_KEY=your_groq_key_here
RAPIDAPI_KEY=your_rapidapi_key_here
```

### 3. Option A: Run with Docker (Easiest)
```bash
docker-compose up --build
```
- Frontend: `http://localhost:5173`
- Backend Docs: `http://localhost:8000/docs`

### 4. Option B: Manual Setup
**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Or venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

---

# 🔑 Environment Variables

- `GROQ_API_KEY`: Required to power the AI Coaching features (Llama 3.3).
- `RAPIDAPI_KEY`: Required to fetch live job listings via the JSearch API.
- `VITE_API_URL`: (Frontend) Defaults to `http://localhost:8000/api/v1`.

---

# 💻 Code Explanation

### 1. Multi-Stage Resume Parsing (`parser.py`)
This function handles the critical task of turning a binary file (PDF/DOCX) into clean text for AI analysis.

```python
def parse_resume(file_path: str) -> dict:
    # 1. Validate size to prevent DOS
    validate_file_size(file_path)
    
    # 2. Extract based on extension
    if ext == "pdf":
        raw_text = extract_text_from_pdf(file_path) # Uses PDFPlumber with fallback
    elif ext == "docx":
        raw_text = extract_text_from_docx(file_path)
    
    # 3. Clean and Extract Metadata
    contact_info = extract_contact_info(raw_text) # Regex-based extraction
    cleaned = clean_text(raw_text) # Normalizes whitespace/chars
    
    return {"clean_text": cleaned, "contact_info": contact_info}
```
**Why this matters:**
- **Robustness**: It uses a multi-stage approach (PDFPlumber first, then PyPDF2 fallback) to handle complex multi-column resumes that usually break standard parsers.
- **Security**: Includes file size validation and isolated processing.

### 2. AI Bullet Rewriting (`ai_coach.py`)
This is the core of the "Career Coach" feature, using prompt engineering to transform weak resumes.

```python
def rewrite_bullets(weak_phrases, resume_text, job_description):
    prompt = f"""Rewrite 4 improved bullet points. Rules:
    - Start with strong past-tense action verbs
    - Include specific numbers (quantification)
    - Align to keywords: {job_description[:500]}
    """
    return client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}]
    )
```
**How it works:**
1.  **Context Injection**: We feed both the resume text AND the Target JD into the LLM.
2.  **Constraint Enforcement**: The prompt mandates specific components (numbers, action verbs) to ensure high-quality output.
3.  **Speed**: Using the Groq inference engine, this generates responses in <500ms.

---
*Created by [Your Name/Handle]*
