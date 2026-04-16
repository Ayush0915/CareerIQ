import React, { useState } from 'react'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts'
import {
  ArrowLeft, TrendingUp, Target, Zap, AlertTriangle, CheckCircle,
  Info, Sparkles, Brain, Briefcase, BarChart3, RefreshCw, Award, FileText
} from 'lucide-react'
import ScoreRing from './ScoreRing'
import SkillBadge from './SkillBadge'
import AICoach from './AICoach'
import LLMInsights from './LLMInsights'
import JobRecommendations from './JobRecommendations'

const TABS = [
  { id: 'overview', label: 'Overview',    icon: BarChart3,  color: 'text-indigo-500'  },
  { id: 'skills',   label: 'Skills',      icon: Target,     color: 'text-violet-500'  },
  { id: 'ai',       label: 'AI Analysis', icon: Brain,      color: 'text-cyan-500'    },
  { id: 'jobs',     label: 'Live Jobs',   icon: Briefcase,  color: 'text-emerald-500' },
  { id: 'coach',    label: 'AI Coach',    icon: Sparkles,   color: 'text-amber-500'   },
]

function TabBar({ active, onChange }) {
  return (
    <div className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-16 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-3">
        <div className="overflow-x-auto">
          <div className="tab-pill-wrap">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => onChange(tab.id)}
                className={`tab-pill ${active === tab.id ? 'active' : ''}`}
              >
                <tab.icon size={13} className={active === tab.id ? tab.color : ''} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function ScoreProgressBar({ label, value, gradient }) {
  return (
    <div className="mb-4 last:mb-0">
      <div className="flex justify-between text-xs mb-2">
        <span className="text-muted font-medium">{label}</span>
        <span className="font-mono font-bold text-ink">{Math.round(value)}%</span>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${value}%`, background: gradient, transitionDelay: '200ms' }} />
      </div>
    </div>
  )
}

function SectionCard({ title, icon: Icon, children, accent, badge }) {
  const accents = {
    indigo: 'text-indigo-600 bg-indigo-50 border-indigo-100',
    green:  'text-emerald-600 bg-emerald-50 border-emerald-100',
    amber:  'text-amber-600 bg-amber-50 border-amber-100',
    violet: 'text-violet-600 bg-violet-50 border-violet-100',
    cyan:   'text-cyan-600 bg-cyan-50 border-cyan-100',
    red:    'text-red-500 bg-red-50 border-red-100',
  }
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${accents[accent || 'indigo']}`}>
            <Icon size={14} />
          </div>
          <h3 className="font-display font-semibold text-ink text-sm">{title}</h3>
        </div>
        {badge && <span className="text-xs font-semibold text-muted bg-bg-subtle px-2 py-0.5 rounded-full">{badge}</span>}
      </div>
      {children}
    </div>
  )
}

function MetricCard({ label, value, unit, gradient, sub, icon: Icon }) {
  return (
    <div className="metric-card flex flex-col gap-1">
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold text-muted uppercase tracking-wider">{label}</p>
        {Icon && <div className="w-6 h-6 bg-bg-subtle rounded-lg flex items-center justify-center"><Icon size={12} className="text-muted" /></div>}
      </div>
      <div className="flex items-baseline gap-1 mt-1">
        <span className="font-display font-extrabold text-3xl"
          style={{ background: gradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
          {value}
        </span>
        {unit && <span className="text-sm text-muted">{unit}</span>}
      </div>
      {sub && <p className="text-xs text-muted">{sub}</p>}
    </div>
  )
}

function OverviewTab({ data }) {
  const { semantic_match_score, ats_keyword_score, signal_noise, matching_skills, missing_skills, top_matches, feedback } = data
  const clarity = signal_noise.clarity_score
  const overall = Math.round(semantic_match_score * 0.4 + ats_keyword_score * 0.35 + clarity * 0.25)
  const overallGrad  = overall >= 70 ? 'linear-gradient(135deg,#10b981,#059669)' : overall >= 50 ? 'linear-gradient(135deg,#f59e0b,#d97706)' : 'linear-gradient(135deg,#ef4444,#dc2626)'
  const overallLabel = overall >= 70 ? 'Strong Match' : overall >= 50 ? 'Moderate Match' : 'Needs Work'
  const overallColor = overall >= 70 ? '#10b981' : overall >= 50 ? '#f59e0b' : '#ef4444'

  const radarData = [
    { subject: 'Semantic', A: semantic_match_score },
    { subject: 'ATS',      A: ats_keyword_score },
    { subject: 'Clarity',  A: clarity },
    { subject: 'Verbs',    A: Math.min(100, signal_noise.strong_verbs_found.length * 12) },
    { subject: 'Quant',    A: Math.min(100, signal_noise.quantified_sentences * 20) },
  ]

  return (
    <div className="space-y-5 animate-fade-up">
      {/* Score Banner */}
      <div className="card overflow-hidden">
        <div className="h-1 w-full" style={{ background: overallGrad }} />
        <div className="p-6">
          <div className="flex flex-col lg:flex-row items-center gap-8">
            <div className="flex flex-col items-center gap-3 shrink-0">
              <div className="score-ring-wrap">
                <ScoreRing score={overall} label="Overall" color={overallColor} size={130} />
              </div>
              <span className={`badge border text-xs font-semibold ${
                overall >= 70 ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                overall >= 50 ? 'bg-amber-50 border-amber-200 text-amber-700' :
                                'bg-red-50 border-red-200 text-red-600'
              }`}>{overallLabel}</span>
            </div>
            <div className="flex-1 w-full">
              <p className="text-xs font-semibold text-muted uppercase tracking-widest mb-4">Score Breakdown</p>
              <ScoreProgressBar label="Semantic Match"       value={semantic_match_score} gradient="linear-gradient(90deg,#6366f1,#8b5cf6)" />
              <ScoreProgressBar label="ATS Keyword Coverage" value={ats_keyword_score}    gradient="linear-gradient(90deg,#8b5cf6,#a855f7)" />
              <ScoreProgressBar label="Resume Clarity"       value={clarity}              gradient="linear-gradient(90deg,#10b981,#059669)" />
            </div>
            <div className="flex gap-5 shrink-0">
              <div className="score-ring-wrap"><ScoreRing score={semantic_match_score} label="Semantic" color="#6366f1" size={100} /></div>
              <div className="score-ring-wrap"><ScoreRing score={ats_keyword_score}    label="ATS"      color="#8b5cf6" size={100} /></div>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Matching Skills"  value={matching_skills.length}              gradient="linear-gradient(135deg,#10b981,#059669)" sub="Found in JD"       icon={CheckCircle}   />
        <MetricCard label="Missing Skills"   value={missing_skills.length}               gradient="linear-gradient(135deg,#ef4444,#dc2626)" sub="Not in resume"    icon={AlertTriangle} />
        <MetricCard label="Clarity Score"    value={Math.round(clarity)} unit="/100"     gradient="linear-gradient(135deg,#6366f1,#8b5cf6)" sub="Writing quality"  icon={FileText}      />
        <MetricCard label="Quantified Lines" value={signal_noise.quantified_sentences}   gradient="linear-gradient(135deg,#f59e0b,#d97706)" sub="Achievement bullets" icon={Award}       />
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-5">
        <SectionCard title="Performance Radar" icon={TrendingUp} accent="indigo">
          <ResponsiveContainer width="100%" height={210}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#f1f5f9" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'Plus Jakarta Sans' }} />
              <Radar dataKey="A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.12} strokeWidth={2} dot={{ fill: '#6366f1', r: 3 }} />
            </RadarChart>
          </ResponsiveContainer>
        </SectionCard>

        <SectionCard title="Top Matching Segments" icon={Zap} accent="violet" badge={`${top_matches.length} found`}>
          <div className="space-y-2.5 max-h-56 overflow-y-auto">
            {top_matches.map((m, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-bg-subtle border border-slate-100 hover:border-primary-mid transition-colors">
                <span className="badge bg-primary-light border border-primary-mid text-primary shrink-0 mt-0.5 tabular-nums">{m.score.toFixed(0)}%</span>
                <p className="text-xs text-muted leading-relaxed">{m.sentence}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* Feedback */}
      <div className="card p-5 border-l-4" style={{ borderLeftColor: '#6366f1' }}>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 bg-primary-light rounded-lg flex items-center justify-center">
            <Info size={13} className="text-primary" />
          </div>
          <h3 className="font-display font-semibold text-ink text-sm">Analysis Summary</h3>
        </div>
        <pre className="text-sm text-muted whitespace-pre-wrap font-body leading-relaxed">{feedback}</pre>
      </div>
    </div>
  )
}

function SkillsTab({ data }) {
  const { matching_skills, skill_gap_analysis, signal_noise } = data
  return (
    <div className="space-y-5 animate-fade-up">
      <div className="grid md:grid-cols-2 gap-5">
        <SectionCard title="Matching Skills" icon={CheckCircle} accent="green" badge={`${matching_skills.length} skills`}>
          {matching_skills.length === 0
            ? <p className="text-muted text-sm">No matching skills found.</p>
            : <div className="flex flex-wrap gap-2">{matching_skills.map(s => <SkillBadge key={s} skill={s} variant="match" />)}</div>
          }
        </SectionCard>

        <SectionCard title="Skill Gap Severity" icon={AlertTriangle} accent="amber">
          {skill_gap_analysis.critical.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-1.5 mb-2.5">
                <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                <p className="text-xs font-bold text-red-500 uppercase tracking-wider">Critical</p>
                <span className="text-xs text-muted ml-1">({skill_gap_analysis.critical.length})</span>
              </div>
              <div className="flex flex-wrap gap-1.5">{skill_gap_analysis.critical.map(s => <SkillBadge key={s} skill={s} variant="critical" />)}</div>
            </div>
          )}
          {skill_gap_analysis.important.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-1.5 mb-2.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Important</p>
                <span className="text-xs text-muted ml-1">({skill_gap_analysis.important.length})</span>
              </div>
              <div className="flex flex-wrap gap-1.5">{skill_gap_analysis.important.map(s => <SkillBadge key={s} skill={s} variant="important" />)}</div>
            </div>
          )}
          {skill_gap_analysis.optional.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2.5">
                <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />
                <p className="text-xs font-bold text-blue-500 uppercase tracking-wider">Nice-to-have</p>
                <span className="text-xs text-muted ml-1">({skill_gap_analysis.optional.length})</span>
              </div>
              <div className="flex flex-wrap gap-1.5">{skill_gap_analysis.optional.map(s => <SkillBadge key={s} skill={s} variant="optional" />)}</div>
            </div>
          )}
        </SectionCard>
      </div>

      <SectionCard title="Resume Writing Quality" icon={TrendingUp} accent="violet">
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: 'Clarity Score', value: Math.round(signal_noise.clarity_score), unit: '/100', grad: 'linear-gradient(135deg,#6366f1,#8b5cf6)' },
            { label: 'Strong Verbs',  value: signal_noise.strong_verbs_found.length, unit: ' found', grad: 'linear-gradient(135deg,#10b981,#059669)' },
            { label: 'Quantified',    value: signal_noise.quantified_sentences,      unit: ' lines', grad: 'linear-gradient(135deg,#f59e0b,#d97706)' },
          ].map((s, i) => (
            <div key={i} className="text-center p-4 bg-bg-subtle rounded-2xl border border-slate-100 hover:border-primary-mid transition-colors">
              <div className="font-display font-extrabold text-2xl"
                style={{ background: s.grad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                {s.value}<span className="text-xs font-normal" style={{ WebkitTextFillColor: '#64748b' }}>{s.unit}</span>
              </div>
              <div className="text-xs text-muted mt-1.5 font-medium">{s.label}</div>
            </div>
          ))}
        </div>
        {signal_noise.weak_phrases_found.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-1.5 mb-2.5">
              <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
              <p className="text-xs font-bold text-red-500 uppercase tracking-wider">Weak Phrases to Replace</p>
            </div>
            <div className="flex flex-wrap gap-1.5">{signal_noise.weak_phrases_found.map(p => <SkillBadge key={p} skill={p} variant="critical" />)}</div>
          </div>
        )}
        {signal_noise.strong_verbs_found.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Strong Action Verbs</p>
            </div>
            <div className="flex flex-wrap gap-1.5">{signal_noise.strong_verbs_found.map(v => <SkillBadge key={v} skill={v} variant="match" />)}</div>
          </div>
        )}
      </SectionCard>
    </div>
  )
}

export default function ResultsDashboard({ data, onReset }) {
  const [activeTab, setActiveTab] = useState('overview')
  const aiData = { ...data, jd_text: '' }
  const { semantic_match_score, ats_keyword_score, signal_noise } = data
  const clarity = signal_noise.clarity_score
  const overall = Math.round(semantic_match_score * 0.4 + ats_keyword_score * 0.35 + clarity * 0.25)

  return (
    <div className="min-h-screen bg-bg">
      <TabBar active={activeTab} onChange={setActiveTab} />
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Action row */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={onReset} className="flex items-center gap-2 text-sm btn-ghost group">
            <RefreshCw size={13} className="group-hover:rotate-180 transition-transform duration-300" />
            New Analysis
          </button>
          <div className="flex items-center gap-2.5">
            <span className="text-xs text-muted bg-white border border-slate-200 px-3 py-1.5 rounded-full font-medium">
              {data.total_skills_detected} skills detected
            </span>
            {data.llm_evaluation && (
              <span className="badge bg-primary-light border border-primary-mid text-primary">
                <Brain size={10} /> AI Score: {Math.round(data.llm_evaluation.overall_score)}
              </span>
            )}
            <span className={`badge border font-semibold ${
              overall >= 70 ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
              overall >= 50 ? 'bg-amber-50 border-amber-200 text-amber-700' :
                              'bg-red-50 border-red-200 text-red-600'
            }`}>{overall}% Match</span>
          </div>
        </div>

        {/* Tab panels */}
        <div key={activeTab}>
          {activeTab === 'overview' && <OverviewTab data={data} />}
          {activeTab === 'skills'   && <SkillsTab data={data} />}
          {activeTab === 'ai'       && <div className="animate-fade-up"><LLMInsights llm={data.llm_evaluation} experience={data.experience_info} sectionScores={data.section_scores} /></div>}
          {activeTab === 'jobs'     && <div className="animate-fade-up"><JobRecommendations skills={data.resume_skills} /></div>}
          {activeTab === 'coach'    && <div className="animate-fade-up"><AICoach analysisData={aiData} /></div>}
        </div>
      </div>
    </div>
  )
}
