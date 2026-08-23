"""Generative coaching features.

All calls go through :mod:`core.llm`, so they are async (no thread-per-socket),
share one client, and inherit model fallback.  Course recommendations use a
schema-constrained call rather than regex-scraping a JSON array out of prose.
"""
from __future__ import annotations

import logging

from core import llm
from core.redact import redact_for_prompt
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

UNAVAILABLE = "Could not generate this right now. Check the API key in backend/.env and try again."


async def _safe_text(prompt: str, *, max_tokens: int) -> str:
    """Run a text completion, degrading to a readable message on failure.

    Never surfaces the raw exception: the previous implementation returned
    "[Could not generate — {e}]" straight into the UI, leaking provider
    internals to the user.
    """
    try:
        return await llm.complete_text(prompt, max_tokens=max_tokens)
    except llm.LLMError as exc:
        logger.error("Coaching generation failed: %s", exc)
        return UNAVAILABLE


# ── Bullet rewriting ──────────────────────────────────────────────────────────

async def rewrite_bullets(weak_phrases: list[str], resume_text: str, job_description: str) -> str:
    if not weak_phrases:
        return "No weak phrases detected — your bullet points already use strong action language."

    prompt = f"""You are an elite resume coach who has helped thousands of candidates land engineering roles.

WEAK PHRASES found in the resume: {", ".join(weak_phrases[:8])}

TARGET JOB DESCRIPTION:
{job_description[:600]}

RESUME EXCERPT (for context):
{redact_for_prompt(resume_text)[:900]}

Rewrite exactly 4 improved bullet points. Rules:
- Start each with a strong past-tense action verb (Engineered, Architected, Spearheaded, Optimized)
- Include specific numbers, percentages or impact wherever the source supports it
- Do not invent metrics that are not implied by the resume excerpt
- Align language to the job description keywords
- Each bullet at most 20 words

Format:
• [Rewritten bullet 1]
• [Rewritten bullet 2]
• [Rewritten bullet 3]
• [Rewritten bullet 4]

Then one line: **Key change:** [what made these stronger]"""

    return await _safe_text(prompt, max_tokens=450)


# ── Cover letter ──────────────────────────────────────────────────────────────

async def generate_cover_letter(
    matching_skills: list[str],
    missing_skills: list[str],
    job_description: str,
    resume_text: str,
) -> str:
    prompt = f"""You are an executive recruiter writing a cover letter for a strong candidate.

Matching skills: {", ".join(matching_skills[:10])}
Skill gaps to address honestly: {", ".join(missing_skills[:5]) if missing_skills else "none significant"}

JOB DESCRIPTION:
{job_description[:700]}

RESUME CONTEXT:
{redact_for_prompt(resume_text)[:600]}

Write a 3-paragraph cover letter. Rules:
- Paragraph 1 (2-3 sentences): hook naming the specific role and the most relevant achievement
- Paragraph 2 (3-4 sentences): two technical contributions with measurable impact
- Paragraph 3 (2 sentences): forward-looking close with a clear call to action
- Tone: confident, direct, human — not generic
- Never use: "I am writing to", "passionate about", "team player", "hard worker"
- At most 200 words
- Address any skill gap briefly in paragraph 2 as "actively building X"
- Use [Hiring Manager] as the salutation placeholder"""

    return await _safe_text(prompt, max_tokens=450)


# ── Skill roadmap ─────────────────────────────────────────────────────────────

async def generate_skill_roadmap(missing_skills: list[str], job_description: str) -> str:
    if not missing_skills:
        return (
            "You already match the critical skills for this role. Focus on deepening "
            "your expertise and building portfolio projects that demonstrate it."
        )

    prompt = f"""You are a senior engineering mentor building a focused learning plan.

Skills to acquire: {", ".join(missing_skills[:6])}
Target role context: {job_description[:500]}

Create a 30-day sprint roadmap in exactly this format:

**Week 1 — Foundation: [Skill]**
Goal: [one-line goal]
Resource: [type of resource and what to search for — do not invent URLs]
Daily action: [15-30 min daily task]

**Week 2 — Application: [Skill]**
Goal: [one-line goal]
Resource: [type of resource and what to search for]
Daily action: [task]

**Week 3 — Advanced: [Skill]**
Goal: [one-line goal]
Resource: [type of resource and what to search for]
Daily action: [task]

**Week 4 — Portfolio Project**
Build: [specific mini-project using all the skills above]
Outcome: [what to add to the resume afterwards]

Keep each section under 40 words. Name real tools. Never fabricate a URL."""

    return await _safe_text(prompt, max_tokens=500)


# ── Interview prep ────────────────────────────────────────────────────────────

async def generate_interview_prep(
    matching_skills: list[str],
    missing_skills: list[str],
    job_description: str,
    experience_level: str = "mid",
) -> str:
    prompt = f"""You are a technical interview coach.

Candidate level: {experience_level}
Their strong skills: {", ".join(matching_skills[:8])}
Their weak areas: {", ".join(missing_skills[:5])}

JOB DESCRIPTION:
{job_description[:600]}

Generate an interview prep guide:

**5 Likely Technical Questions** (with what each is testing):
1. [Question] — Tests: [concept]
2. [Question] — Tests: [concept]
3. [Question] — Tests: [concept]
4. [Question] — Tests: [concept]
5. [Question] — Tests: [concept]

**3 Behavioral Questions** (STAR method):
1. [Question]
2. [Question]
3. [Question]

**Red Flag to Prepare For:**
[The gap the interviewer is most likely to probe]

**One-Line Prep Tip:**
[The single most impactful thing to review beforehand]"""

    return await _safe_text(prompt, max_tokens=600)


# ── LinkedIn summary ──────────────────────────────────────────────────────────

async def generate_linkedin_summary(
    matching_skills: list[str],
    resume_text: str,
    job_description: str,
) -> str:
    prompt = f"""You are a LinkedIn profile optimization expert.

Skills: {", ".join(matching_skills[:12])}
Target role context: {job_description[:400]}
Resume excerpt: {redact_for_prompt(resume_text)[:700]}

Write a LinkedIn About section. Rules:
- 3 short paragraphs, at most 220 words total
- Open with a bold statement about what this person builds or solves
- Paragraph 2: two or three technical achievements with numbers drawn from the resume
- Paragraph 3: what they are looking for next, plus an invitation to connect
- End with 5-7 keyword-rich skill tags on a new line, each prefixed with #
- Professional but human, first person
- Do not start with "I am a" and do not lead with a job title"""

    return await _safe_text(prompt, max_tokens=400)


# ── Dispatcher ────────────────────────────────────────────────────────────────

# One call per requested mode, generated on demand.  The previous design fired
# all five concurrently on every visit to the tab, which on the free tier burns
# five of roughly twenty requests per minute for output the user may not read.
COACHING_MODES = ("bullets", "cover_letter", "roadmap", "interview", "linkedin")

MODE_LABELS = {
    "bullets": "Improved bullet points",
    "cover_letter": "Cover letter",
    "roadmap": "30-day skill roadmap",
    "interview": "Interview prep",
    "linkedin": "LinkedIn summary",
}


async def generate_one(
    mode: str,
    *,
    weak_phrases: list[str] | None = None,
    matching_skills: list[str] | None = None,
    missing_skills: list[str] | None = None,
    job_description: str = "",
    resume_text: str = "",
    experience_level: str = "mid",
) -> str:
    """Generate exactly one coaching artefact."""
    weak = weak_phrases or []
    matching = matching_skills or []
    missing = missing_skills or []

    if mode == "bullets":
        return await rewrite_bullets(weak, resume_text, job_description)
    if mode == "cover_letter":
        return await generate_cover_letter(matching, missing, job_description, resume_text)
    if mode == "roadmap":
        return await generate_skill_roadmap(missing, job_description)
    if mode == "interview":
        return await generate_interview_prep(matching, missing, job_description, experience_level)
    if mode == "linkedin":
        return await generate_linkedin_summary(matching, resume_text, job_description)

    raise ValueError(f"Unknown coaching mode {mode!r}; expected one of {COACHING_MODES}")


# ── Course recommendations ────────────────────────────────────────────────────

class CourseRecommendation(BaseModel):
    """One learning resource.

    Note the absence of a free-text URL field: asking a model for course links
    produced confident, fabricated URLs.  The model supplies a search query and
    the platform, and the client builds a real search link from them.
    """

    skill: str = Field(description="Lowercase skill this resource addresses")
    title: str = Field(description="Course or tutorial title")
    platform: str = Field(description="Coursera, Udemy, freeCodeCamp, YouTube, or Official Docs")
    provider: str = Field(description="Instructor, university or publisher")
    level: str = Field(description="beginner, intermediate or advanced")
    hours: int = Field(description="Estimated hours to complete")
    search_query: str = Field(description="Search terms that find this resource on the platform")
    desc: str = Field(description="Two sentences on why this closes this candidate's gap")
    priority: str = Field(description="critical, important or optional")
    match_score: int = Field(description="Relevance to the target job, 75-98")


class CourseRecommendations(BaseModel):
    courses: list[CourseRecommendation]


_PLATFORM_SEARCH = {
    "coursera": "https://www.coursera.org/search?query=",
    "udemy": "https://www.udemy.com/courses/search/?q=",
    "freecodecamp": "https://www.youtube.com/results?search_query=freecodecamp+",
    "youtube": "https://www.youtube.com/results?search_query=",
    "official docs": "https://duckduckgo.com/?q=documentation+",
}

_PALETTES = [
    ["#3b82f6", "#1d4ed8"], ["#059669", "#047857"], ["#7c3aed", "#6d28d9"],
    ["#f59e0b", "#d97706"], ["#0891b2", "#0e7490"], ["#dc2626", "#b91c1c"],
]
_EMOJIS = ["🐍", "🐳", "⚡", "☁️", "⚛️", "🗄️", "🧠", "🔄", "🦜", "🎓"]


def _search_url(platform: str, query: str) -> str:
    from urllib.parse import quote_plus

    base = _PLATFORM_SEARCH.get(platform.strip().lower(), _PLATFORM_SEARCH["coursera"])
    return base + quote_plus(query)


def _to_ui_shape(items: list[CourseRecommendation]) -> list[dict]:
    """Adapt to the shape the existing frontend card expects."""
    out = []
    for index, course in enumerate(items):
        out.append({
            "id": f"rec_{index + 1}",
            "skill": course.skill.lower(),
            "title": course.title,
            "platform": course.platform,
            "provider": course.provider,
            "level": course.level.lower(),
            "hours": course.hours,
            "free": course.platform.strip().lower() in {"freecodecamp", "youtube", "official docs"},
            "price": "",
            "cert": course.platform.strip().lower() in {"coursera", "udemy"},
            "url": _search_url(course.platform, course.search_query),
            "emoji": _EMOJIS[index % len(_EMOJIS)],
            "color": _PALETTES[index % len(_PALETTES)],
            "desc": course.desc,
            "priority": course.priority.lower(),
            "mScore": course.match_score,
        })
    return out


def _fallback_course_recommendations(skill_gap_analysis: dict) -> list[dict]:
    """Deterministic recommendations when the LLM is unavailable.

    Builds real search URLs rather than inventing course links.
    """
    gaps = []
    for priority in ("critical", "important", "optional"):
        for skill in (skill_gap_analysis.get(priority) or [])[:4]:
            gaps.append((priority, skill))

    items = []
    for priority, skill in gaps[:8]:
        clean = skill.strip().lower()
        items.append(CourseRecommendation(
            skill=clean,
            title=f"Complete {skill.capitalize()} Course",
            platform="Coursera",
            provider="University & industry instructors",
            level="intermediate",
            hours=20,
            search_query=clean,
            desc=f"Structured coverage of {skill} with hands-on projects matching the job requirements.",
            priority=priority,
            match_score=92 if priority == "critical" else 85,
        ))
        items.append(CourseRecommendation(
            skill=clean,
            title=f"{skill.capitalize()} Crash Course",
            platform="freeCodeCamp",
            provider="freeCodeCamp",
            level="beginner",
            hours=6,
            search_query=clean,
            desc=f"Fast, free introduction to {skill} through real project tutorials.",
            priority=priority,
            match_score=88 if priority == "critical" else 80,
        ))
    return _to_ui_shape(items)


async def generate_course_recommendations(
    skill_gap_analysis: dict | None,
    job_description: str = "",
    resume_text: str = "",
) -> list[dict]:
    """Two learning resources per skill gap, personalized to the target role."""
    gaps = skill_gap_analysis if isinstance(skill_gap_analysis, dict) else {}
    critical = gaps.get("critical") or []
    important = gaps.get("important") or []
    optional = gaps.get("optional") or []

    targets = (critical + important) or optional[:3]
    if not targets:
        return []

    if not llm.is_configured():
        return _fallback_course_recommendations(gaps)

    context = [f"- {s} (critical gap)" for s in critical[:5]]
    context += [f"- {s} (important gap)" for s in important[:5]]
    if not context:
        context = [f"- {s} (optional gap)" for s in optional[:3]]

    prompt = f"""You are a technical curriculum director advising one candidate.

TARGET JOB DESCRIPTION:
{job_description[:800] or "Software engineering role"}

CANDIDATE RESUME SUMMARY:
{redact_for_prompt(resume_text)[:800] or "Technical candidate seeking to upskill"}

SKILL GAPS TO ADDRESS:
{chr(10).join(context)}

For each gap, recommend exactly 2 learning resources that genuinely exist.
Supply a `search_query` that would find the resource on its platform —
never a URL, because a fabricated link is worse than no link.
Make each `desc` specific to this candidate's background and target role."""

    try:
        result = await llm.complete_json(
            prompt,
            CourseRecommendations,
            max_tokens=2000,
            temperature=0.3,
            models=None,
            schema_name="course_recommendations",
        )
    except llm.LLMError as exc:
        logger.error("Course recommendations failed, using fallback: %s", exc)
        return _fallback_course_recommendations(gaps)

    if not result.courses:
        return _fallback_course_recommendations(gaps)
    return _to_ui_shape(result.courses)
