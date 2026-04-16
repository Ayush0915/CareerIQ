import React, { useState } from 'react'
import { Brain, TrendingUp, AlertTriangle, CheckCircle, ChevronDown, ChevronUp, User } from 'lucide-react'
import SkillBadge from './SkillBadge'

function ScoreBar({ label, value, color = '#0caa41' }) {
  return (
    <div className="mb-2">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-500">{label}</span>
        <span className="font-semibold text-gray-700">{Math.round(value)}%</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${value}%`, background: color, transitionDelay: '400ms' }}
        />
      </div>
    </div>
  )
}

function CollapseCard({ title, icon: Icon, children, defaultOpen = false, color = 'primary' }) {
  const [open, setOpen] = useState(defaultOpen)
  const colors = {
    primary: 'text-primary bg-primary-light',
    warn: 'text-amber-600 bg-amber-50',
    danger: 'text-red-500 bg-red-50',
    info: 'text-blue-600 bg-blue-50',
  }
  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${colors[color]}`}>
            <Icon size={14} />
          </div>
          <span className="font-semibold text-gray-800 text-sm">{title}</span>
        </div>
        {open ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  )
}

export default function LLMInsights({ llm, experience, sectionScores }) {
  if (!llm) return null

  const levelColors = {
    junior: 'bg-blue-50 text-blue-600 border-blue-200',
    mid: 'bg-amber-50 text-amber-600 border-amber-200',
    senior: 'bg-green-50 text-green-600 border-green-200',
    unknown: 'bg-gray-50 text-gray-500 border-gray-200',
  }

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="card p-5 border-l-4 border-l-primary">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Brain size={18} className="text-primary" />
              <h3 className="font-bold text-gray-800">AI Master Evaluation</h3>
              <span className="text-xs bg-primary-light text-primary px-2 py-0.5 rounded-full font-medium">
                Llama 3.1
              </span>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">{llm.job_match_reasoning}</p>
          </div>
          <div className="text-center shrink-0">
            <div className={`text-3xl font-bold ${llm.overall_score >= 70 ? 'text-primary' : llm.overall_score >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
              {Math.round(llm.overall_score)}
            </div>
            <div className="text-xs text-gray-400">AI Score</div>
          </div>
        </div>
      </div>

      {/* Experience + Level Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card p-4 text-center">
          <User size={16} className="text-primary mx-auto mb-1" />
          <div className={`text-xs font-semibold px-2 py-1 rounded-full border inline-block capitalize ${levelColors[llm.experience_level]}`}>
            {llm.experience_level}
          </div>
          <div className="text-xs text-gray-400 mt-1">Level</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-xl font-bold text-gray-800">{llm.years_detected}</div>
          <div className="text-xs text-gray-400">Detected Exp.</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-xl font-bold text-blue-600">{Math.round(llm.ats_compatibility)}%</div>
          <div className="text-xs text-gray-400">ATS Compat.</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-xl font-bold text-purple-600">{Math.round(llm.readability_score)}%</div>
          <div className="text-xs text-gray-400">Readability</div>
        </div>
      </div>

      {/* Section Scores */}
      <CollapseCard title="Section-by-Section Scores" icon={TrendingUp} defaultOpen={true}>
        <div className="space-y-1 pt-1">
          <ScoreBar label="Experience" value={llm.section_scores.experience} color="#0caa41" />
          <ScoreBar label="Skills" value={llm.section_scores.skills} color="#3b82f6" />
          <ScoreBar label="Projects" value={llm.section_scores.projects} color="#8b5cf6" />
          <ScoreBar label="Education" value={llm.section_scores.education} color="#f59e0b" />
          <ScoreBar label="Summary" value={llm.section_scores.summary} color="#ec4899" />
        </div>
        {Object.keys(llm.section_feedback).length > 0 && (
          <div className="mt-4 space-y-2">
            {Object.entries(llm.section_feedback).map(([section, feedback]) => (
              <div key={section} className="flex items-start gap-2 text-xs">
                <span className="text-gray-400 uppercase font-semibold w-20 shrink-0 pt-0.5">{section}</span>
                <span className="text-gray-600">{feedback}</span>
              </div>
            ))}
          </div>
        )}
      </CollapseCard>

      {/* Top Improvements */}
      <CollapseCard title="Top Improvements" icon={CheckCircle} defaultOpen={true} color="primary">
        <ol className="space-y-2 pt-1">
          {llm.top_improvements.map((item, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
              <span className="w-5 h-5 rounded-full bg-primary-light text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                {i + 1}
              </span>
              {item}
            </li>
          ))}
        </ol>
      </CollapseCard>

      {/* Keyword Analysis */}
      <CollapseCard title="AI Keyword Analysis" icon={Brain} color="info">
        <div className="space-y-3 pt-1">
          {llm.keyword_analysis.present.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-1.5">✅ Present</p>
              <div className="flex flex-wrap gap-1.5">
                {llm.keyword_analysis.present.map(s => <SkillBadge key={s} skill={s} variant="match" />)}
              </div>
            </div>
          )}
          {llm.keyword_analysis.missing_critical.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-red-500 uppercase tracking-wider mb-1.5">🔴 Critical Missing</p>
              <div className="flex flex-wrap gap-1.5">
                {llm.keyword_analysis.missing_critical.map(s => <SkillBadge key={s} skill={s} variant="critical" />)}
              </div>
            </div>
          )}
          {llm.keyword_analysis.missing_recommended.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-amber-500 uppercase tracking-wider mb-1.5">🟡 Recommended</p>
              <div className="flex flex-wrap gap-1.5">
                {llm.keyword_analysis.missing_recommended.map(s => <SkillBadge key={s} skill={s} variant="important" />)}
              </div>
            </div>
          )}
        </div>
      </CollapseCard>

      {/* Issues */}
      {(llm.grammar_issues.length > 0 || llm.cliches_found.length > 0) && (
        <CollapseCard title="Writing Issues Detected" icon={AlertTriangle} color="warn">
          <div className="space-y-3 pt-1">
            {llm.grammar_issues.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-red-500 uppercase tracking-wider mb-1.5">Grammar Issues</p>
                <ul className="space-y-1">
                  {llm.grammar_issues.map((issue, i) => (
                    <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                      <span className="text-red-400 mt-0.5">•</span> {issue}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {llm.cliches_found.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-amber-500 uppercase tracking-wider mb-1.5">Clichés Found</p>
                <div className="flex flex-wrap gap-1.5">
                  {llm.cliches_found.map(c => <SkillBadge key={c} skill={c} variant="important" />)}
                </div>
              </div>
            )}
          </div>
        </CollapseCard>
      )}

      {/* Experience match */}
      {experience && (
        <div className={`card p-4 border-l-4 ${experience.meets_requirement ? 'border-l-green-500' : 'border-l-red-400'}`}>
          <div className="flex items-center gap-2 mb-1">
            <User size={15} className={experience.meets_requirement ? 'text-green-600' : 'text-red-500'} />
            <span className="font-semibold text-gray-800 text-sm">Experience Match</span>
          </div>
          <p className="text-sm text-gray-600">
            {experience.meets_requirement
              ? `✅ Your ~${experience.detected_years} years meets the JD requirement of ${experience.required_years}+ years.`
              : `⚠️ JD requires ${experience.required_years}+ years, resume shows ~${experience.detected_years} years (${experience.gap_years} year gap).`
            }
          </p>
        </div>
      )}
    </div>
  )
}