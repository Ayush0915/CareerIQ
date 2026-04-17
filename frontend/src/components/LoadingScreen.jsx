import React, { useEffect, useState } from 'react'
import { SemiCircleGauge } from './ScoreRing'

const STEPS = [
  { label: 'Parsing your resume',         detail: 'Extracting text & structure'      },
  { label: 'Analyzing your experience',   detail: 'Detecting years & seniority level' },
  { label: 'Extracting your skills',      detail: 'Matching against 2,000+ skills'    },
  { label: 'Running semantic analysis',   detail: 'BERT embeddings vs job description' },
  { label: 'Generating AI insights',      detail: 'Llama 3.3-70b deep evaluation'     },
]

const CATEGORIES = ['Content', 'Sections', 'ATS Essentials', 'Skill Gaps']

function HexCheck({ status }) {
  // status: 'done' | 'active' | 'pending'
  if (status === 'done') return (
    <svg width="28" height="28" viewBox="0 0 28 28">
      <polygon points="14,2 25,8 25,20 14,26 3,20 3,8" fill="#5147E5" stroke="none" />
      <polyline points="9,14 12.5,18 19,11" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
  if (status === 'active') return (
    <svg width="28" height="28" viewBox="0 0 28 28" style={{ animation:'spinRing 1.2s linear infinite', transformOrigin:'14px 14px' }}>
      <polygon points="14,2 25,8 25,20 14,26 3,20 3,8" fill="none" stroke="#5147E5" strokeWidth="2" />
      <circle cx="14" cy="14" r="4" fill="#5147E5" />
    </svg>
  )
  return (
    <svg width="28" height="28" viewBox="0 0 28 28">
      <polygon points="14,2 25,8 25,20 14,26 3,20 3,8" fill="none" stroke="#E8EAF0" strokeWidth="2" />
    </svg>
  )
}

export default function LoadingScreen({ progress }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => { const t = setTimeout(() => setVisible(true), 40); return () => clearTimeout(t) }, [])

  const stepIndex = Math.min(Math.floor((progress / 100) * STEPS.length), STEPS.length - 1)
  const catProgress = Math.floor((progress / 100) * (CATEGORIES.length + 1))

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background:'#F5F6FA', opacity: visible ? 1 : 0, transition:'opacity 0.4s ease' }}
    >
      <div className="w-full max-w-3xl mx-auto px-4 flex gap-4" style={{ height: 480 }}>

        {/* ── LEFT: Score card + categories ─────────────────── */}
        <div className="ev-card flex flex-col items-center p-6 scan-container" style={{ width: 260, flexShrink: 0 }}>
          <div className="scan-line" />

          <p style={{ fontSize:'0.7rem', fontWeight:'700', color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom: 8 }}>
            Your Score
          </p>

          <SemiCircleGauge score={progress} size={200} animate />

          <div style={{ marginTop: 16, width:'100%' }}>
            {CATEGORIES.map((cat, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 0', borderBottom: i < CATEGORIES.length - 1 ? '1px solid #F0F1F5' : 'none' }}>
                <span style={{ fontSize:'0.68rem', fontWeight:'700', color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.07em' }}>{cat}</span>
                {i < catProgress ? (
                  <span className="ev-badge ev-badge-accent" style={{ fontSize:'0.65rem' }}>
                    {[88, 100, 74, 60][i]}%
                  </span>
                ) : (
                  <div className="skeleton-box" style={{ width: 44, height: 20, borderRadius: 99 }} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT: Step checklist ─────────────────────────── */}
        <div className="ev-card flex-1 p-8"
          style={{ background:'linear-gradient(145deg, #EEF0FE 0%, #F5F3FF 100%)', border:'1px solid #D8DCFC' }}>
          <p style={{ fontSize:'0.8rem', fontWeight:'600', color:'#5147E5', marginBottom: 28, letterSpacing:'0.01em' }}>
            Analyzing your resume...
          </p>

          <div style={{ display:'flex', flexDirection:'column', gap: 0 }}>
            {STEPS.map((step, i) => {
              const status = i < stepIndex ? 'done' : i === stepIndex ? 'active' : 'pending'
              const isLast = i === STEPS.length - 1
              return (
                <div key={i}>
                  <div style={{ display:'flex', alignItems:'center', gap: 14 }}>
                    <HexCheck status={status} />
                    <div>
                      <p style={{
                        fontSize:'0.875rem', fontWeight: status === 'active' ? '700' : '500',
                        color: status === 'pending' ? '#9CA3AF' : status === 'active' ? '#1A1D2E' : '#374151',
                        transition:'color 0.3s'
                      }}>{step.label}</p>
                      {status === 'active' && (
                        <p style={{ fontSize:'0.72rem', color:'#5147E5', marginTop:2 }}>{step.detail}</p>
                      )}
                    </div>
                  </div>
                  {!isLast && (
                    <div style={{ width:1, height:28, background: i < stepIndex ? '#5147E5' : '#E8EAF0', marginLeft:13, marginTop:2, marginBottom:2, transition:'background 0.4s' }} />
                  )}
                </div>
              )
            })}
          </div>

          {/* Progress bar */}
          <div style={{ marginTop: 28 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
              <span style={{ fontSize:'0.72rem', color:'#6B7280' }}>Progress</span>
              <span style={{ fontSize:'0.72rem', fontWeight:'700', color:'#5147E5', fontVariantNumeric:'tabular-nums' }}>{progress}%</span>
            </div>
            <div className="ev-progress-track">
              <div className="ev-progress-fill"
                style={{ width:`${progress}%`, background:'linear-gradient(90deg,#5147E5,#8B7CF6)' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
