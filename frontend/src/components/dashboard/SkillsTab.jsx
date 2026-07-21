import React from 'react'
import { Target, CheckCircle, AlertTriangle, TrendingUp, ShieldCheck, FileSearch } from 'lucide-react'
import SkillBadge from '../SkillBadge'
import ATSBreakdown from '../ATSBreakdown'
import KeywordDiff from '../KeywordDiff'
import Card from '../ui/Card'
import Badge from '../ui/Badge'

export function GapsATSTab({ data }) {
  const { matching_skills, skill_gap_analysis, signal_noise, ats_simulation } = data

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:24 }} className="animate-fade-up">

      {/* Section 1: Skill Match & Gap Classification */}
      <div>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
          <div style={{ width:28, height:28, background:'#EEF0FE', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Target size={14} color="#5147E5" />
          </div>
          <h3 style={{ fontWeight:700, fontSize:'1rem', color:'#1A1D2E', margin:0 }}>Skill Match & Gap Classification</h3>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            {/* Matching Skills */}
            <Card padding={20}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
                <div style={{ width:28, height:28, background:'#F0FDF4', border:'1px solid #BBF7D0', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center' }}><CheckCircle size={13} color="#22C55E" /></div>
                <span style={{ fontWeight:700, fontSize:'0.875rem' }}>Matching Skills</span>
                <Badge variant="success" style={{ marginLeft:'auto' }}>{matching_skills.length}</Badge>
              </div>
              {matching_skills.length === 0
                ? <p style={{ color:'#9CA3AF', fontSize:'0.8rem' }}>No matching skills found.</p>
                : <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>{matching_skills.map(s => <SkillBadge key={s} skill={s} variant="match" />)}</div>
              }
            </Card>

            {/* Skill Gap Classification (Critical / Important / Optional) */}
            <Card padding={20}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
                <div style={{ width:28, height:28, background:'#FFFBEB', border:'1px solid #FDE68A', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center' }}><AlertTriangle size={13} color="#F59E0B" /></div>
                <span style={{ fontWeight:700, fontSize:'0.875rem' }}>Skill Gap Classification</span>
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
            </Card>
          </div>

          {/* Resume Writing Quality */}
          <Card padding={20}>
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
          </Card>
        </div>
      </div>

      {/* Section 2: Side-by-Side Keyword Diff */}
      <div>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
          <div style={{ width:28, height:28, background:'#EEF0FE', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <FileSearch size={14} color="#5147E5" />
          </div>
          <h3 style={{ fontWeight:700, fontSize:'1rem', color:'#1A1D2E', margin:0 }}>Side-by-Side Keyword Diff</h3>
        </div>

        <KeywordDiff data={data} />
      </div>

      {/* Section 3: 8-Point ATS Simulation */}
      <div>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
          <div style={{ width:28, height:28, background:'#F0FDF4', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <ShieldCheck size={14} color="#16A34A" />
          </div>
          <h3 style={{ fontWeight:700, fontSize:'1rem', color:'#1A1D2E', margin:0 }}>8-Point ATS Simulation & Evidence Snippets</h3>
        </div>

        <ATSBreakdown atsData={ats_simulation} />
      </div>

    </div>
  )
}

export default GapsATSTab
