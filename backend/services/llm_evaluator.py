import os
import json
import time
import re
from groq import Groq

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

# Best model for quality; falls back to fast model on quota/timeout
PRIMARY_MODEL   = "llama-3.3-70b-versatile"
FALLBACK_MODEL  = "llama-3.1-8b-instant"
MAX_RETRIES     = 3
RETRY_DELAY     = 1.5   # seconds


def _call_llm(prompt: str, max_tokens: int = 1500, model: str = None) -> str:
    """Single LLM call with retry + model fallback."""
    models_to_try = [model or PRIMARY_MODEL, FALLBACK_MODEL]
    last_err = None

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
                last_err = e
                if attempt < MAX_RETRIES - 1:
                    time.sleep(RETRY_DELAY * (attempt + 1))
        # If primary model exhausted, fall through to fallback
    raise RuntimeError(f"All LLM attempts failed: {last_err}")


def _safe_json(raw: str) -> dict:
    """Strip markdown fences, extract first JSON object, parse safely."""
    raw = raw.strip()
    raw = re.sub(r"^```(?:json)?\s*", "", raw)
    raw = re.sub(r"\s*```$", "", raw)
    # find first { ... } block
    match = re.search(r"\{.*\}", raw, re.DOTALL)
    if match:
        raw = match.group(0)
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return {}


def llm_master_evaluate(resume_text: str, job_description: str) -> dict:
    """
    Full resume vs JD evaluation.
    Sends up to 3500 chars of resume + 1200 chars of JD for thorough analysis.
    """
    resume_excerpt = resume_text[:3500]
    jd_excerpt     = job_description[:1200]

    prompt = f"""You are a senior ATS engineer and executive resume coach with 15 years of experience.

Deeply analyze the RESUME against the JOB DESCRIPTION. Be strict, specific, and actionable.

RESUME:
{resume_excerpt}

JOB DESCRIPTION:
{jd_excerpt}

Return ONLY a single valid JSON object — no prose, no markdown fences. Use this exact structure:
{{
  "overall_score": <integer 0-100 reflecting true fit>,
  "experience_level": "<junior|mid|senior|staff>",
  "years_detected": "<e.g. 3 years>",
  "section_scores": {{
    "experience": <0-100>,
    "skills": <0-100>,
    "education": <0-100>,
    "projects": <0-100>,
    "summary": <0-100>
  }},
  "keyword_analysis": {{
    "present": ["up to 12 keywords that appear in both"],
    "missing_critical": ["keywords explicitly required in JD but absent in resume"],
    "missing_recommended": ["keywords that would strengthen the application"]
  }},
  "grammar_issues": ["specific issue or empty list if none"],
  "cliches_found": ["exact cliche phrase found, or empty list"],
  "readability_score": <0-100>,
  "passive_voice_count": <integer>,
  "quantified_achievements": <integer count of bullet points with numbers>,
  "section_feedback": {{
    "experience": "<2 sentence specific feedback>",
    "skills": "<2 sentence specific feedback>",
    "projects": "<2 sentence specific feedback>",
    "summary": "<2 sentence specific feedback>"
  }},
  "top_improvements": [
    "<actionable improvement 1 — be specific, mention the resume section>",
    "<actionable improvement 2>",
    "<actionable improvement 3>",
    "<actionable improvement 4>",
    "<actionable improvement 5>"
  ],
  "ats_compatibility": <0-100>,
  "job_match_reasoning": "<3 sentence honest assessment of fit — strengths and gaps>",
  "interview_questions": [
    "<likely interview question 1 based on JD>",
    "<likely interview question 2>",
    "<likely interview question 3>",
    "<likely interview question 4>",
    "<likely interview question 5>"
  ],
  "resume_strengths": [
    "<specific strength 1 from the resume>",
    "<specific strength 2>",
    "<specific strength 3>"
  ],
  "salary_insight": "<brief salary range insight for this role and experience level>",
  "competition_level": "<low|medium|high|very high — estimate based on JD requirements>",
  "fit_verdict": "<not_a_fit|stretch|good_fit|strong_fit>"
}}"""

    raw = _call_llm(prompt, max_tokens=1800)
    result = _safe_json(raw)

    if not result or "overall_score" not in result:
        return _fallback_evaluation()

    # Ensure all required keys exist with safe defaults
    result.setdefault("interview_questions", [])
    result.setdefault("resume_strengths",    [])
    result.setdefault("salary_insight",      "")
    result.setdefault("competition_level",   "medium")
    result.setdefault("fit_verdict",         "good_fit")

    return result


def llm_section_deep_dive(resume_text: str, section: str, job_description: str) -> dict:
    """
    Get deep, section-specific rewrite suggestions.
    section: "experience" | "summary" | "skills" | "projects"
    """
    prompt = f"""You are an expert resume coach. The candidate wants to dramatically improve their {section} section.

JOB DESCRIPTION (target role):
{job_description[:800]}

CANDIDATE'S CURRENT {section.upper()} SECTION:
{resume_text[:2000]}

Return ONLY a JSON object:
{{
  "score": <0-100 current quality>,
  "issues": ["issue1", "issue2", "issue3"],
  "rewritten_version": "<fully rewritten version of this section, ATS-optimised and JD-aligned>",
  "key_changes": ["change 1", "change 2", "change 3"],
  "power_words_added": ["word1", "word2", "word3"]
}}"""

    raw = _call_llm(prompt, max_tokens=800)
    result = _safe_json(raw)
    return result if result else {"score": 0, "issues": [], "rewritten_version": "", "key_changes": [], "power_words_added": []}


def _fallback_evaluation() -> dict:
    return {
        "overall_score": 0,
        "experience_level": "unknown",
        "years_detected": "unknown",
        "section_scores":     {"experience": 0, "skills": 0, "education": 0, "projects": 0, "summary": 0},
        "keyword_analysis":   {"present": [], "missing_critical": [], "missing_recommended": []},
        "grammar_issues":     [],
        "cliches_found":      [],
        "readability_score":  0,
        "passive_voice_count": 0,
        "quantified_achievements": 0,
        "section_feedback":   {"experience": "Unable to evaluate", "skills": "Unable to evaluate",
                               "projects": "Unable to evaluate", "summary": "Unable to evaluate"},
        "top_improvements":   ["LLM evaluation failed — check GROQ_API_KEY and model availability"],
        "ats_compatibility":  0,
        "job_match_reasoning": "Evaluation failed.",
        "interview_questions": [],
        "resume_strengths":   [],
        "salary_insight":     "",
        "competition_level":  "unknown",
        "fit_verdict":        "unknown",
    }
