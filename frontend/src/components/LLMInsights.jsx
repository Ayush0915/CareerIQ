import React, { useState } from 'react'
import { Brain, TrendingUp, AlertTriangle, CheckCircle, ChevronDown, ChevronUp, User, Zap } from 'lucide-react'
import SkillBadge from './SkillBadge'

function ScoreBar({ label, value, color }) {
  const barColor = color || (value >= 70 ? '#22C55E' : value >= 45 ? '#F59E0B' : '#EF4444')
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
        <span style={{ fontSize:'0.75rem', color:'#6B7280', fontWeight:500 }}>{label}</span>
        <span style={{ fontSize:'0.75rem', fontWeight:700, color:'#374151' }}>{Math.round(value)}%</span>
      </div>
      <div className="ev-progress-track">
        <div className="ev-progress-fill" style={{ width:`${value}%`, background: barColor }} />
      </div>
    </div>
  )
}

function CollapseCard({ title, iconEl, children, defaultOpen = false, accentColor }) {
  const [open, setOpen] = useState(defaultOpen)
  const accent = accentColor || '#5147E5'
  return (
    <div className="ev-card" style={{ overflow:'hidden', padding:0 }}>
      <button
        onClick={() => setOpen(!open)}
        style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 18px', background:'none', border:'none', cursor:'pointer', textAlign:'left' }}
        onMouseEnter={e => e.currentTarget.style.background='#F8F9FC'}
        onMouseLeave={e => e.currentTarget.style.background='none'}
      >
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:28, height:28, borderRadius:8, background:`${accent}18`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            {iconEl}
          </div>
          <span style={{ fontWeight:600, fontSize:'0.875rem', color:'#1A1D2E' }}>{title}</span>
        </div>
        {open
          ? <ChevronUp size={15} color="#9CA3AF" />
          : <ChevronDown size={15} color="#9CA3AF" />
        }
      </button>
      {open && (
        <div style={{ padding:'0 18px 16px' }} className="animate-fade-in">
          {children}
        </div>
      )}
    </div>
  )
}

const LEVEL_STYLE = {
  junior:  { background:'#EFF6FF', border:'1px solid #BFDBFE', color:'#2563EB' },
  mid:     { background:'#FFFBEB', border:'1px solid #FDE68A', color:'#D97706' },
  senior:  { background:'#F0FDF4', border:'1px solid #BBF7D0', color:'#16A34A' },
  unknown: { background:'#F5F6FA', border:'1px solid #E8EAF0', color:'#6B7280' },
}

export default function LLMInsights({ llm, experience }) {
  if (!llm) return null
  const lvlStyle = LEVEL_STYLE[llm.experience_level] || LEVEL_STYLE.unknown

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

      {/* Header Banner */}
      <div className="ev-card" style={{ padding:20, borderLeft:'4px solid #5147E5' }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16 }}>
          <div style={{ flex:1 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
              <Brain size={18} color="#5147E5" />
              <h3 style={{ fontWeight:700, color:'#1A1D2E', fontSize:'0.95rem', margin:0 }}>AI Master Evaluation</h3>
              <span className="ev-badge ev-badge-accent" style={{ fontSize:'0.62rem' }}>Llama 3.3-70b</span>
            </div>
            <p style={{ fontSize:'0.82rem', color:'#6B7280', lineHeight:1.65, margin:0 }}>{llm.job_match_reasoning}</p>
          </div>
          <div style={{ textAlign:'center', flexShrink:0 }}>
            <div style={{ fontSize:'2.2rem', fontWeight:800, color: llm.overall_score >= 70 ? '#22C55E' : llm.overall_score >= 50 ? '#F59E0B' : '#EF4444', lineHeight:1 }}>
              {Math.round(llm.overall_score)}
            </div>
            <div style={{ fontSize:'0.68rem', color:'#9CA3AF', marginTop:2 }}>AI Score</div>
          </div>
        </div>
      </div>

      {/* Metric Grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:10 }}>
        {[
          { label:'Level', value: <span style={{ fontSize:'0.75rem', fontWeight:700, padding:'3px 10px', borderRadius:99, display:'inline-block', ...lvlStyle, textTransform:'capitalize' }}>{llm.experience_level}</span>, icon: <User size={14} color="#5147E5" /> },
          { label:'Experience', value: <span style={{ fontSize:'1.4rem', fontWeight:800, color:'#1A1D2E' }}>{llm.years_detected}</span>, icon: null },
          { label:'ATS Compat.', value: <span style={{ fontSize:'1.4rem', fontWeight:800, color:'#3B82F6' }}>{Math.round(llm.ats_compatibility)}%</span>, icon: null },
          { label:'Readability', value: <span style={{ fontSize:'1.4rem', fontWeight:800, color:'#5147E5' }}>{Math.round(llm.readability_score)}%</span>, icon: null },
        ].map((m, i) => (
          <div key={i} className="ev-card" style={{ padding:'14px 10px', textAlign:'center' }}>
            {m.icon && <div style={{ marginBottom:4 }}>{m.icon}</div>}
            <div>{m.value}</div>
            <div style={{ fontSize:'0.68rem', color:'#9CA3AF', marginTop:3 }}>{m.label}</div>
          </div>
        ))}
      </div>

      {/* Section Scores */}
      <CollapseCard
        title="Section-by-Section Scores"
        iconEl={<TrendingUp size={13} color="#5147E5" />}
        defaultOpen={true}
      >
        <div style={{ paddingTop:8 }}>
          <ScoreBar label="Experience" value={llm.section_scores.experience} color="#22C55E" />
          <ScoreBar label="Skills"     value={llm.section_scores.skills}     color="#3B82F6" />
          <ScoreBar label="Projects"   value={llm.section_scores.projects}   color="#8B5CF6" />
          <ScoreBar label="Education"  value={llm.section_scores.education}  color="#F59E0B" />
          <ScoreBar label="Summary"    value={llm.section_scores.summary}    color="#EC4899" />
        </div>
        {Object.keys(llm.section_feedback || {}).length > 0 && (
          <div style={{ marginTop:14, display:'flex', flexDirection:'column', gap:8 }}>
            {Object.entries(llm.section_feedback).map(([section, feedback]) => (
              <div key={section} style={{ display:'flex', gap:10, fontSize:'0.78rem' }}>
                <span style={{ color:'#9CA3AF', textTransform:'uppercase', fontWeight:700, fontSize:'0.65rem', flexShrink:0, width:72, paddingTop:2 }}>{section}</span>
                <span style={{ color:'#6B7280', lineHeight:1.55 }}>{feedback}</span>
              </div>
            ))}
          </div>
        )}
      </CollapseCard>

      {/* Top Improvements */}
      <CollapseCard
        title="Top Improvements"
        iconEl={<CheckCircle size={13} color="#22C55E" />}
        defaultOpen={true}
        accentColor="#22C55E"
      >
        <ol style={{ paddingTop:8, display:'flex', flexDirection:'column', gap:10, listStyle:'none', margin:0, padding:'8px 0 0 0' }}>
          {(llm.top_improvements || []).map((item, i) => (
            <li key={i} style={{ display:'flex', alignItems:'flex-start', gap:10, fontSize:'0.83rem', color:'#374151' }}>
              <span style={{ width:20, height:20, borderRadius:'50%', background:'#EEF0FE', color:'#5147E5', fontSize:'0.7rem', fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:1 }}>
                {i + 1}
              </span>
              {item}
            </li>
          ))}
        </ol>
      </CollapseCard>

      {/* Keyword Analysis */}
      <CollapseCard
        title="AI Keyword Analysis"
        iconEl={<Brain size={13} color="#3B82F6" />}
        accentColor="#3B82F6"
      >
        <div style={{ paddingTop:8, display:'flex', flexDirection:'column', gap:14 }}>
          {(llm.keyword_analysis?.present || []).length > 0 && (
            <div>
              <p style={{ fontSize:'0.68rem', fontWeight:700, color:'#16A34A', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8 }}>Present</p>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {llm.keyword_analysis.present.map(s => <SkillBadge key={s} skill={s} variant="match" />)}
              </div>
            </div>
          )}
          {(llm.keyword_analysis?.missing_critical || []).length > 0 && (
            <div>
              <p style={{ fontSize:'0.68rem', fontWeight:700, color:'#DC2626', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8 }}>Critical Missing</p>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {llm.keyword_analysis.missing_critical.map(s => <SkillBadge key={s} skill={s} variant="critical" />)}
              </div>
            </div>
          )}
          {(llm.keyword_analysis?.missing_recommended || []).length > 0 && (
            <div>
              <p style={{ fontSize:'0.68rem', fontWeight:700, color:'#D97706', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8 }}>Recommended</p>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {llm.keyword_analysis.missing_recommended.map(s => <SkillBadge key={s} skill={s} variant="important" />)}
              </div>
            </div>
          )}
        </div>
      </CollapseCard>

      {/* Writing Issues */}
      {((llm.grammar_issues || []).length > 0 || (llm.cliches_found || []).length > 0) && (
        <CollapseCard
          title="Writing Issues Detected"
          iconEl={<AlertTriangle size={13} color="#F59E0B" />}
          accentColor="#F59E0B"
        >
          <div style={{ paddingTop:8, display:'flex', flexDirection:'column', gap:14 }}>
            {(llm.grammar_issues || []).length > 0 && (
              <div>
                <p style={{ fontSize:'0.68rem', fontWeight:700, color:'#DC2626', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8 }}>Grammar Issues</p>
                <ul style={{ margin:0, padding:0, listStyle:'none', display:'flex', flexDirection:'column', gap:6 }}>
                  {llm.grammar_issues.map((issue, i) => (
                    <li key={i} style={{ fontSize:'0.82rem', color:'#6B7280', display:'flex', gap:8, alignItems:'flex-start' }}>
                      <span style={{ color:'#EF4444', marginTop:2 }}>•</span> {issue}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {(llm.cliches_found || []).length > 0 && (
              <div>
                <p style={{ fontSize:'0.68rem', fontWeight:700, color:'#D97706', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8 }}>Cliches Found</p>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  {llm.cliches_found.map(c => <SkillBadge key={c} skill={c} variant="important" />)}
                </div>
              </div>
            )}
          </div>
        </CollapseCard>
      )}

      {/* Experience Match */}
      {experience && (
        <div className="ev-card" style={{ padding:16, borderLeft: `4px solid ${experience.meets_requirement ? '#22C55E' : '#EF4444'}` }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
            <User size={14} color={experience.meets_requirement ? '#22C55E' : '#EF4444'} />
            <span style={{ fontWeight:600, fontSize:'0.875rem', color:'#1A1D2E' }}>Experience Match</span>
          </div>
          <p style={{ fontSize:'0.82rem', color:'#6B7280', margin:0 }}>
            {experience.meets_requirement
              ? `Your ~${experience.detected_years} years meets the JD requirement of ${experience.required_years}+ years.`
              : `JD requires ${experience.required_years}+ years, resume shows ~${experience.detected_years} years (${experience.gap_years} year gap).`
            }
          </p>
        </div>
      )}

      {/* Extra LLM fields if present */}
      {llm.fit_verdict && (
        <div className="ev-card" style={{ padding:16, background:'#EEF0FE', border:'1px solid #D8DCFC' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
            <Zap size={14} color="#5147E5" />
            <span style={{ fontWeight:700, fontSize:'0.82rem', color:'#5147E5' }}>AI Fit Verdict</span>
          </div>
          <p style={{ fontSize:'0.82rem', color:'#374151', margin:0 }}>{llm.fit_verdict}</p>
        </div>
      )}
    </div>
  )
}
