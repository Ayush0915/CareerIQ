/**
 * API contract types.
 *
 * Mirrors the Pydantic models in backend/models/schemas.py. Regenerate the
 * machine version any time the backend changes:
 *
 *   1. python -c "import sys;sys.path.insert(0,'backend');from main import app;
 *      import json;json.dump(app.openapi(), open('frontend/openapi.json','w'))"
 *   2. npm run gen:types
 *
 * This hand-written file is the one components import, so the shape stays
 * readable; openapi.d.ts is the check that it has not drifted.
 */

export interface TopMatch {
  sentence: string
  score: number
}

export interface SkillGapAnalysis {
  critical: string[]
  important: string[]
  optional: string[]
}

export interface SignalNoiseResult {
  clarity_score: number
  weak_phrases_found: string[]
  strong_verbs_found: string[]
  quantified_sentences: number
  passive_voice_count: number
  buzzwords_found: string[]
  total_sentences_analyzed: number
}

export interface SectionScores {
  experience: number
  skills: number
  education: number
  projects: number
  summary: number
}

export interface SectionFeedback {
  experience: string
  skills: string
  projects: string
  summary: string
}

export interface KeywordAnalysis {
  present: string[]
  missing_critical: string[]
  missing_recommended: string[]
}

export interface ExperienceInfo {
  detected_years: number
  required_years: number
  level: string
  meets_requirement: boolean
  gap_years: number
}

export interface LLMEvaluation {
  overall_score: number
  experience_level: string
  years_detected: string
  section_scores: SectionScores
  keyword_analysis: KeywordAnalysis
  grammar_issues: string[]
  cliches_found: string[]
  readability_score: number
  passive_voice_count: number
  quantified_achievements: number
  section_feedback: SectionFeedback
  top_improvements: string[]
  ats_compatibility: number
  job_match_reasoning: string
  interview_questions: string[]
  resume_strengths: string[]
  salary_insight: string
  competition_level: string
  fit_verdict: string
}

export interface ATSCheck {
  score: number
  note: string
  evidence?: { examples?: string[] } & Record<string, unknown>
  [key: string]: unknown
}

export interface ATSSimulation {
  overall_ats_score: number
  checks: Record<string, ATSCheck>
  top_issues: string[]
  verdict: 'ATS-Ready' | 'Needs Improvement' | 'High ATS Risk' | string
}

export type LevelVerdict = 'appropriate' | 'overqualified' | 'underqualified'

export interface LevelFitInfo {
  detected_years: number
  required_years: number
  jd_seniority: 'junior' | 'senior' | 'unspecified' | string
  multiplier: number
  verdict: LevelVerdict
  note: string
}

/** The score the user sees, and what produced it. Computed server-side in
 *  services/scoring.py so the evaluation harness measures the same number. */
export interface FitBreakdown {
  overall: number
  semantic: number
  coverage: number
  clarity: number
  level: LevelFitInfo
  evidence_ratio: number
  unsupported_skills: string[]
  notes: string[]
}

export interface AnalysisResponse {
  semantic_match_score: number
  ats_keyword_score: number
  resume_skills: string[]
  jd_skills: string[]
  matching_skills: string[]
  missing_skills: string[]
  top_matches: TopMatch[]
  skill_gap_analysis: SkillGapAnalysis
  signal_noise: SignalNoiseResult
  feedback: string
  total_skills_detected: number
  llm_evaluation?: LLMEvaluation | null
  experience_info?: ExperienceInfo | null
  section_scores?: Record<string, number> | null
  ats_simulation?: ATSSimulation | null
  /** Optional because history entries saved before Phase 5 predate it. */
  fit?: FitBreakdown | null
  contact_info?: Record<string, string> | null
  word_count?: number | null
  processing_time_s?: number | null
  job_description?: string
  resume_text?: string
}

/* ── Streaming ─────────────────────────────────────────────────────────── */

export interface ProgressEvent {
  event: 'progress'
  progress: number
  message: string
}

export interface CompleteEvent {
  event: 'complete'
  progress: 100
  result: AnalysisResponse
}

export interface ErrorEvent {
  event: 'error'
  message: string
}

export type AnalysisStreamEvent = ProgressEvent | CompleteEvent | ErrorEvent

/* ── Coaching ──────────────────────────────────────────────────────────── */

export type CoachingMode =
  | 'bullets'
  | 'cover_letter'
  | 'roadmap'
  | 'interview'
  | 'linkedin'

export interface CoachingPayload {
  weak_phrases: string[]
  matching_skills: string[]
  missing_skills: string[]
  job_description: string
  resume_text: string
  experience_level: string
}

export interface CoachingResponse {
  mode: CoachingMode
  label: string
  content: string
}

/* ── Courses ───────────────────────────────────────────────────────────── */

export interface Course {
  id: string
  skill: string
  title: string
  platform: string
  provider: string
  level: 'beginner' | 'intermediate' | 'advanced' | string
  hours: number
  free: boolean
  price: string
  cert: boolean
  url: string
  emoji: string
  color: [string, string] | string[]
  desc: string
  priority: 'critical' | 'important' | 'optional' | string
  mScore: number
}

export interface CoursesResponse {
  courses: Course[]
}

/** History entries are persisted, so they may predate any field above. */
export interface HistoryEntry {
  id: string
  createdAt: number
  jobTitle: string
  score: number
  response: AnalysisResponse
}
