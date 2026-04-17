import React, { useState } from 'react'
import { MessageSquare, ChevronDown, ChevronUp, Lightbulb, TrendingUp, DollarSign, Users, Star, Zap } from 'lucide-react'

const ANSWER_TIPS = [
  "Use the STAR method: Situation, Task, Action, Result.",
  "Lead with a specific metric or outcome wherever possible.",
  "Keep your answer under 2 minutes — crisp and confident.",
  "Tie your answer back to the job description requirements.",
  "Avoid vague phrases like 'I helped' — say exactly what YOU did.",
]

const QUESTION_TAGS = [
  'Behavioral', 'Technical', 'Situational', 'Culture Fit', 'Leadership', 'Problem Solving'
]

function QuestionCard({ question, index }) {
  const [open, setOpen] = useState(index === 0)
  const tip  = ANSWER_TIPS[index % ANSWER_TIPS.length]
  const tag  = QUESTION_TAGS[index % QUESTION_TAGS.length]

  return (
    <div className="ev-card" style={{ overflow:'hidden', padding:0 }}>
      <button
        onClick={() => setOpen(!open)}
        style={{ width:'100%', display:'flex', alignItems:'flex-start', gap:14, padding:'16px 18px', background:'none', border:'none', cursor:'pointer', textAlign:'left' }}
        onMouseEnter={e => e.currentTarget.style.background='#FAFBFF'}
        onMouseLeave={e => e.currentTarget.style.background='none'}
      >
        {/* Number badge */}
        <div style={{ width:28, height:28, borderRadius:'50%', background:'linear-gradient(135deg,#5147E5,#8B7CF6)', color:'#fff', fontSize:'0.72rem', fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:1 }}>
          {index + 1}
        </div>

        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5 }}>
            <span style={{ fontSize:'0.65rem', fontWeight:700, padding:'2px 8px', borderRadius:99, background:'#EEF0FE', border:'1px solid #D8DCFC', color:'#5147E5' }}>{tag}</span>
          </div>
          <p style={{ fontSize:'0.875rem', fontWeight:600, color:'#1A1D2E', margin:0, lineHeight:1.5 }}>{question}</p>
        </div>

        {open
          ? <ChevronUp size={15} color="#9CA3AF" style={{ flexShrink:0, marginTop:6 }} />
          : <ChevronDown size={15} color="#9CA3AF" style={{ flexShrink:0, marginTop:6 }} />}
      </button>

      {open && (
        <div style={{ padding:'0 18px 16px 60px' }} className="animate-fade-in">
          <div style={{ padding:'10px 14px', background:'#EEF0FE', borderRadius:10, border:'1px solid #D8DCFC', display:'flex', gap:10, alignItems:'flex-start' }}>
            <Lightbulb size={13} color="#5147E5" style={{ flexShrink:0, marginTop:2 }} />
            <p style={{ fontSize:'0.78rem', color:'#3D34C4', margin:0, lineHeight:1.55 }}>
              <strong>Tip:</strong> {tip}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

function InsightCard({ icon: Icon, label, value, color, bg, border }) {
  return (
    <div className="ev-card" style={{ padding:'16px 18px', display:'flex', alignItems:'center', gap:14 }}>
      <div style={{ width:38, height:38, borderRadius:10, background:bg, border:`1px solid ${border}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        <Icon size={16} color={color} />
      </div>
      <div>
        <p style={{ fontSize:'0.68rem', fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.07em', margin:'0 0 3px' }}>{label}</p>
        <p style={{ fontSize:'0.875rem', fontWeight:600, color:'#1A1D2E', margin:0 }}>{value}</p>
      </div>
    </div>
  )
}

export default function InterviewPrep({ llm }) {
  if (!llm) return (
    <div className="ev-card" style={{ padding:40, textAlign:'center' }}>
      <MessageSquare size={32} color="#E8EAF0" style={{ margin:'0 auto 12px', display:'block' }} />
      <p style={{ color:'#9CA3AF', fontSize:'0.875rem' }}>AI analysis required to generate interview questions.</p>
    </div>
  )

  const questions  = llm.interview_questions || []
  const strengths  = llm.resume_strengths    || []
  const salary     = llm.salary_insight
  const competition = llm.competition_level
  const verdict    = llm.fit_verdict

  const compStyle = {
    low:    { color:'#16A34A', bg:'#F0FDF4', border:'#BBF7D0', label:'Low Competition' },
    medium: { color:'#D97706', bg:'#FFFBEB', border:'#FDE68A', label:'Medium Competition' },
    high:   { color:'#DC2626', bg:'#FEF2F2', border:'#FECACA', label:'High Competition' },
  }[competition] || { color:'#6B7280', bg:'#F5F6FA', border:'#E8EAF0', label: competition }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

      {/* Header */}
      <div className="ev-card" style={{ padding:20 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom: (salary || competition || verdict) ? 16 : 0 }}>
          <div style={{ width:36, height:36, background:'linear-gradient(135deg,#5147E5,#8B7CF6)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <MessageSquare size={16} color="#fff" />
          </div>
          <div>
            <h3 style={{ fontWeight:700, fontSize:'0.95rem', color:'#1A1D2E', margin:'0 0 2px' }}>Interview Prep</h3>
            <p style={{ fontSize:'0.72rem', color:'#9CA3AF', margin:0 }}>AI-generated questions tailored to this job + your resume</p>
          </div>
        </div>

        {/* Quick insight pills */}
        {(salary || competition || verdict) && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
            {salary && (
              <InsightCard
                icon={DollarSign} label="Salary Insight" value={salary}
                color="#16A34A" bg="#F0FDF4" border="#BBF7D0"
              />
            )}
            {competition && (
              <InsightCard
                icon={Users} label="Competition"
                value={compStyle.label}
                color={compStyle.color} bg={compStyle.bg} border={compStyle.border}
              />
            )}
            {verdict && verdict !== 'unknown' && (
              <InsightCard
                icon={Zap} label="AI Fit Verdict" value={verdict}
                color="#5147E5" bg="#EEF0FE" border="#D8DCFC"
              />
            )}
          </div>
        )}
      </div>

      {/* Resume Strengths */}
      {strengths.length > 0 && (
        <div className="ev-card" style={{ padding:18 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
            <Star size={15} color="#F59E0B" />
            <span style={{ fontWeight:700, fontSize:'0.875rem', color:'#1A1D2E' }}>Your Resume Strengths</span>
            <span className="ev-badge ev-badge-accent" style={{ fontSize:'0.62rem' }}>{strengths.length} identified</span>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {strengths.map((strength, i) => (
              <div key={i} style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
                <div style={{ width:20, height:20, borderRadius:'50%', background:'#F0FDF4', border:'1px solid #BBF7D0', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:1 }}>
                  <TrendingUp size={10} color="#22C55E" />
                </div>
                <p style={{ fontSize:'0.82rem', color:'#374151', margin:0, lineHeight:1.55 }}>{strength}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Questions */}
      {questions.length > 0 ? (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, padding:'0 2px' }}>
            <MessageSquare size={14} color="#5147E5" />
            <span style={{ fontWeight:700, fontSize:'0.875rem', color:'#1A1D2E' }}>Likely Interview Questions</span>
            <span className="ev-badge ev-badge-accent" style={{ fontSize:'0.62rem' }}>{questions.length} questions</span>
          </div>
          {questions.map((q, i) => (
            <QuestionCard key={i} question={q} index={i} />
          ))}
        </div>
      ) : (
        <div className="ev-card" style={{ padding:32, textAlign:'center' }}>
          <MessageSquare size={28} color="#E8EAF0" style={{ margin:'0 auto 10px', display:'block' }} />
          <p style={{ color:'#9CA3AF', fontSize:'0.875rem', marginBottom:4 }}>No interview questions generated.</p>
          <p style={{ color:'#D1D5DB', fontSize:'0.75rem' }}>This may happen if the AI analysis timed out. Try re-analyzing.</p>
        </div>
      )}
    </div>
  )
}
