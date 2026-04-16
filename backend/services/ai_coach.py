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
