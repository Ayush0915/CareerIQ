import React from 'react'
import { BookOpen } from 'lucide-react'
import AccordionSection from './AccordionSection'
import AnalysisHistory from '../AnalysisHistory'

const scoreColor = v => v >= 75 ? '#22C55E' : v >= 50 ? '#F59E0B' : '#EF4444'

export default function ScoreSidebar({ data, activeTab, onTabChange, onSelectAnalysis }) {
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
          onClick={() => onTabChange('resources')}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
            <BookOpen size={14} color="#5147E5" />
            <span style={{ fontSize:'0.72rem', fontWeight:700, color:'#3D34C4' }}>Recommended Resources</span>
          </div>
          <p style={{ fontSize:'0.68rem', color:'#6B7280' }}>{totalGaps} courses curated for your gaps</p>
        </div>
        <AnalysisHistory onSelectAnalysis={onSelectAnalysis} />
      </div>
    </aside>
  )
}
