import logging
from typing import Dict, List, Optional

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field

from core.config import settings
from core.limiter import limiter
from services.ai_coach import (
    COACHING_MODES,
    MODE_LABELS,
    generate_course_recommendations,
    generate_one,
)

logger = logging.getLogger(__name__)
router = APIRouter()


class CoachingRequest(BaseModel):
    """One coaching artefact, generated on demand.

    Replaces the five-call bundle. That fired every generator on every visit to
    the tab, which costs five of roughly twenty free requests per minute for
    output the user may never scroll to.
    """

    mode: str = Field(description=f"One of: {', '.join(COACHING_MODES)}")
    weak_phrases: List[str] = []
    matching_skills: List[str] = []
    missing_skills: List[str] = []
    job_description: str = ""
    resume_text: str = ""
    experience_level: str = "mid"


class CoachingResponse(BaseModel):
    mode: str
    label: str
    content: str


class CourseRecommendationsRequest(BaseModel):
    skill_gap_analysis: Optional[Dict[str, List[str]]] = None
    critical: Optional[List[str]] = []
    important: Optional[List[str]] = []
    optional: Optional[List[str]] = []
    job_description: Optional[str] = ""
    resume_text: Optional[str] = ""


@router.get("/ai-coach/modes", tags=["AI Coach"])
async def list_modes():
    """What the client can ask for, so the UI is not hardcoded to the server."""
    return {"modes": [{"id": mode, "label": MODE_LABELS[mode]} for mode in COACHING_MODES]}


@router.post("/ai-coach/generate", response_model=CoachingResponse)
@limiter.limit(settings.rate_limit)
async def generate(request: Request, req: CoachingRequest):
    """Generate one coaching artefact."""
    if req.mode not in COACHING_MODES:
        raise HTTPException(
            400,
            detail=f"Unknown mode {req.mode!r}. Expected one of: {', '.join(COACHING_MODES)}",
        )

    try:
        content = await generate_one(
            req.mode,
            weak_phrases=req.weak_phrases,
            matching_skills=req.matching_skills,
            missing_skills=req.missing_skills,
            job_description=req.job_description,
            resume_text=req.resume_text,
            experience_level=req.experience_level,
        )
    except Exception as exc:
        logger.exception("Coaching generation failed for mode %s", req.mode)
        raise HTTPException(500, detail="Could not generate that right now.") from exc

    return CoachingResponse(mode=req.mode, label=MODE_LABELS[req.mode], content=content)


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
