import React, { useEffect, useState } from 'react'
import { BrainCircuit, CheckCircle2, Sparkles } from 'lucide-react'

const STEPS = [
  { label: 'Parsing resume',            detail: 'Extracting text and structure...' },
  { label: 'Extracting skills',         detail: 'Matching against 2,000+ skill database...' },
  { label: 'Running semantic analysis', detail: 'BERT embeddings comparing JD alignment...' },
  { label: 'Classifying skill gaps',    detail: 'Ranking critical vs optional gaps...' },
  { label: 'Generating AI insights',    detail: 'Llama 3.1 scoring each resume section...' },
]

export default function LoadingScreen({ progress }) {
  const [visible, setVisible] = useState(false)
  const stepIndex = Math.min(Math.floor((progress / 100) * STEPS.length), STEPS.length - 1)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className={`min-h-screen bg-white flex items-center justify-center px-6 transition-opacity duration-500 relative overflow-hidden ${visible ? 'opacity-100' : 'opacity-0'}`}>
      {/* Background blobs */}
      <div className="pointer-events-none absolute inset-0">
        <div style={{ position:'absolute', top:'-100px', right:'-150px', width:'500px', height:'500px',
          background:'radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 65%)', borderRadius:'50%' }} />
        <div style={{ position:'absolute', bottom:'-80px', left:'-80px', width:'400px', height:'400px',
          background:'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 65%)', borderRadius:'50%' }} />
      </div>

      <div className="relative z-10 text-center max-w-sm w-full">
        {/* Icon with pulsing rings */}
        <div className="relative flex items-center justify-center mb-8">
          <div className="absolute w-24 h-24 rounded-full border border-primary/20 animate-ping-slow" />
          <div className="absolute w-20 h-20 rounded-full border border-primary/10" />
          <div className="w-16 h-16 gradient-primary rounded-3xl flex items-center justify-center shadow-xl shadow-indigo-200 relative">
            <BrainCircuit size={28} className="text-white" />
          </div>
        </div>

        <h2 className="font-display font-extrabold text-2xl text-ink mb-2">
          Analyzing Your Resume
        </h2>
        <p className="text-muted text-sm mb-8 h-5 transition-all duration-300">
          {STEPS[stepIndex].detail}
        </p>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-muted mb-2">
            <span className="font-medium text-ink">{STEPS[stepIndex].label}</span>
            <span className="font-mono font-semibold text-primary">{progress}%</span>
          </div>
          <div className="h-2 bg-bg-subtle rounded-full overflow-hidden border border-slate-100">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{ width: `${progress}%`, background: 'linear-gradient(90deg,#6366f1,#8b5cf6,#06b6d4)', backgroundSize:'200% 100%' }}
            />
          </div>
        </div>

        {/* Steps list */}
        <div className="space-y-2">
          {STEPS.map((step, i) => {
            const done    = i < stepIndex
            const current = i === stepIndex
            return (
              <div
                key={i}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl transition-all duration-300 ${
                  current
                    ? 'bg-primary-light border border-primary-mid'
                    : done
                    ? 'opacity-60'
                    : 'opacity-25'
                }`}
              >
                {done ? (
                  <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                ) : current ? (
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-primary border-t-transparent animate-spin shrink-0" />
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />
                )}
                <span className={`text-xs font-medium ${current ? 'text-primary' : done ? 'text-ink' : 'text-muted'}`}>
                  {step.label}
                </span>
                {current && <span className="ml-auto text-xs text-primary font-mono font-semibold">{progress}%</span>}
              </div>
            )
          })}
        </div>

        <p className="text-xs text-muted mt-6 flex items-center justify-center gap-1.5">
          <Sparkles size={10} className="text-primary" />
          Powered by BERT + Llama 3.1 + Groq
        </p>
      </div>
    </div>
  )
}
