import os
import asyncio
from groq import Groq

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
MODEL = "llama-3.3-70b-versatile"
FAST_MODEL = "llama-3.1-8b-instant"


def _call(prompt: str, max_tokens: int = 500, fast: bool = False) -> str:
    """Synchronous LLM call with fallback."""
    import time
    model = FAST_MODEL if fast else MODEL
    for attempt in range(3):
        try:
            resp = client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=max_tokens,
                temperature=0.3,
            )
            return resp.choices[0].message.content.strip()
        except Exception as e:
            if attempt < 2:
                time.sleep(1.5 * (attempt + 1))
    # Final fallback to fast model
    try:
        resp = client.chat.completions.create(
            model=FAST_MODEL,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=max_tokens,
            temperature=0.3,
        )
        return resp.choices[0].message.content.strip()
    except Exception as e:
        return f"[Could not generate — {e}]"


def rewrite_bullets(weak_phrases: list, resume_text: str, job_description: str) -> str:
    if not weak_phrases:
        return "No weak phrases detected — your bullet points already use strong action language."

    prompt = f"""You are an elite resume coach who has helped 10,000+ candidates land jobs at FAANG and top startups.

WEAK PHRASES found in the resume: {", ".join(weak_phrases[:8])}

TARGET JOB DESCRIPTION:
{job_description[:600]}

RESUME EXCERPT (for context):
{resume_text[:900]}

Rewrite exactly 4 improved bullet points. Rules:
- Start each with a strong past-tense action verb (Engineered, Architected, Spearheaded, Optimized...)
- Include specific numbers, percentages, or impact wherever possible
- Align language directly to the job description keywords
- Remove filler words and passive constructions
- Each bullet max 20 words

Format:
• [Rewritten bullet 1]
• [Rewritten bullet 2]
• [Rewritten bullet 3]
• [Rewritten bullet 4]

Then add one line: **Key change:** [what made these stronger]"""

    return _call(prompt, max_tokens=450)


def generate_cover_letter(
    matching_skills: list,
    missing_skills: list,
    job_description: str,
    resume_text: str,
) -> str:
    skills_str     = ", ".join(matching_skills[:10])
    gaps_str       = ", ".join(missing_skills[:5]) if missing_skills else "none significant"

    prompt = f"""You are an executive recruiter writing a cover letter for a top candidate.

Matching skills: {skills_str}
Skill gaps to address honestly: {gaps_str}

JOB DESCRIPTION:
{job_description[:700]}

RESUME CONTEXT:
{resume_text[:600]}

Write a 3-paragraph cover letter. Rules:
- Paragraph 1 (2-3 sentences): Powerful hook mentioning the specific role + your most relevant achievement
- Paragraph 2 (3-4 sentences): Highlight 2 specific technical contributions with measurable impact
- Paragraph 3 (2 sentences): Forward-looking close with clear call to action
- Tone: confident, direct, human — NOT generic
- Do NOT use: "I am writing to...", "passionate about", "team player", "hard worker"
- Max 200 words
- Address any skill gap briefly in paragraph 2 as "actively building X"
- Use [Hiring Manager] as salutation placeholder"""

    return _call(prompt, max_tokens=450)


def generate_skill_roadmap(missing_skills: list, job_description: str) -> str:
    if not missing_skills:
        return "You already match all critical skills for this role. Focus on deepening your expertise and building portfolio projects to stand out."

    top_gaps = missing_skills[:6]
    prompt = f"""You are a senior engineering mentor building a laser-focused learning plan.

Skills to acquire: {", ".join(top_gaps)}
Target role context: {job_description[:500]}

Create a 30-day sprint roadmap. Use this exact format:

**Week 1 — Foundation: [Skill]**
Goal: [one-line goal]
Resource: [specific free resource with URL if known]
Daily action: [15-30 min daily task]

**Week 2 — Application: [Skill]**
Goal: [one-line goal]
Resource: [specific free resource]
Daily action: [task]

**Week 3 — Advanced: [Skill]**
Goal: [one-line goal]
Resource: [specific free resource]
Daily action: [task]

**Week 4 — Portfolio Project**
Build: [specific mini-project that uses ALL skills above]
Outcome: [what to add to your resume after completion]

Keep each section under 40 words. Be specific — mention real tools, real resources."""

    return _call(prompt, max_tokens=500)


def generate_interview_prep(
    matching_skills: list,
    missing_skills: list,
    job_description: str,
    experience_level: str = "mid",
) -> str:
    prompt = f"""You are a technical interview coach at a top-tier company.

Candidate level: {experience_level}
Their strong skills: {", ".join(matching_skills[:8])}
Their weak areas: {", ".join(missing_skills[:5])}

JOB DESCRIPTION:
{job_description[:600]}

Generate an interview prep guide. Include:

**5 Likely Technical Questions** (with brief hint on what they're testing):
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
[The most likely gap the interviewer will probe given the skill gaps]

**One-Line Prep Tip:**
[The single most impactful thing to review before the interview]"""

    return _call(prompt, max_tokens=600)


def generate_linkedin_summary(
    matching_skills: list,
    resume_text: str,
    job_description: str,
) -> str:
    prompt = f"""You are a LinkedIn profile optimization expert.

Skills: {", ".join(matching_skills[:12])}
Target role context: {job_description[:400]}
Resume excerpt: {resume_text[:700]}

Write a LinkedIn About section (summary). Rules:
- 3 short paragraphs, max 220 words total
- Start with a hook — a bold statement about what you build or solve
- Paragraph 2: Top 2-3 technical achievements with numbers
- Paragraph 3: What you're looking for next + call to connect
- End with 5-7 keyword-rich skill tags on a new line prefixed with #
- Tone: professional but human, first-person
- Do NOT start with "I am a..." or list your job title as the first thing"""

    return _call(prompt, max_tokens=400)


def _fallback_course_recommendations(skill_gap_analysis: dict) -> list:
    """Fallback generator for course recommendations when LLM output is unavailable or unparseable."""
    critical  = skill_gap_analysis.get("critical", [])  or []
    important = skill_gap_analysis.get("important", []) or []
    optional  = skill_gap_analysis.get("optional", [])  or []

    COLOR_PALETTES = [
        ["#3b82f6", "#1d4ed8"],
        ["#059669", "#047857"],
        ["#7c3aed", "#6d28d9"],
        ["#f59e0b", "#d97706"],
        ["#0891b2", "#0e7490"],
        ["#dc2626", "#b91c1c"]
    ]
    EMOJIS = ["🐍", "🐳", "⚡", "☁️", "⚛️", "🗄️", "🧠", "🔄", "🦜", "🎓"]

    res = []
    idx = 1
    for prio, skills in [("critical", critical), ("important", important), ("optional", optional)]:
        for s in skills:
            skill_clean = s.strip().lower()
            c_color = COLOR_PALETTES[(idx - 1) % len(COLOR_PALETTES)]
            c_emoji = EMOJIS[(idx - 1) % len(EMOJIS)]

            # Course 1: Comprehensive Course
            res.append({
                "id": f"rec_{idx}_1",
                "skill": skill_clean,
                "title": f"Complete {s.capitalize()} Masterclass: Zero to Production",
                "platform": "Coursera",
                "provider": "University & Industry Experts",
                "level": "intermediate",
                "hours": 20,
                "rating": 4.8,
                "students": "150k+",
                "free": True,
                "price": "",
                "cert": True,
                "url": f"https://www.coursera.org/search?query={skill_clean}",
                "emoji": c_emoji,
                "color": c_color,
                "desc": f"Master {s} through hands-on projects and practical coding exercises designed to meet job requirements.",
                "priority": prio,
                "mScore": 92 if prio == "critical" else 85
            })

            # Course 2: Practical Bootcamp / Tutorial
            res.append({
                "id": f"rec_{idx}_2",
                "skill": skill_clean,
                "title": f"{s.capitalize()} Crash Course for Developers",
                "platform": "freeCodeCamp",
                "provider": "freeCodeCamp",
                "level": "beginner",
                "hours": 6,
                "rating": 4.9,
                "students": "500k+ views",
                "free": True,
                "price": "",
                "cert": False,
                "url": f"https://www.youtube.com/results?search_query=freecodecamp+{skill_clean}",
                "emoji": c_emoji,
                "color": c_color,
                "desc": f"Fast-track your {s} knowledge with real-world project tutorials and key concept breakdowns.",
                "priority": prio,
                "mScore": 88 if prio == "critical" else 80
            })
            idx += 1
            if idx > 8:
                break
    return res


def generate_course_recommendations(
    skill_gap_analysis: dict,
    job_description: str = "",
    resume_text: str = ""
) -> list:
    """
    Generate 2-3 personalized learning resource suggestions per critical/important skill gap
    based on the candidate's resume and job description using LLM.
    """
    if not isinstance(skill_gap_analysis, dict):
        skill_gap_analysis = {}

    critical  = skill_gap_analysis.get("critical", [])  or []
    important = skill_gap_analysis.get("important", []) or []
    optional  = skill_gap_analysis.get("optional", [])  or []

    all_gaps = critical + important
    if not all_gaps and optional:
        all_gaps = optional[:3]

    if not all_gaps:
        return []

    skills_context = []
    for s in critical[:5]:
        skills_context.append(f"- {s} (Priority: Critical Gap)")
    for s in important[:5]:
        skills_context.append(f"- {s} (Priority: Important Gap)")
    if not (critical or important):
        for s in optional[:3]:
            skills_context.append(f"- {s} (Priority: Optional Gap)")

    prompt = f"""You are an elite software engineering career mentor and technical curriculum director.

TARGET JOB DESCRIPTION:
{job_description[:800] if job_description else "Software engineering / technology role"}

CANDIDATE RESUME SUMMARY:
{resume_text[:800] if resume_text else "Technical candidate seeking to upskill"}

CANDIDATE'S SKILL GAPS TO ADDRESS:
{chr(10).join(skills_context)}

For EACH skill gap listed above, generate 2-3 specific, high-quality, personalized learning resource recommendations (e.g. top courses on Coursera, Udemy, freeCodeCamp, YouTube masterclasses, or official documentation tutorials).
Base your recommendations and descriptions on the candidate's background and target role requirements.

Return ONLY a valid JSON array of course objects — no markdown fences, no extra text.
Each course object MUST follow this structure:
[
  {{
    "id": "c_1",
    "skill": "<skill_name_lowercase>",
    "title": "<Specific Course or Tutorial Title>",
    "platform": "<Coursera | Udemy | freeCodeCamp | YouTube | DeepLearning.AI | Official Docs>",
    "provider": "<Instructor, University, or Publisher name>",
    "level": "<beginner | intermediate | advanced>",
    "hours": <estimated_hours_integer>,
    "rating": <rating_float_e.g._4.8>,
    "students": "<e.g._150k+>",
    "free": <boolean_true_or_false>,
    "price": "<e.g._'$14.99'_or_''>",
    "cert": <boolean_true_or_false>,
    "url": "<search_or_course_link>",
    "emoji": "<single_relevant_emoji>",
    "color": ["#3b82f6", "#1d4ed8"],
    "desc": "<2 sentence personalized explanation of why this resource bridges this candidate's gap for the target job>",
    "priority": "<critical | important | optional>",
    "mScore": <match_relevance_integer_75_to_98>
  }}
]
"""

    raw = _call(prompt, max_tokens=1500)
    import json, re

    raw = raw.strip()
    raw = re.sub(r"^```(?:json)?\s*", "", raw)
    raw = re.sub(r"\s*```$", "", raw)
    match = re.search(r"\[.*\]", raw, re.DOTALL)
    if match:
        raw = match.group(0)

    try:
        parsed = json.loads(raw)
        if isinstance(parsed, list) and len(parsed) > 0:
            return parsed
    except Exception:
        pass

    return _fallback_course_recommendations(skill_gap_analysis)

