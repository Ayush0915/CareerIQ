import asyncio
import logging
from typing import Dict, List, Optional

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

from core.config import settings
from core.limiter import limiter
from services.ai_coach import (
    generate_cover_letter,
    generate_course_recommendations,
    generate_interview_prep,
    generate_linkedin_summary,
    generate_skill_roadmap,
    rewrite_bullets,
)

logger = logging.getLogger(__name__)
router = APIRouter()


class AICoachRequest(BaseModel):
    weak_phrases: List[str] = []
    matching_skills: List[str] = []
    missing_skills: List[str] = []
    job_description: str
    resume_text: str = ""
    experience_level: str = "mid"


class AICoachResponse(BaseModel):
    rewritten_bullets: str
    cover_letter: str
    skill_roadmap: str
    interview_prep: str = ""
    linkedin_summary: str = ""


class InterviewPrepRequest(BaseModel):
    matching_skills: List[str] = []
    missing_skills: List[str] = []
    job_description: str
    experience_level: str = "mid"


class LinkedInRequest(BaseModel):
    matching_skills: List[str] = []
    resume_text: str = ""
    job_description: str = ""


class CourseRecommendationsRequest(BaseModel):
    skill_gap_analysis: Optional[Dict[str, List[str]]] = None
    critical: Optional[List[str]] = []
    important: Optional[List[str]] = []
    optional: Optional[List[str]] = []
    job_description: Optional[str] = ""
    resume_text: Optional[str] = ""


@router.post("/ai-coach", response_model=AICoachResponse)
@limiter.limit(settings.rate_limit)
async def ai_coach(request: Request, req: AICoachRequest):
    """Full coaching bundle — bullets, cover letter, roadmap, interview prep, LinkedIn.

    Five genuinely concurrent network calls now.  Previously each one occupied
    an OS thread from the default executor purely to wait on a socket.
    """
    results = await asyncio.gather(
        rewrite_bullets(req.weak_phrases, req.resume_text, req.job_description),
        generate_cover_letter(
            req.matching_skills, req.missing_skills, req.job_description, req.resume_text
        ),
        generate_skill_roadmap(req.missing_skills, req.job_description),
        generate_interview_prep(
            req.matching_skills, req.missing_skills, req.job_description, req.experience_level
        ),
        generate_linkedin_summary(req.matching_skills, req.resume_text, req.job_description),
        return_exceptions=True,
    )

    def value(item) -> str:
        if isinstance(item, Exception):
            logger.error("Coaching sub-task failed: %s", item)
            return ""
        return str(item)

    bullets, letter, roadmap, prep, linkedin = (value(item) for item in results)

    return AICoachResponse(
        rewritten_bullets=bullets,
        cover_letter=letter,
        skill_roadmap=roadmap,
        interview_prep=prep,
        linkedin_summary=linkedin,
    )


@router.post("/ai-coach/interview-prep")
@limiter.limit(settings.rate_limit)
async def interview_prep_only(request: Request, req: InterviewPrepRequest):
    """Standalone interview prep questions endpoint."""
    try:
        result = await generate_interview_prep(
            req.matching_skills,
            req.missing_skills,
            req.job_description,
            req.experience_level,
        )
        return {"interview_prep": result}
    except Exception as exc:
        logger.exception("Interview prep failed")
        raise HTTPException(500, detail="Could not generate interview prep.") from exc


@router.post("/ai-coach/linkedin")
@limiter.limit(settings.rate_limit)
async def linkedin_only(request: Request, req: LinkedInRequest):
    """Standalone LinkedIn summary generator."""
    try:
        result = await generate_linkedin_summary(
            req.matching_skills,
            req.resume_text,
            req.job_description,
        )
        return {"linkedin_summary": result}
    except Exception as exc:
        logger.exception("LinkedIn summary failed")
        raise HTTPException(500, detail="Could not generate a LinkedIn summary.") from exc


@router.post("/ai-coach/course-recommendations")
@limiter.limit(settings.rate_limit)
async def course_recommendations_endpoint(request: Request, req: CourseRecommendationsRequest):
    """Personalized learning resources for the detected skill gaps."""
    gap_dict = req.skill_gap_analysis or {
        "critical": req.critical or [],
        "important": req.important or [],
        "optional": req.optional or [],
    }

    try:
        recommendations = await generate_course_recommendations(
            gap_dict,
            req.job_description or "",
            req.resume_text or "",
        )
        return {"courses": recommendations}
    except Exception as exc:
        logger.exception("Course recommendations failed")
        raise HTTPException(500, detail="Could not generate recommendations.") from exc
