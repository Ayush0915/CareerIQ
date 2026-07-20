from pydantic import BaseModel
from typing import List, Dict, Optional, Any


class TopMatch(BaseModel):
    sentence: str
    score: float


class SkillGapAnalysis(BaseModel):
    critical:  List[str]
    important: List[str]
    optional:  List[str]


class SignalNoiseResult(BaseModel):
    clarity_score:            float
    weak_phrases_found:       List[str]
    strong_verbs_found:       List[str]
    quantified_sentences:     int
    passive_voice_count:      int = 0
    buzzwords_found:          List[str] = []
    total_sentences_analyzed: int = 0


class SectionScores(BaseModel):
    experience: float
    skills:     float
    education:  float
    projects:   float
    summary:    float


class KeywordAnalysis(BaseModel):
    present:               List[str]
    missing_critical:      List[str]
    missing_recommended:   List[str]


class ExperienceInfo(BaseModel):
    detected_years:    int
    required_years:    int
    level:             str
    meets_requirement: bool
    gap_years:         int


class LLMEvaluation(BaseModel):
    overall_score:           float
    experience_level:        str
    years_detected:          str
    section_scores:          SectionScores
    keyword_analysis:        KeywordAnalysis
    grammar_issues:          List[str]
    cliches_found:           List[str]
    readability_score:       float
    passive_voice_count:     int
    quantified_achievements: int
    section_feedback:        Dict[str, str]
    top_improvements:        List[str]
    ats_compatibility:       float
    job_match_reasoning:     str
    # New fields
    interview_questions: List[str] = []
    resume_strengths:    List[str] = []
    salary_insight:      str = ""
    competition_level:   str = "medium"
    fit_verdict:         str = "unknown"


class ATSCheckResult(BaseModel):
    score:   float
    note:    str


class ATSSimulation(BaseModel):
    overall_ats_score: float
    checks:            Dict[str, Any]
    top_issues:        List[str]
    verdict:           str


class AnalysisResponse(BaseModel):
    # Core scores
    semantic_match_score:  float
    ats_keyword_score:     float
    # Skills
    resume_skills:   List[str]
    jd_skills:       List[str]
    matching_skills: List[str]
    missing_skills:  List[str]
    # Top sentence matches
    top_matches:     List[TopMatch]
    # Gap analysis
    skill_gap_analysis: SkillGapAnalysis
    # Writing quality
    signal_noise: SignalNoiseResult
    # Feedback
    feedback:              str
    total_skills_detected: int
    # AI-powered
    llm_evaluation:   Optional[LLMEvaluation] = None
    experience_info:  Optional[ExperienceInfo] = None
    section_scores:   Optional[Dict[str, float]] = None
    # New: ATS simulation
    ats_simulation:   Optional[ATSSimulation] = None
    # New: metadata
    contact_info:     Optional[Dict[str, str]] = None
    word_count:       Optional[int] = None
    processing_time_s: Optional[float] = None
