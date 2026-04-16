import httpx
import asyncio
import os
from typing import List, Dict
from dotenv import load_dotenv

load_dotenv()

RAPIDAPI_KEY = os.environ.get("RAPIDAPI_KEY")
print(f"RAPIDAPI_KEY loaded: {bool(RAPIDAPI_KEY)}")

SKILL_TO_ROLE = {
    frozenset(['python', 'fastapi', 'django', 'flask']): 'Backend Developer',
    frozenset(['react', 'javascript', 'typescript', 'vue', 'angular']): 'Frontend Developer',
    frozenset(['python', 'tensorflow', 'pytorch', 'machine learning', 'sklearn']): 'Machine Learning Engineer',
    frozenset(['docker', 'kubernetes', 'aws', 'devops', 'ci/cd']): 'DevOps Engineer',
    frozenset(['python', 'sql', 'pandas', 'data analysis']): 'Data Analyst',
    frozenset(['java', 'spring', 'microservices']): 'Java Developer',
    frozenset(['react', 'node', 'javascript', 'mongodb']): 'Full Stack Developer',
}

def detect_role_from_skills(skills: List[str]) -> str:
    skills_set = set(s.lower() for s in skills)
    best_match = 'Software Developer'
    best_score = 0
    for role_skills, role_name in SKILL_TO_ROLE.items():
        score = len(skills_set.intersection(role_skills))
        if score > best_score:
            best_score = score
            best_match = role_name
    return best_match

def fetch_jsearch_jobs_sync(keywords: List[str], location: str = "India") -> List[Dict]:
    """Fetch real jobs from JSearch using sync requests"""
    import requests
    jobs = []

    if not RAPIDAPI_KEY:
        return []

    role = detect_role_from_skills(keywords)
    primary_query = f"{role} {location}"
    fallback_query = f"{keywords[0] if keywords else 'Software'} developer {location}"

    try:
        print(f"Calling JSearch: {primary_query}")
        response = requests.get(
            "https://jsearch.p.rapidapi.com/search",
            params={
                "query": primary_query,
                "page": "1",
                "num_pages": "1",
                "date_posted": "month",
            },
            headers={
                "X-RapidAPI-Key": RAPIDAPI_KEY,
                "X-RapidAPI-Host": "jsearch.p.rapidapi.com"
            },
            timeout=60,
            verify=False
        )
        print(f"JSearch status: {response.status_code}")
        
        data = response.json() if response.status_code == 200 else {}
        
        if response.status_code != 200 or not data.get("data", []):
            print(f"Primary yield 0, trying fallback: {fallback_query}")
            response = requests.get(
                "https://jsearch.p.rapidapi.com/search",
                params={
                    "query": fallback_query,
                    "page": "1",
                    "num_pages": "1",
                    "date_posted": "month",
                },
                headers={
                    "X-RapidAPI-Key": RAPIDAPI_KEY,
                    "X-RapidAPI-Host": "jsearch.p.rapidapi.com"
                },
                timeout=60,
                verify=False
            )
            if response.status_code == 200:
                data = response.json()

        if response.status_code == 200:
            print(f"JSearch data count: {len(data.get('data', []))}")
            for job in data.get("data", []):
                loc = job.get("job_city", "") or job.get("job_country", "") or "Remote"
                region = "remote" if job.get("job_is_remote") else \
                         "india" if "india" in (job.get("job_country", "") or "").lower() else \
                         "us" if "united states" in (job.get("job_country", "") or "").lower() else \
                         "uk" if "united kingdom" in (job.get("job_country", "") or "").lower() else \
                         "global"

                salary = ""
                if job.get("job_min_salary") and job.get("job_max_salary"):
                    currency = job.get("job_salary_currency", "USD")
                    period = job.get("job_salary_period", "YEAR")
                    salary = f"{currency} {int(job['job_min_salary']):,} - {int(job['job_max_salary']):,} / {period.lower()}"

                jobs.append({
                    "id": job.get("job_id", ""),
                    "title": job.get("job_title", ""),
                    "company": job.get("employer_name", ""),
                    "location": loc,
                    "type": job.get("job_employment_type", "FULLTIME").replace("_", " ").title(),
                    "category": job.get("job_category", ""),
                    "tags": job.get("job_required_skills", []) or [],
                    "salary": salary,
                    "url": job.get("job_apply_link", ""),
                    "posted_at": job.get("job_posted_at_datetime_utc", ""),
                    "source": job.get("job_publisher", "LinkedIn"),
                    "region": region,
                    "logo": job.get("employer_logo", ""),
                    "description": (job.get("job_description", "") or "")[:200],
                    "experience": job.get("job_required_experience", {}).get("required_experience_in_months", 0),
                    "remote": job.get("job_is_remote", False),
                })
    except Exception as e:
        print(f"JSearch error: {type(e).__name__}: {e}")

    return jobs

async def fetch_remotive_jobs(keywords: List[str]) -> List[Dict]:
    """Fallback: Fetch remote tech jobs from Remotive"""
    jobs = []
    search_term = " ".join(keywords[:3])
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(
                "https://remotive.com/api/remote-jobs",
                params={"search": search_term, "limit": 10}
            )
            if response.status_code == 200:
                data = response.json()
                for job in data.get("jobs", []):
                    jobs.append({
                        "id": str(job.get("id", "")),
                        "title": job.get("title", ""),
                        "company": job.get("company_name", ""),
                        "location": "Remote",
                        "type": job.get("job_type", "Full Time"),
                        "category": job.get("category", ""),
                        "tags": job.get("tags", []),
                        "salary": job.get("salary", ""),
                        "url": job.get("url", ""),
                        "posted_at": job.get("publication_date", ""),
                        "source": "Remotive",
                        "region": "remote",
                        "logo": job.get("company_logo", ""),
                        "description": "",
                        "experience": 0,
                        "remote": True,
                    })
    except Exception as e:
        print(f"Remotive fetch error: {e}")
    return jobs

def calculate_job_match(job: Dict, resume_skills: List[str]) -> float:
    if not resume_skills:
        return 0.0
    job_text = (
        job.get("title", "") + " " +
        " ".join(job.get("tags", [])) + " " +
        job.get("category", "") + " " +
        job.get("description", "")
    ).lower()
    matched = sum(1 for skill in resume_skills if skill.lower() in job_text)
    score = (matched / len(resume_skills)) * 100
    return round(min(score * 2.5, 99), 1)

async def fetch_all_jobs(resume_skills: List[str], location: str = "India") -> List[Dict]:
    import asyncio
    keywords = resume_skills[:5] if resume_skills else ["software", "developer"]
    print(f"Skills received: {resume_skills}")

    all_jobs = []

    if RAPIDAPI_KEY:
        loop = asyncio.get_event_loop()
        # Run sync function in thread pool to avoid blocking
        india_jobs = await loop.run_in_executor(
            None, fetch_jsearch_jobs_sync, keywords, location
        )
        print(f"India jobs: {len(india_jobs)}")
        all_jobs.extend(india_jobs)

        remote_jobs = await loop.run_in_executor(
            None, fetch_jsearch_jobs_sync, keywords, "Remote"
        )
        print(f"Remote jobs: {len(remote_jobs)}")
        all_jobs.extend(remote_jobs)
    else:
        all_jobs = await fetch_remotive_jobs(keywords)

    for job in all_jobs:
        job["match_score"] = calculate_job_match(job, resume_skills)

    seen = set()
    unique_jobs = []
    for job in all_jobs:
        key = f"{job['title']}-{job['company']}"
        if key not in seen:
            seen.add(key)
            unique_jobs.append(job)

    unique_jobs.sort(key=lambda x: x["match_score"], reverse=True)
    return unique_jobs[:50]