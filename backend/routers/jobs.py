from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from services.job_fetcher import fetch_all_jobs

router = APIRouter()


class JobSearchRequest(BaseModel):
    skills: List[str]
    location: Optional[str] = "India"


@router.post("/jobs")
async def get_job_recommendations(req: JobSearchRequest):
    try:
        jobs = await fetch_all_jobs(req.skills, req.location)
        return {"jobs": jobs, "total": len(jobs)}
    except Exception as e:
        raise HTTPException(500, f"Job fetch failed: {str(e)}")