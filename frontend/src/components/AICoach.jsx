import React, { useState } from 'react'
import { Sparkles, FileText, Map, Loader2, Copy, Check } from 'lucide-react'
import { getAICoaching } from '../services/api'

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button onClick={copy} className="flex items-center gap-1 text-xs text-gray-400 hover:text-primary transition-colors">
      {copied ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy</>}
    </button>
  )
}

function AICard({ icon: Icon, title, content, loading }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-light rounded-lg flex items-center justify-center">
            <Icon size={16} className="text-primary" />
          </div>
          <h4 className="font-semibold text-gray-800 text-sm">{title}</h4>
        </div>
        {content && !loading && <CopyButton text={content} />}
      </div>
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-400 py-4">
          <Loader2 size={16} className="animate-spin text-primary" /> Generating...
        </div>
      ) : content ? (
        <pre className="text-sm text-gray-600 whitespace-pre-wrap font-body leading-relaxed">{content}</pre>
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
    <div className="card p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-light rounded-xl flex items-center justify-center">
            <Sparkles className="text-primary w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800">AI Career Coach</h3>
            <p className="text-xs text-gray-500">Powered by Llama 3.1 via Groq</p>
          </div>
        </div>
        {!result && (
          <button
            onClick={run}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
            {loading ? 'Generating...' : 'Get AI Insights'}
          </button>
        )}
      </div>

      {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

      {(loading || result) && (
        <div className="space-y-4">
          <AICard
            icon={FileText} title="Improved Bullet Points"
            content={result?.rewritten_bullets} loading={loading}
          />
          
          <AICard
            icon={Map} title="30-Day Skill Roadmap"
            content={result?.skill_roadmap} loading={loading}
          />
        </div>
      )}

      {!loading && !result && !error && (
        <p className="text-sm text-gray-400 text-center py-4">
          Click "Get AI Insights" to generate bullet rewrites, cover letter, and skill roadmap.
        </p>
      )}
    </div>
  )
}