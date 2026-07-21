import React from 'react'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts'
import { CheckCircle, AlertTriangle, FileText, Award, Brain, Info } from 'lucide-react'
import ScoreRing from '../ScoreRing'
import Card from '../ui/Card'
import Badge from '../ui/Badge'
import ScoreBar from '../ui/ScoreBar'

const scoreColor = v => v >= 75 ? '#22C55E' : v >= 50 ? '#F59E0B' : '#EF4444'

export function ScoreFitTab({ data }) {
  const {
    semantic_match_score,
    ats_keyword_score,
    signal_noise,
    matching_skills,
    missing_skills,
    top_matches = [],
    feedback,
    llm_evaluation: llm
  } = data

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

  const topImprovements = llm?.top_improvements || []
  const matchReasoning  = llm?.job_match_reasoning || ""

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }} className="animate-fade-up">

      {/* Score row */}
      <Card padding={24} borderTop={`4px solid ${overallC}`}>
        <div style={{ display:'flex', alignItems:'center', gap:32, flexWrap:'wrap' }}>
          <ScoreRing score={overall} label="Overall Match" color={overallC} size={120} />
          <div style={{ flex:1, minWidth:200 }}>
            <p style={{ fontSize:'0.7rem', fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:14 }}>Match Score Breakdown</p>
            <ScoreBar label="Semantic Match" value={semantic_match_score} gradient="linear-gradient(90deg,#5147E5,#8B7CF6)" />
            <ScoreBar label="ATS Keyword Coverage" value={ats_keyword_score} gradient="linear-gradient(90deg,#8B7CF6,#A78BFA)" />
            <ScoreBar label="Resume Clarity" value={clarity} gradient="linear-gradient(90deg,#22C55E,#16A34A)" />
          </div>
          <div style={{ display:'flex', gap:16 }}>
            <ScoreRing score={semantic_match_score} label="Semantic" color="#5147E5" size={96} />
            <ScoreRing score={ats_keyword_score}    label="ATS"      color="#8B7CF6" size={96} />
          </div>
        </div>
      </Card>

      {/* AI Job Match Reasoning */}
      {matchReasoning && (
        <Card padding={20} borderLeft="4px solid #5147E5">
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
            <Brain size={18} color="#5147E5" />
            <h3 style={{ fontWeight:700, color:'#1A1D2E', fontSize:'0.95rem', margin:0 }}>AI Fit Reasoning</h3>
            <Badge variant="accent" style={{ fontSize:'0.62rem', marginLeft:'auto' }}>Llama 3.3-70b</Badge>
          </div>
          <p style={{ fontSize:'0.85rem', color:'#4B5563', lineHeight:1.65, margin:0 }}>{matchReasoning}</p>
        </Card>
      )}

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

      {/* Top Actionable Improvements */}
      {topImprovements.length > 0 && (
        <Card padding={20} borderLeft="4px solid #22C55E">
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
            <div style={{ width:28, height:28, background:'#F0FDF4', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <CheckCircle size={14} color="#22C55E" />
            </div>
            <span style={{ fontWeight:700, fontSize:'0.875rem', color:'#1A1D2E' }}>Top Actionable Improvements</span>
          </div>
          <ol style={{ display:'flex', flexDirection:'column', gap:10, listStyle:'none', margin:0, padding:0 }}>
            {topImprovements.map((item, i) => (
              <li key={i} style={{ display:'flex', alignItems:'flex-start', gap:10, fontSize:'0.83rem', color:'#374151' }}>
                <span style={{ width:20, height:20, borderRadius:'50%', background:'#EEF0FE', color:'#5147E5', fontSize:'0.7rem', fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:1 }}>
                  {i + 1}
                </span>
                {item}
              </li>
            ))}
          </ol>
        </Card>
      )}

      {/* Charts & Top Matches */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        <Card padding={20}>
          <p style={{ fontSize:'0.75rem', fontWeight:700, color:'#374151', marginBottom:12 }}>Performance Radar</p>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#F0F1F5" />
              <PolarAngleAxis dataKey="subject" tick={{ fill:'#9CA3AF', fontSize:11, fontFamily:'Inter' }} />
              <Radar dataKey="A" stroke="#5147E5" fill="#5147E5" fillOpacity={0.1} strokeWidth={2} dot={{ fill:'#5147E5', r:3 }} />
            </RadarChart>
          </ResponsiveContainer>
        </Card>
        <Card padding={20}>
          <p style={{ fontSize:'0.75rem', fontWeight:700, color:'#374151', marginBottom:12 }}>Top Matching Segments</p>
          <div style={{ display:'flex', flexDirection:'column', gap:8, maxHeight:200, overflowY:'auto' }}>
            {top_matches.map((m,i) => (
              <div key={i} style={{ display:'flex', gap:10, padding:'8px 10px', background:'#F8F9FC', borderRadius:8, border:'1px solid #F0F1F5' }}>
                <Badge variant="accent" style={{ flexShrink:0, alignSelf:'flex-start', marginTop:1 }}>{m.score.toFixed(0)}%</Badge>
                <p style={{ fontSize:'0.72rem', color:'#6B7280', lineHeight:1.5 }}>{m.sentence}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Feedback */}
      {feedback && (
        <Card padding={20} borderLeft="4px solid #5147E5">
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
            <div style={{ width:28, height:28, background:'#EEF0FE', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Info size={13} color="#5147E5" />
            </div>
            <span style={{ fontWeight:700, fontSize:'0.875rem', color:'#1A1D2E' }}>Analysis Summary</span>
          </div>
          <pre style={{ fontSize:'0.8rem', color:'#6B7280', whiteSpace:'pre-wrap', fontFamily:'Inter', lineHeight:1.7 }}>{feedback}</pre>
        </Card>
      )}
    </div>
  )
}

export default ScoreFitTab
