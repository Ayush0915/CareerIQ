import React, { useState } from 'react'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts'
import {
  TrendingUp, Target, AlertTriangle, CheckCircle, Info,
  Brain, Briefcase, BarChart3, RefreshCw, Award, FileText,
  BookOpen, ChevronDown, ChevronUp, Zap, CheckCircle2
} from 'lucide-react'
import ScoreRing from './ScoreRing'
import SkillBadge from './SkillBadge'
import LLMInsights from './LLMInsights'
import JobRecommendations from './JobRecommendations'
import CourseRecommendations from './CourseRecommendations'
import ATSBreakdown from './ATSBreakdown'
import InterviewPrep from './InterviewPrep'
import { ShieldCheck, MessageSquare } from 'lucide-react'

const TABS = [
  { id:'overview',   label:'Overview',    icon:BarChart3     },
  { id:'skills',     label:'Skills',      icon:Target        },
  { id:'ai',         label:'AI Analysis', icon:Brain         },
  { id:'ats',        label:'ATS Report',  icon:ShieldCheck   },
  { id:'interview',  label:'Interview',   icon:MessageSquare },
  { id:'jobs',       label:'Live Jobs',   icon:Briefcase     },
  { id:'courses',    label:'Courses',     icon:BookOpen      },
]

/* ── helpers ── */
const scoreColor = v => v >= 75 ? '#22C55E' : v >= 50 ? '#F59E0B' : '#EF4444'
const scoreBg    = v => v >= 75 ? '#F0FDF4' : v >= 50 ? '#FFFBEB' : '#FEF2F2'
const scoreText  = v => v >= 75 ? '#16A34A' : v >= 50 ? '#D97706' : '#DC2626'

function AccordionSection({ label, pct, items, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="accordion-section">
      <div className="accordion-header" onClick={() => setOpen(o => !o)}>
        <span className="accordion-label">{label}</span>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <span className="accordion-pct" style={{ background:scoreBg(pct), color:scoreText(pct) }}>{Math.round(pct)}%</span>
          {open ? <ChevronUp size={13} color="#9CA3AF" /> : <ChevronDown size={13} color="#9CA3AF" />}
        </div>
      </div>
      {open && (
        <div className="accordion-body animate-fade-in">
          {items.map((item, i) => (
            <div key={i} className="accordion-item">
              {item.status === 'ok'
                ? <CheckCircle2 size={14} color="#22C55E" className="accordion-item-icon" />
                : item.status === 'warn'
                ? <AlertTriangle size={14} color="#F59E0B" className="accordion-item-icon" />
                : <AlertTriangle size={14} color="#EF4444" className="accordion-item-icon" />
              }
              <span className="accordion-item-label">{item.label}</span>
              <span className={`accordion-item-tag ${item.status === 'issue' ? 'issue' : item.status === 'warn' ? 'warn' : ''}`}>
                {item.note}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ScoreSidebar({ data, activeTab, onTabChange }) {
  const { semantic_match_score, ats_keyword_score, signal_noise, skill_gap_analysis, matching_skills, missing_skills, llm_evaluation: llm } = data

  const clarity    = signal_noise?.clarity_score ?? 0
  const overall    = Math.round(semantic_match_score * 0.4 + ats_keyword_score * 0.35 + clarity * 0.25)
  const totalGaps  = (skill_gap_analysis?.critical?.length ?? 0) + (skill_gap_analysis?.important?.length ?? 0) + (skill_gap_analysis?.optional?.length ?? 0)

  const contentPct = Math.round(
    ((signal_noise?.quantified_sentences > 2 ? 25 : 10) +
     (signal_noise?.weak_phrases_found?.length === 0 ? 25 : 5) +
     (signal_noise?.strong_verbs_found?.length > 3 ? 25 : 10) +
     (llm?.grammar_issues?.length === 0 ? 25 : 10))
  )
  const skillsPct  = matching_skills.length + missing_skills.length > 0
    ? Math.round((matching_skills.length / (matching_skills.length + missing_skills.length)) * 100)
    : 0
  const atsPct     = Math.round(ats_keyword_score)
  const aiPct      = llm ? Math.round(llm.overall_score) : 0

  const sectionItems = [
    { label:'Experience',   status: llm?.section_scores?.experience >= 70 ? 'ok' : 'warn', note: llm ? `${Math.round(llm.section_scores?.experience ?? 0)}%` : 'N/A' },
    { label:'Skills',       status: llm?.section_scores?.skills >= 70 ? 'ok' : 'warn',      note: llm ? `${Math.round(llm.section_scores?.skills ?? 0)}%` : 'N/A' },
    { label:'Education',    status: llm?.section_scores?.education >= 60 ? 'ok' : 'warn',   note: llm ? `${Math.round(llm.section_scores?.education ?? 0)}%` : 'N/A' },
    { label:'Projects',     status: llm?.section_scores?.projects >= 60 ? 'ok' : 'warn',    note: llm ? `${Math.round(llm.section_scores?.projects ?? 0)}%` : 'N/A' },
    { label:'Summary',      status: llm?.section_scores?.summary >= 60 ? 'ok' : 'warn',     note: llm ? `${Math.round(llm.section_scores?.summary ?? 0)}%` : 'N/A' },
  ]

  return (
    <aside className="score-sidebar">
      {/* Score number */}
      <div style={{ padding:'20px 20px 16px', textAlign:'center' }}>
        <p style={{ fontSize:'0.68rem', fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>Your Score</p>
        <div>
          <span style={{ fontSize:'2.8rem', fontWeight:800, color:scoreColor(overall), fontVariantNumeric:'tabular-nums' }}>{overall}</span>
          <span style={{ fontSize:'1.2rem', color:'#9CA3AF', fontWeight:600 }}>/100</span>
        </div>
        <p style={{ fontSize:'0.72rem', color:'#9CA3AF', marginTop:2 }}>{totalGaps} gaps to close</p>
      </div>

      <div className="ev-divider" />

      {/* Accordion sections */}
      <AccordionSection label="Content" pct={contentPct} defaultOpen items={[
        { label:'ATS Parse Rate',    status:'ok',   note:'No issues' },
        { label:'Quantified Impact', status: signal_noise?.quantified_sentences > 2 ? 'ok' : 'warn', note:`${signal_noise?.quantified_sentences ?? 0} found` },
        { label:'Weak Phrases',      status: (signal_noise?.weak_phrases_found?.length ?? 0) === 0 ? 'ok' : 'issue', note: (signal_noise?.weak_phrases_found?.length ?? 0) === 0 ? 'None found' : `${signal_noise.weak_phrases_found.length} found` },
        { label:'Strong Verbs',      status: (signal_noise?.strong_verbs_found?.length ?? 0) > 3 ? 'ok' : 'warn', note:`${signal_noise?.strong_verbs_found?.length ?? 0} found` },
        { label:'Grammar',           status: (llm?.grammar_issues?.length ?? 0) === 0 ? 'ok' : 'warn', note: (llm?.grammar_issues?.length ?? 0) === 0 ? 'No issues' : `${llm.grammar_issues.length} issues` },
      ]} />
      <div className="ev-divider" />

      <AccordionSection label="Sections" pct={aiPct > 0 ? Math.round((sectionItems.filter(s=>s.status==='ok').length/sectionItems.length)*100) : 0} items={sectionItems} />
      <div className="ev-divider" />

      <AccordionSection label="ATS Essentials" pct={atsPct} items={[
        { label:'Keyword Coverage', status: ats_keyword_score >= 70 ? 'ok' : ats_keyword_score >= 40 ? 'warn' : 'issue', note:`${Math.round(ats_keyword_score)}%` },
        { label:'Semantic Match',   status: semantic_match_score >= 70 ? 'ok' : 'warn', note:`${Math.round(semantic_match_score)}%` },
        { label:'Contact Info',     status:'ok', note:'Detected' },
        { label:'ATS Compatibility',status: llm?.ats_compatibility >= 70 ? 'ok' : 'warn', note: llm ? `${Math.round(llm.ats_compatibility)}%` : 'N/A' },
      ]} />
      <div className="ev-divider" />

      <AccordionSection label="Skill Gaps" pct={skillsPct} items={[
        { label:'Matching Skills',  status:'ok',   note:`${matching_skills.length} matched` },
        { label:'Critical Gaps',    status: (skill_gap_analysis?.critical?.length ?? 0) === 0 ? 'ok' : 'issue', note:`${skill_gap_analysis?.critical?.length ?? 0} gaps` },
        { label:'Important Gaps',   status: (skill_gap_analysis?.important?.length ?? 0) === 0 ? 'ok' : 'warn', note:`${skill_gap_analysis?.important?.length ?? 0} gaps` },
        { label:'Optional Gaps',    status:'warn', note:`${skill_gap_analysis?.optional?.length ?? 0} gaps` },
      ]} />
      <div className="ev-divider" />

      {/* Courses teaser */}
      <div style={{ padding:'14px 20px' }}>
        <div style={{ background:'#EEF0FE', border:'1px solid #D8DCFC', borderRadius:10, padding:'12px 14px', cursor:'pointer' }}
          onClick={() => onTabChange('courses')}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
            <BookOpen size={14} color="#5147E5" />
            <span style={{ fontSize:'0.72rem', fontWeight:700, color:'#3D34C4' }}>Recommended Courses</span>
          </div>
          <p style={{ fontSize:'0.68rem', color:'#6B7280' }}>{totalGaps} courses curated for your gaps</p>
        </div>
      </div>
    </aside>
  )
}

/* ── Overview Tab ── */
function OverviewTab({ data }) {
  const { semantic_match_score, ats_keyword_score, signal_noise, matching_skills, missing_skills, top_matches, feedback } = data
  const clarity = signal_noise?.clarity_score ?? 0
  const overall = Math.round(semantic_match_score * 0.4 + ats_keyword_score * 0.35 + clarity * 0.25)
  const overallC = scoreColor(overall)

  const radarData = [
    { subject:'Semantic', A:semantic_match_score },
    { subject:'ATS',      A:ats_keyword_score    },
    { subject:'Clarity',  A:clarity              },
    { subject:'Verbs',    A:Math.min(100,(signal_noise?.strong_verbs_found?.length??0)*12) },
    { subject:'Quant',    A:Math.min(100,(signal_noise?.quantified_sentences??0)*20) },
  ]

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }} className="animate-fade-up">
      {/* Score row */}
      <div className="ev-card" style={{ padding:24, borderTop:`4px solid ${overallC}` }}>
        <div style={{ display:'flex', alignItems:'center', gap:32, flexWrap:'wrap' }}>
          <ScoreRing score={overall} label="Overall Match" color={overallC} size={120} />
          <div style={{ flex:1, minWidth:200 }}>
            <p style={{ fontSize:'0.7rem', fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:14 }}>Score Breakdown</p>
            {[
              { label:'Semantic Match',       val:semantic_match_score, g:'linear-gradient(90deg,#5147E5,#8B7CF6)' },
              { label:'ATS Keyword Coverage', val:ats_keyword_score,    g:'linear-gradient(90deg,#8B7CF6,#A78BFA)' },
              { label:'Resume Clarity',       val:clarity,              g:'linear-gradient(90deg,#22C55E,#16A34A)' },
            ].map((s,i) => (
              <div key={i} style={{ marginBottom:12 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                  <span style={{ fontSize:'0.75rem', color:'#6B7280' }}>{s.label}</span>
                  <span style={{ fontSize:'0.75rem', fontWeight:700, color:'#1A1D2E', fontVariantNumeric:'tabular-nums' }}>{Math.round(s.val)}%</span>
                </div>
                <div className="ev-progress-track">
                  <div className="ev-progress-fill" style={{ width:`${s.val}%`, background:s.g }} />
                </div>
              </div>
            ))}
          </div>
          <div style={{ display:'flex', gap:16 }}>
            <ScoreRing score={semantic_match_score} label="Semantic" color="#5147E5" size={96} />
            <ScoreRing score={ats_keyword_score}    label="ATS"      color="#8B7CF6" size={96} />
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
        {[
          { label:'Matching Skills',  val:matching_skills.length,            g:'linear-gradient(135deg,#22C55E,#16A34A)', icon:CheckCircle },
          { label:'Skill Gaps',       val:missing_skills.length,             g:'linear-gradient(135deg,#EF4444,#DC2626)', icon:AlertTriangle },
          { label:'Clarity Score',    val:Math.round(clarity), unit:'/100',  g:'linear-gradient(135deg,#5147E5,#8B7CF6)', icon:FileText },
          { label:'Quantified Lines', val:signal_noise?.quantified_sentences??0, g:'linear-gradient(135deg,#F59E0B,#D97706)', icon:Award },
        ].map((m,i) => (
          <div key={i} className="metric-card">
            <p style={{ fontSize:'0.65rem', fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:8 }}>{m.label}</p>
            <div style={{ display:'flex', alignItems:'baseline', gap:2 }}>
              <span style={{ fontSize:'2rem', fontWeight:800, background:m.g, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', fontVariantNumeric:'tabular-nums' }}>{m.val}</span>
              {m.unit && <span style={{ fontSize:'0.8rem', color:'#9CA3AF' }}>{m.unit}</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        <div className="ev-card" style={{ padding:20 }}>
          <p style={{ fontSize:'0.75rem', fontWeight:700, color:'#374151', marginBottom:12 }}>Performance Radar</p>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#F0F1F5" />
              <PolarAngleAxis dataKey="subject" tick={{ fill:'#9CA3AF', fontSize:11, fontFamily:'Inter' }} />
              <Radar dataKey="A" stroke="#5147E5" fill="#5147E5" fillOpacity={0.1} strokeWidth={2} dot={{ fill:'#5147E5', r:3 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <div className="ev-card" style={{ padding:20 }}>
          <p style={{ fontSize:'0.75rem', fontWeight:700, color:'#374151', marginBottom:12 }}>Top Matching Segments</p>
          <div style={{ display:'flex', flexDirection:'column', gap:8, maxHeight:200, overflowY:'auto' }}>
            {top_matches.map((m,i) => (
              <div key={i} style={{ display:'flex', gap:10, padding:'8px 10px', background:'#F8F9FC', borderRadius:8, border:'1px solid #F0F1F5' }}>
                <span className="ev-badge ev-badge-accent" style={{ flexShrink:0, alignSelf:'flex-start', marginTop:1 }}>{m.score.toFixed(0)}%</span>
                <p style={{ fontSize:'0.72rem', color:'#6B7280', lineHeight:1.5 }}>{m.sentence}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Feedback */}
      <div className="ev-card" style={{ padding:20, borderLeft:'4px solid #5147E5' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
          <div style={{ width:28, height:28, background:'#EEF0FE', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Info size={13} color="#5147E5" />
          </div>
          <span style={{ fontWeight:700, fontSize:'0.875rem', color:'#1A1D2E' }}>Analysis Summary</span>
        </div>
        <pre style={{ fontSize:'0.8rem', color:'#6B7280', whiteSpace:'pre-wrap', fontFamily:'Inter', lineHeight:1.7 }}>{feedback}</pre>
      </div>
    </div>
  )
}

/* ── Skills Tab ── */
function SkillsTab({ data }) {
  const { matching_skills, skill_gap_analysis, signal_noise } = data
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }} className="animate-fade-up">
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        <div className="ev-card" style={{ padding:20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
            <div style={{ width:28, height:28, background:'#F0FDF4', border:'1px solid #BBF7D0', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center' }}><CheckCircle size={13} color="#22C55E" /></div>
            <span style={{ fontWeight:700, fontSize:'0.875rem' }}>Matching Skills</span>
            <span className="ev-badge ev-badge-success" style={{ marginLeft:'auto' }}>{matching_skills.length}</span>
          </div>
          {matching_skills.length === 0
            ? <p style={{ color:'#9CA3AF', fontSize:'0.8rem' }}>No matching skills found.</p>
            : <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>{matching_skills.map(s => <SkillBadge key={s} skill={s} variant="match" />)}</div>
          }
        </div>
        <div className="ev-card" style={{ padding:20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
            <div style={{ width:28, height:28, background:'#FFFBEB', border:'1px solid #FDE68A', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center' }}><AlertTriangle size={13} color="#F59E0B" /></div>
            <span style={{ fontWeight:700, fontSize:'0.875rem' }}>Skill Gaps</span>
          </div>
          {['critical','important','optional'].map(level => {
            const skills = skill_gap_analysis?.[level] ?? []
            if (skills.length === 0) return null
            const cfg = { critical:{c:'#EF4444',bg:'#FEF2F2',border:'#FECACA',label:'Critical'}, important:{c:'#D97706',bg:'#FFFBEB',border:'#FDE68A',label:'Important'}, optional:{c:'#5147E5',bg:'#EEF0FE',border:'#D8DCFC',label:'Optional'} }[level]
            return (
              <div key={level} style={{ marginBottom:12 }}>
                <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:6 }}>
                  <span style={{ width:7, height:7, borderRadius:'50%', background:cfg.c, display:'inline-block' }} />
                  <span style={{ fontSize:'0.65rem', fontWeight:700, color:cfg.c, textTransform:'uppercase', letterSpacing:'0.07em' }}>{cfg.label}</span>
                  <span style={{ fontSize:'0.65rem', color:'#9CA3AF' }}>({skills.length})</span>
                </div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
                  {skills.map(s => <SkillBadge key={s} skill={s} variant={level === 'critical' ? 'critical' : level === 'important' ? 'important' : 'optional'} />)}
                </div>
              </div>
            )
          })}
        </div>
      </div>
      <div className="ev-card" style={{ padding:20 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
          <div style={{ width:28, height:28, background:'#EEF0FE', border:'1px solid #D8DCFC', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center' }}><TrendingUp size={13} color="#5147E5" /></div>
          <span style={{ fontWeight:700, fontSize:'0.875rem' }}>Resume Writing Quality</span>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:16 }}>
          {[
            { label:'Clarity', val:Math.round(signal_noise?.clarity_score??0), unit:'/100', g:'linear-gradient(135deg,#5147E5,#8B7CF6)' },
            { label:'Strong Verbs', val:signal_noise?.strong_verbs_found?.length??0, unit:' found', g:'linear-gradient(135deg,#22C55E,#16A34A)' },
            { label:'Quantified', val:signal_noise?.quantified_sentences??0, unit:' lines', g:'linear-gradient(135deg,#F59E0B,#D97706)' },
          ].map((s,i) => (
            <div key={i} style={{ textAlign:'center', padding:14, background:'#F8F9FC', borderRadius:10, border:'1px solid #F0F1F5' }}>
              <div style={{ fontSize:'1.8rem', fontWeight:800, background:s.g, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
                {s.val}<span style={{ fontSize:'0.75rem', WebkitTextFillColor:'#9CA3AF', fontWeight:400 }}>{s.unit}</span>
              </div>
              <p style={{ fontSize:'0.68rem', color:'#9CA3AF', marginTop:4 }}>{s.label}</p>
            </div>
          ))}
        </div>
        {(signal_noise?.weak_phrases_found?.length ?? 0) > 0 && (
          <div style={{ marginBottom:12 }}>
            <p style={{ fontSize:'0.68rem', fontWeight:700, color:'#EF4444', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:6 }}>Weak Phrases to Replace</p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>{signal_noise.weak_phrases_found.map(p => <SkillBadge key={p} skill={p} variant="critical" />)}</div>
          </div>
        )}
        {(signal_noise?.strong_verbs_found?.length ?? 0) > 0 && (
          <div>
            <p style={{ fontSize:'0.68rem', fontWeight:700, color:'#22C55E', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:6 }}>Strong Action Verbs</p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>{signal_noise.strong_verbs_found.map(v => <SkillBadge key={v} skill={v} variant="match" />)}</div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Root ── */
export default function ResultsDashboard({ data, onReset }) {
  const [activeTab, setActiveTab] = useState('overview')
  const { semantic_match_score, ats_keyword_score, signal_noise, skill_gap_analysis } = data
  const clarity = signal_noise?.clarity_score ?? 0
  const overall = Math.round(semantic_match_score * 0.4 + ats_keyword_score * 0.35 + clarity * 0.25)
  const totalGaps = (skill_gap_analysis?.critical?.length??0)+(skill_gap_analysis?.important?.length??0)+(skill_gap_analysis?.optional?.length??0)

  return (
    <div style={{ minHeight:'100vh', background:'#F5F6FA', paddingTop:60 }}>
      {/* ── Full-width sticky tab bar ── */}
      <div style={{ position:'sticky', top:60, zIndex:40, background:'rgba(255,255,255,0.97)', borderBottom:'1px solid #E8EAF0', backdropFilter:'blur(12px)', boxShadow:'0 1px 6px rgba(0,0,0,0.04)' }}>
        <div style={{ maxWidth:1280, margin:'0 auto', padding:'0 24px', display:'flex', alignItems:'center', justifyContent:'space-between', height:52 }}>
          <div style={{ overflowX:'auto' }}>
            <div className="ev-tabs">
              {TABS.map(tab => (
                <button key={tab.id} className={`ev-tab ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
                  <tab.icon size={13} />
                  {tab.label}
                  {tab.id === 'courses' && totalGaps > 0 && (
                    <span style={{ fontSize:'0.62rem', fontWeight:700, background: activeTab==='courses'?'#5147E5':'#EEF0FE', color: activeTab==='courses'?'#fff':'#5147E5', borderRadius:99, padding:'1px 6px' }}>{totalGaps}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0, marginLeft:16 }}>
            <span style={{ fontSize:'0.72rem', color:'#9CA3AF', background:'#F5F6FA', border:'1px solid #E8EAF0', padding:'4px 10px', borderRadius:99 }}>
              {data.total_skills_detected} skills detected
            </span>
            <span style={{ fontSize:'0.72rem', fontWeight:700, padding:'4px 10px', borderRadius:99, background:scoreColor(overall)+'18', color:scoreColor(overall) }}>
              {overall}% Match
            </span>
            <button onClick={onReset} className="btn-ghost" style={{ fontSize:'0.75rem', padding:'4px 10px' }}>
              <RefreshCw size={12} /> New Analysis
            </button>
          </div>
        </div>
      </div>

      {/* ── Two-column layout ── */}
      <div style={{ maxWidth:1280, margin:'0 auto', display:'flex' }}>
        <ScoreSidebar data={data} activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Right content */}
        <div style={{ flex:1, minWidth:0, padding:'24px 24px 48px' }}>
          <div key={activeTab}>
            {activeTab === 'overview' && <OverviewTab data={data} />}
            {activeTab === 'skills'   && <SkillsTab data={data} />}
            {activeTab === 'ai'        && <div className="animate-fade-up"><LLMInsights llm={data.llm_evaluation} experience={data.experience_info} sectionScores={data.section_scores} /></div>}
            {activeTab === 'ats'       && <div className="animate-fade-up"><ATSBreakdown atsData={data.ats_simulation} /></div>}
            {activeTab === 'interview' && <div className="animate-fade-up"><InterviewPrep llm={data.llm_evaluation} /></div>}
            {activeTab === 'jobs'     && <div className="animate-fade-up"><JobRecommendations skills={data.resume_skills} /></div>}
            {activeTab === 'courses'  && <div className="animate-fade-up"><CourseRecommendations skillGaps={data.skill_gap_analysis} /></div>}
          </div>
        </div>
      </div>
    </div>
  )
}
