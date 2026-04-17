import React, { useState } from 'react'
import { Sparkles, FileText, Map, Loader2, Copy, Check, Zap } from 'lucide-react'
import { getAICoaching } from '../services/api'

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={copy}
      style={{ display:'flex', alignItems:'center', gap:4, fontSize:'0.72rem', color:'#9CA3AF', background:'none', border:'none', cursor:'pointer', padding:'4px 8px', borderRadius:6, transition:'all 0.15s' }}
      onMouseEnter={e => { e.currentTarget.style.background='#EEF0FE'; e.currentTarget.style.color='#5147E5' }}
      onMouseLeave={e => { e.currentTarget.style.background='none'; e.currentTarget.style.color='#9CA3AF' }}
    >
      {copied ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
    </button>
  )
}

function AICard({ icon: Icon, title, content, loading }) {
  return (
    <div className="ev-card" style={{ padding:18 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:30, height:30, background:'#EEF0FE', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Icon size={14} color="#5147E5" />
          </div>
          <h4 style={{ fontWeight:600, fontSize:'0.875rem', color:'#1A1D2E', margin:0 }}>{title}</h4>
        </div>
        {content && !loading && <CopyButton text={content} />}
      </div>
      {loading ? (
        <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:'0.82rem', color:'#9CA3AF', padding:'10px 0' }}>
          <Loader2 size={15} color="#5147E5" style={{ animation:'spin 1s linear infinite' }} /> Generating...
        </div>
      ) : content ? (
        <pre style={{ fontSize:'0.82rem', color:'#374151', whiteSpace:'pre-wrap', fontFamily:"'Inter', sans-serif", lineHeight:1.65, margin:0 }}>{content}</pre>
      ) : null}
    </div>
  )
}

export default function AICoach({ analysisData }) {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const run = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await getAICoaching({
        weak_phrases: analysisData.signal_noise.weak_phrases_found,
        matching_skills: analysisData.matching_skills,
        missing_skills: analysisData.missing_skills,
        job_description: analysisData.jd_text || '',
        resume_text: '',
      })
      setResult(res)
    } catch (e) {
      setError('AI Coach failed. Check your GROQ_API_KEY in .env file.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      {/* Header */}
      <div className="ev-card" style={{ padding:20 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:40, height:40, background:'linear-gradient(135deg,#5147E5,#8B7CF6)', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Sparkles size={18} color="#fff" />
            </div>
            <div>
              <h3 style={{ fontWeight:700, fontSize:'0.95rem', color:'#1A1D2E', margin:'0 0 2px' }}>AI Career Coach</h3>
              <p style={{ fontSize:'0.72rem', color:'#9CA3AF', margin:0 }}>Powered by Llama 3.3-70b via Groq</p>
            </div>
          </div>
          {!result && (
            <button
              onClick={run}
              disabled={loading}
              className="btn-primary"
              style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 18px', fontSize:'0.82rem', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? <Loader2 size={14} style={{ animation:'spin 1s linear infinite' }} /> : <Zap size={14} />}
              {loading ? 'Generating...' : 'Get AI Insights'}
            </button>
          )}
        </div>

        {error && (
          <p style={{ fontSize:'0.82rem', color:'#EF4444', marginTop:14, padding:'10px 14px', background:'#FEF2F2', borderRadius:8, border:'1px solid #FECACA' }}>{error}</p>
        )}

        {!loading && !result && !error && (
          <p style={{ fontSize:'0.82rem', color:'#9CA3AF', marginTop:14, padding:'10px 14px', background:'#F8F9FC', borderRadius:8, textAlign:'center' }}>
            Click "Get AI Insights" to generate bullet rewrites and a 30-day skill roadmap.
          </p>
        )}
      </div>

      {/* Content Cards */}
      {(loading || result) && (
        <>
          <AICard
            icon={FileText}
            title="Improved Bullet Points"
            content={result?.rewritten_bullets}
            loading={loading}
          />
          <AICard
            icon={Map}
            title="30-Day Skill Roadmap"
            content={result?.skill_roadmap}
            loading={loading}
          />
        </>
      )}
    </div>
  )
}
