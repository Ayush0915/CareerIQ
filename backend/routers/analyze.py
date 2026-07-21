import os
import asyncio
import shutil
import tempfile
import logging
import time
import json
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Request
from fastapi.responses import StreamingResponse
from main import limiter
from models.schemas import AnalysisResponse, TopMatch, LLMEvaluation, SectionScores, KeywordAnalysis, ExperienceInfo

from typing import Optional
from services.parser import parse_resume, extract_text_from_pdf, extract_text_from_docx
from services.skill_extractor import load_skills, extract_skills_from_text
from services.similarity import calculate_similarity
from services.recommender import calculate_keyword_coverage, get_missing_skills, get_matching_skills, generate_feedback
from services.skill_gap_analyzer import classify_skill_gaps
from services.signal_noise_analyzer import analyze_signal_to_noise
from services.llm_evaluator import llm_master_evaluate
from services.experience_detector import detect_experience
from services.section_parser import parse_sections, score_sections
from services.ats_simulator import simulate_ats

logger = logging.getLogger(__name__)
router = APIRouter()

MAX_FILE_SIZE  = 5 * 1024 * 1024   # 5 MB
MAX_JD_LENGTH  = 8000


def _run_sync(fn, *args):
    """Run a synchronous function in the default thread pool (non-blocking)."""
    loop = asyncio.get_event_loop()
    return loop.run_in_executor(None, fn, *args)


@router.post("/analyze")
@limiter.limit("5/minute")
async def analyze_resume(
    request: Request,
    file: UploadFile = File(...),
    job_description: Optional[str] = Form(""),
    job_description_file: Optional[UploadFile] = File(None),
):
    t0 = time.perf_counter()

    # ── Input validation ──────────────────────────────────────────────────────
    ext = (file.filename or "").rsplit(".", 1)[-1].lower()
    if ext not in {"pdf", "docx"}:
        raise HTTPException(400, detail="Only PDF and DOCX files are supported.")

    # ── File size check ───────────────────────────────────────────────────────
    raw_bytes = await file.read()
    if len(raw_bytes) > MAX_FILE_SIZE:
        raise HTTPException(413, detail=f"File exceeds {MAX_FILE_SIZE // 1024 // 1024} MB limit.")

    # ── Magic-byte validation ──────────────────────────────────────────────────
    if ext == "pdf" and not raw_bytes.startswith(b"%PDF-"):
        raise HTTPException(400, detail="File content doesn't match its extension.")
    if ext == "docx" and not raw_bytes.startswith(b"PK\x03\x04"):
        raise HTTPException(400, detail="File content doesn't match its extension.")

    with tempfile.NamedTemporaryFile(delete=False, suffix=f".{ext}") as tmp:
        tmp.write(raw_bytes)
        tmp_path = tmp.name

    tmp_jd_path = None
    jd = (job_description or "").strip()

    # If pasted text isn't provided, check for job_description_file
    if not jd and job_description_file:
        jd_ext = (job_description_file.filename or "").rsplit(".", 1)[-1].lower()
        if jd_ext not in {"pdf", "docx"}:
            os.unlink(tmp_path)
            raise HTTPException(400, detail="Job description file must be PDF or DOCX.")

        jd_bytes = await job_description_file.read()
        if len(jd_bytes) > MAX_FILE_SIZE:
            os.unlink(tmp_path)
            raise HTTPException(413, detail=f"Job description file exceeds {MAX_FILE_SIZE // 1024 // 1024} MB limit.")

        if jd_ext == "pdf" and not jd_bytes.startswith(b"%PDF-"):
            os.unlink(tmp_path)
            raise HTTPException(400, detail="Job description file content doesn't match its extension.")
        if jd_ext == "docx" and not jd_bytes.startswith(b"PK\x03\x04"):
            os.unlink(tmp_path)
            raise HTTPException(400, detail="Job description file content doesn't match its extension.")

        with tempfile.NamedTemporaryFile(delete=False, suffix=f".{jd_ext}") as tmp_jd:
            tmp_jd.write(jd_bytes)
            tmp_jd_path = tmp_jd.name

        if jd_ext == "pdf":
            jd = extract_text_from_pdf(tmp_jd_path).strip()
        else:
            jd = extract_text_from_docx(tmp_jd_path).strip()

    if len(jd) < 30:
        os.unlink(tmp_path)
        if tmp_jd_path:
            os.unlink(tmp_jd_path)
        raise HTTPException(400, detail="Job description is too short. Please paste or upload more content.")
    if len(jd) > MAX_JD_LENGTH:
        jd = jd[:MAX_JD_LENGTH]

    async def stream_analysis_events():
        try:
            # ── Phase 1: Parse resume ─────────────────────────────────────────
            try:
                parse_result = parse_resume(tmp_path)
            except ValueError as ve:
                yield f"data: {json.dumps({'event': 'error', 'message': str(ve)})}\n\n"
                return

            resume_raw   = parse_result["raw_text"]
            resume_clean = parse_result["clean_text"]
            contact_info = parse_result.get("contact_info", {})
            word_count   = parse_result.get("word_count", 0)

            if word_count < 30:
                yield f"data: {json.dumps({'event': 'error', 'message': 'Resume appears to contain too little text. Is it a scanned image PDF?'})}\n\n"
                return

            # Emit Phase 1 Progress Event (25%)
            yield f"data: {json.dumps({'event': 'progress', 'progress': 25, 'message': 'Resume parsed successfully'})}\n\n"
            await asyncio.sleep(0.01)

            # ── Phase 2: Skill extraction ────────────────────────────────────
            skills_list   = load_skills()
            resume_skills = extract_skills_from_text(resume_clean, skills_list)
            jd_skills     = extract_skills_from_text(jd, skills_list)

            # Emit Phase 2 Progress Event (50%)
            yield f"data: {json.dumps({'event': 'progress', 'progress': 50, 'message': 'Skill extraction complete'})}\n\n"
            await asyncio.sleep(0.01)

            # ── Phase 3: Similarity & ATS calculation ───────────────────────
            keyword_score = calculate_keyword_coverage(resume_skills, jd_skills)
            sim           = calculate_similarity(resume_raw, jd)
            missing       = get_missing_skills(resume_skills, jd_skills)
            matching      = get_matching_skills(resume_skills, jd_skills)
            gap           = classify_skill_gaps(missing, jd_skills, jd)
            signal        = analyze_signal_to_noise(resume_raw)
            feedback      = generate_feedback(sim["final_score"], missing)
            ats_sim       = simulate_ats(resume_raw, jd)

            # Emit Phase 3 Progress Event (75%)
            yield f"data: {json.dumps({'event': 'progress', 'progress': 75, 'message': 'Similarity calculation complete'})}\n\n"
            await asyncio.sleep(0.01)

            # ── Phase 4: AI & LLM analysis ──────────────────────────────────
            llm_result            = None
            experience_info       = None
            section_scores_result = None

            async def _run_llm():
                return await _run_sync(llm_master_evaluate, resume_raw, jd)

            async def _run_exp():
                return await _run_sync(detect_experience, resume_raw, jd)

            async def _run_sections():
                sections = await _run_sync(parse_sections, resume_raw)
                return await _run_sync(score_sections, sections)

            try:
                llm_raw, exp_raw, section_raw = await asyncio.gather(
                    _run_llm(), _run_exp(), _run_sections(),
                    return_exceptions=True
                )

                if isinstance(llm_raw, dict) and "overall_score" in llm_raw:
                    llm_result = LLMEvaluation(
                        overall_score            = llm_raw.get("overall_score",   0),
                        experience_level         = llm_raw.get("experience_level","unknown"),
                        years_detected           = str(llm_raw.get("years_detected","unknown")),
                        section_scores           = SectionScores(**{
                            k: llm_raw.get("section_scores", {}).get(k, 0)
                            for k in ["experience","skills","education","projects","summary"]
                        }),
                        keyword_analysis         = KeywordAnalysis(**{
                            k: llm_raw.get("keyword_analysis",{}).get(k, [])
                            for k in ["present","missing_critical","missing_recommended"]
                        }),
                        grammar_issues           = llm_raw.get("grammar_issues",    []),
                        cliches_found            = llm_raw.get("cliches_found",     []),
                        readability_score        = llm_raw.get("readability_score",  0),
                        passive_voice_count      = llm_raw.get("passive_voice_count",0),
                        quantified_achievements  = llm_raw.get("quantified_achievements",0),
                        section_feedback         = llm_raw.get("section_feedback",  {}),
                        top_improvements         = llm_raw.get("top_improvements",  []),
                        ats_compatibility        = llm_raw.get("ats_compatibility",  0),
                        job_match_reasoning      = llm_raw.get("job_match_reasoning",""),
                        interview_questions      = llm_raw.get("interview_questions",[]),
                        resume_strengths         = llm_raw.get("resume_strengths",  []),
                        salary_insight           = llm_raw.get("salary_insight",    ""),
                        competition_level        = llm_raw.get("competition_level", "medium"),
                        fit_verdict              = llm_raw.get("fit_verdict",       "unknown"),
                    )

                if isinstance(exp_raw, dict):
                    experience_info = ExperienceInfo(**exp_raw)

                if isinstance(section_raw, dict):
                    section_scores_result = section_raw

            except Exception as ai_err:
                logger.warning(f"AI evaluation partial failure: {ai_err}")

            elapsed = round(time.perf_counter() - t0, 2)
            logger.info(f"Analysis complete in {elapsed}s | skills={len(resume_skills)} | score={sim['final_score']}")

            response_data = AnalysisResponse(
                semantic_match_score  = sim["final_score"],
                ats_keyword_score     = keyword_score,
                resume_skills         = resume_skills,
                jd_skills             = jd_skills,
                matching_skills       = matching,
                missing_skills        = missing,
                top_matches           = [TopMatch(sentence=s, score=sc) for s, sc in sim["top_matches"]],
                skill_gap_analysis    = gap,
                signal_noise          = signal,
                feedback              = feedback,
                total_skills_detected = len(resume_skills),
                llm_evaluation        = llm_result,
                experience_info       = experience_info,
                section_scores        = section_scores_result,
                ats_simulation        = ats_sim,
                contact_info          = contact_info,
                word_count            = word_count,
                processing_time_s     = elapsed,
                job_description       = jd,
                resume_text           = resume_raw,
            ).model_dump()

            # Emit Phase 4 Completion Event (100%)
            yield f"data: {json.dumps({'event': 'complete', 'progress': 100, 'result': response_data})}\n\n"

        except Exception as e:
            logger.exception(f"Unexpected error in /analyze stream: {e}")
            yield f"data: {json.dumps({'event': 'error', 'message': f'Analysis failed: {str(e)}'})}\n\n"
        finally:
            try:
                os.unlink(tmp_path)
            except Exception:
                pass
            if tmp_jd_path:
                try:
                    os.unlink(tmp_jd_path)
                except Exception:
                    pass

    return StreamingResponse(
        stream_analysis_events(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )
