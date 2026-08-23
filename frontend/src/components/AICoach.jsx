import React, { useState } from 'react'
import { Check, Copy, FileText, Loader2, Sparkles, Zap } from 'lucide-react'
import { generateCoaching } from '../services/api'

/* One artefact per request, generated when asked for.
   The previous version fired all five generators on every visit to this tab —
   five of roughly twenty free requests per minute, for output the user might
   never scroll to. */
const MODES = [
  { id: 'bullets', label: 'Bullet points', blurb: 'Rewrites weak bullets with action verbs and impact' },
  { id: 'roadmap', label: '30-day roadmap', blurb: 'A focused plan for your biggest skill gaps' },
  { id: 'interview', label: 'Interview prep', blurb: 'Likely questions for this specific role' },
  { id: 'cover_letter', label: 'Cover letter', blurb: 'Three paragraphs, no filler' },
  { id: 'linkedin', label: 'LinkedIn About', blurb: 'A keyword-dense profile summary' },
]

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard blocked — the text is selectable anyway */
    }
  }

  return (
    <button
      onClick={copy}
      className="btn-ghost"
      style={{ fontSize: '0.72rem', padding: '4px 10px' }}
      aria-label="Copy to clipboard"
    >
      {copied ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
    </button>
  )
}

export default function AICoach({ analysisData }) {
  const [results, setResults] = useState({})
  const [pending, setPending] = useState(null)
  const [error, setError] = useState(null)

  const payload = {
    weak_phrases: analysisData.signal_noise?.weak_phrases_found ?? [],
    matching_skills: analysisData.matching_skills ?? [],
    missing_skills: analysisData.missing_skills ?? [],
    job_description: analysisData.job_description || '',
    resume_text: analysisData.resume_text || '',
    experience_level: analysisData.experience_info?.level || 'mid',
  }

  const run = async (mode) => {
    setPending(mode)
    setError(null)
    try {
      const result = await generateCoaching(mode, payload)
      setResults((prev) => ({ ...prev, [mode]: result.content }))
    } catch {
      setError('Could not generate that right now. Check the API key in backend/.env and try again.')
    } finally {
      setPending(null)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="ev-card" style={{ padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg,#5147E5,#8B7CF6)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={18} color="#fff" />
          </div>
          <div>
            <h3 style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1A1D2E', margin: '0 0 2px' }}>AI Career Coach</h3>
            <p style={{ fontSize: '0.72rem', color: '#9CA3AF', margin: 0 }}>
              Pick what you need — each one is generated on request
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 8 }}>
          {MODES.map((mode) => {
            const isPending = pending === mode.id
            const isDone = Boolean(results[mode.id])
            return (
              <button
                key={mode.id}
                onClick={() => run(mode.id)}
                disabled={Boolean(pending)}
                className="ev-card"
                style={{
                  padding: '12px 14px',
                  textAlign: 'left',
                  cursor: pending ? 'not-allowed' : 'pointer',
                  border: isDone ? '1px solid #BBF7D0' : '1px solid #E8EAF0',
                  background: isDone ? '#F0FDF4' : '#fff',
                  opacity: pending && !isPending ? 0.5 : 1,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  {isPending
                    ? <Loader2 size={13} color="#5147E5" style={{ animation: 'spin 1s linear infinite' }} />
                    : isDone
                      ? <Check size={13} color="#16A34A" />
                      : <Zap size={13} color="#5147E5" />}
                  <span style={{ fontWeight: 600, fontSize: '0.8rem', color: '#1A1D2E' }}>{mode.label}</span>
                </div>
                <p style={{ fontSize: '0.68rem', color: '#9CA3AF', margin: 0, lineHeight: 1.45 }}>{mode.blurb}</p>
              </button>
            )
          })}
        </div>

        {error && (
          <p style={{ fontSize: '0.82rem', color: '#EF4444', marginTop: 14, padding: '10px 14px', background: '#FEF2F2', borderRadius: 8, border: '1px solid #FECACA' }}>
            {error}
          </p>
        )}
      </div>

      {MODES.filter((mode) => results[mode.id]).map((mode) => (
        <div key={mode.id} className="ev-card" style={{ padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 30, height: 30, background: '#EEF0FE', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={14} color="#5147E5" />
              </div>
              <h4 style={{ fontWeight: 600, fontSize: '0.875rem', color: '#1A1D2E', margin: 0 }}>{mode.label}</h4>
            </div>
            <CopyButton text={results[mode.id]} />
          </div>
          <pre style={{ fontSize: '0.82rem', color: '#374151', whiteSpace: 'pre-wrap', fontFamily: "'Inter', sans-serif", lineHeight: 1.65, margin: 0 }}>
            {results[mode.id]}
          </pre>
        </div>
      ))}
    </div>
  )
}
