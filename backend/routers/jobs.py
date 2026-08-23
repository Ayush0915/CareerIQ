
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.job_fetcher import fetch_all_jobs

router = APIRouter()


class JobSearchRequest(BaseModel):
    skills: list[str]
    location: str | None = "India"


@router.post("/jobs")
async def get_job_recommendations(req: JobSearchRequest):
    try:
        jobs = await fetch_all_jobs(req.skills, req.location)
        return {"jobs": jobs, "total": len(jobs)}
    except Exception as exc:
        raise HTTPException(500, "Job search failed. Please try again.") from exc