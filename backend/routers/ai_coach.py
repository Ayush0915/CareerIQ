import logging
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import List, Optional, Dict
from main import limiter

from services.ai_coach import (
    rewrite_bullets,
    generate_cover_letter,
    generate_skill_roadmap,
    generate_interview_prep,
    generate_linkedin_summary,
    generate_course_recommendations,
)

logger = logging.getLogger(__name__)
router = APIRouter()


class AICoachRequest(BaseModel):
    weak_phrases:    List[str] = []
    matching_skills: List[str] = []
    missing_skills:  List[str] = []
    job_description: str
    resume_text:     str = ""
    experience_level: str = "mid"


class AICoachResponse(BaseModel):
    rewritten_bullets: str
    cover_letter:      str
    skill_roadmap:     str
    interview_prep:    str = ""
    linkedin_summary:  str = ""


class InterviewPrepRequest(BaseModel):
    matching_skills:  List[str] = []
    missing_skills:   List[str] = []
    job_description:  str
    experience_level: str = "mid"


class LinkedInRequest(BaseModel):
    matching_skills: List[str] = []
    resume_text:     str = ""
    job_description: str = ""


@router.post("/ai-coach", response_model=AICoachResponse)
@limiter.limit("5/minute")
async def ai_coach(request: Request, req: AICoachRequest):
    """Full coaching bundle — bullets, cover letter, roadmap, interview prep, LinkedIn."""
    import asyncio
    from functools import partial

    loop = asyncio.get_event_loop()

    async def _run(fn, *args):
        return await loop.run_in_executor(None, partial(fn, *args))

    try:
        bullets_fut  = _run(rewrite_bullets,        req.weak_phrases,    req.resume_text,    req.job_description)
        letter_fut   = _run(generate_cover_letter,   req.matching_skills, req.missing_skills, req.job_description, req.resume_text)
        roadmap_fut  = _run(generate_skill_roadmap,  req.missing_skills,  req.job_description)
        prep_fut     = _run(generate_interview_prep, req.matching_skills, req.missing_skills, req.job_description, req.experience_level)
        linkedin_fut = _run(generate_linkedin_summary, req.matching_skills, req.resume_text, req.job_description)

        bullets, letter, roadmap, prep, linkedin = await asyncio.gather(
            bullets_fut, letter_fut, roadmap_fut, prep_fut, linkedin_fut,
            return_exceptions=True
        )

        def _safe(val, fallback=""):
            return str(val) if not isinstance(val, Exception) else fallback

        return AICoachResponse(
            rewritten_bullets = _safe(bullets),
            cover_letter      = _safe(letter),
            skill_roadmap     = _safe(roadmap),
            interview_prep    = _safe(prep),
            linkedin_summary  = _safe(linkedin),
        )

    except Exception as e:
        logger.exception(f"AI Coach failed: {e}")
        raise HTTPException(500, detail=f"AI Coach failed: {str(e)}")


@router.post("/ai-coach/interview-prep")
@limiter.limit("5/minute")
async def interview_prep_only(request: Request, req: InterviewPrepRequest):
    """Standalone interview prep questions endpoint."""
    import asyncio
    loop = asyncio.get_event_loop()
    try:
        result = await loop.run_in_executor(
            None,
            generate_interview_prep,
            req.matching_skills,
            req.missing_skills,
            req.job_description,
            req.experience_level,
        )
        return {"interview_prep": result}
    except Exception as e:
        raise HTTPException(500, detail=str(e))


@router.post("/ai-coach/linkedin")
@limiter.limit("5/minute")
async def linkedin_only(request: Request, req: LinkedInRequest):
    """Standalone LinkedIn summary generator."""
    import asyncio
    loop = asyncio.get_event_loop()
    try:
        result = await loop.run_in_executor(
            None,
            generate_linkedin_summary,
            req.matching_skills,
            req.resume_text,
            req.job_description,
        )
        return {"linkedin_summary": result}
    except Exception as e:
        raise HTTPException(500, detail=str(e))


class CourseRecommendationsRequest(BaseModel):
    skill_gap_analysis: Optional[Dict[str, List[str]]] = None
    critical: Optional[List[str]] = []
    important: Optional[List[str]] = []
    optional: Optional[List[str]] = []
    job_description: Optional[str] = ""
    resume_text: Optional[str] = ""


@router.post("/ai-coach/course-recommendations")
@limiter.limit("5/minute")
async def course_recommendations_endpoint(request: Request, req: CourseRecommendationsRequest):
    """Generate dynamic, LLM-powered course recommendations for skill gaps."""
    import asyncio
    loop = asyncio.get_event_loop()

    gap_dict = req.skill_gap_analysis or {
        "critical": req.critical or [],
        "important": req.important or [],
        "optional": req.optional or [],
    }

    try:
        recommendations = await loop.run_in_executor(
            None,
            generate_course_recommendations,
            gap_dict,
            req.job_description or "",
            req.resume_text or "",
        )
        return {"courses": recommendations}
    except Exception as e:
        logger.exception(f"Course recommendations failed: {e}")
        raise HTTPException(500, detail=f"Course recommendations failed: {str(e)}")

