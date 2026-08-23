from typing import Any

from pydantic import BaseModel


class TopMatch(BaseModel):
    sentence: str
    score: float


class SkillGapAnalysis(BaseModel):
    critical:  list[str]
    important: list[str]
    optional:  list[str]


class SignalNoiseResult(BaseModel):
    clarity_score:            float
    weak_phrases_found:       list[str]
    strong_verbs_found:       list[str]
    quantified_sentences:     int
    passive_voice_count:      int = 0
    buzzwords_found:          list[str] = []
    total_sentences_analyzed: int = 0


class SectionScores(BaseModel):
    experience: float
    skills:     float
    education:  float
    projects:   float
    summary:    float


class KeywordAnalysis(BaseModel):
    present:               list[str]
    missing_critical:      list[str]
    missing_recommended:   list[str]


class ExperienceInfo(BaseModel):
    detected_years:    int
    required_years:    int
    level:             str
    meets_requirement: bool
    gap_years:         int


class SectionFeedback(BaseModel):
    """Typed rather than Dict[str, str].

    Strict JSON-schema mode cannot express an open-ended map, and naming the
    sections also tells the model exactly which ones to comment on.
    """
    experience: str
    skills:     str
    projects:   str
    summary:    str


class LLMEvaluation(BaseModel):
    overall_score:           float
    experience_level:        str
    years_detected:          str
    section_scores:          SectionScores
    keyword_analysis:        KeywordAnalysis
    grammar_issues:          list[str]
    cliches_found:           list[str]
    readability_score:       float
    passive_voice_count:     int
    quantified_achievements: int
    section_feedback:        SectionFeedback
    top_improvements:        list[str]
    ats_compatibility:       float
    job_match_reasoning:     str
    interview_questions:     list[str]
    resume_strengths:        list[str]
    salary_insight:          str
    competition_level:       str
    fit_verdict:             str


class ATSCheckResult(BaseModel):
    score:    float
    note:     str
    evidence: dict[str, Any] | None = None


class ATSSimulation(BaseModel):
    overall_ats_score: float
    checks:            dict[str, Any]
    top_issues:        list[str]
    verdict:           str


class LevelFitInfo(BaseModel):
    detected_years:  int = 0
    required_years:  int = 0
    jd_seniority:    str = "unspecified"
    multiplier:      float = 1.0
    verdict:         str = "appropriate"
    note:            str = ""


class FitBreakdown(BaseModel):
    """The score the user sees, and what produced it."""
    overall:            float
    semantic:           float
    coverage:           float
    clarity:            float
    level:              LevelFitInfo
    evidence_ratio:     float = 1.0
    unsupported_skills: list[str] = []
    notes:              list[str] = []


class AnalysisResponse(BaseModel):
    # Core scores
    semantic_match_score:  float
    ats_keyword_score:     float
    # Skills
    resume_skills:   list[str]
    jd_skills:       list[str]
    matching_skills: list[str]
    missing_skills:  list[str]
    # Top sentence matches
    top_matches:     list[TopMatch]
    # Gap analysis
    skill_gap_analysis: SkillGapAnalysis
    # Writing quality
    signal_noise: SignalNoiseResult
    # Feedback
    feedback:              str
    total_skills_detected: int
    # AI-powered
    llm_evaluation:   LLMEvaluation | None = None
    experience_info:  ExperienceInfo | None = None
    section_scores:   dict[str, float] | None = None
    # New: ATS simulation
    ats_simulation:   ATSSimulation | None = None
    # Unified fit score — the same function the evaluation harness scores
    fit:              FitBreakdown | None = None
    # New: metadata
    contact_info:     dict[str, str] | None = None
    word_count:       int | None = None
    processing_time_s: float | None = None
    job_description:   str | None = ""
    resume_text:       str | None = ""
