import React, { useState, useEffect, useMemo } from 'react'
import { BookOpen, Clock, Star, Users, ExternalLink, Zap, Filter, TrendingUp, GraduationCap, Map, Sparkles, AlertCircle } from 'lucide-react'
import { getCourseRecommendations } from '../services/api'

const PLATFORM_COLORS = {
  'Coursera':       '#0056d2',
  'Udemy':          '#a435f0',
  'freeCodeCamp':   '#0a0a23',
  'YouTube':        '#ff0000',
  'DeepLearning.AI':'#0070f3',
  'Official Docs':  '#059669',
  'Book + Labs':    '#374151',
}

const LEVEL_STYLES = {
  beginner:     'bg-emerald-50 text-emerald-700 border-emerald-200',
  intermediate: 'bg-amber-50 text-amber-700 border-amber-200',
  advanced:     'bg-red-50 text-red-600 border-red-200',
}

/* ─── Skeleton Loader Component ───────────────────────────────────────────── */
function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-fade-up">
      <div className="card p-8 text-center bg-gradient-to-r from-indigo-50/60 via-purple-50/60 to-indigo-50/60 border border-indigo-100 shadow-sm">
        <div className="w-14 h-14 gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
          <Sparkles size={24} className="text-white animate-spin" />
        </div>
        <h3 className="font-display font-bold text-ink text-base mb-1">
          Generating AI Personalized Course Recommendations...
        </h3>
        <p className="text-muted text-xs max-w-md mx-auto">
          Analyzing your specific skill gaps and job description requirements to curate targeted learning resources per skill gap.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map(n => (
          <div key={n} className="card p-5 space-y-3 animate-pulse border border-slate-100">
            <div className="h-28 bg-slate-100 rounded-xl" />
            <div className="h-4 bg-slate-100 rounded w-3/4" />
            <div className="h-3 bg-slate-100 rounded w-1/2" />
            <div className="h-8 bg-slate-100 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Sub-components ──────────────────────────────────────────────────────── */
function CourseCard({ course }) {
  const priority = course.priority || 'important'
  const mScore = course.mScore || 85
  const color = (Array.isArray(course.color) && course.color.length >= 2) ? course.color : ['#3b82f6', '#1d4ed8']
  const emoji = course.emoji || '🎓'
  const platform = course.platform || 'Coursera'
  const level = course.level || 'intermediate'

  const priorityConfig = {
    critical:  { label: 'Critical Gap',  dot: 'bg-red-500',   badge: 'bg-red-50 text-red-600 border-red-200' },
    important: { label: 'Important Gap', dot: 'bg-amber-500', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
    optional:  { label: 'Nice to Have',  dot: 'bg-violet-400',badge: 'bg-violet-50 text-violet-700 border-violet-200' },
  }
  const cfg = priorityConfig[priority] || priorityConfig.important

  return (
    <div className="card card-lift overflow-hidden flex flex-col">
      {/* Thumbnail */}
      <div className="h-28 relative flex items-center justify-center text-4xl"
        style={{ background: `linear-gradient(135deg, ${color[0]}, ${color[1]})` }}>
        {emoji}
        {/* Platform badge */}
        <span className="absolute top-2.5 left-2.5 text-xs font-bold px-2.5 py-1 rounded-full"
          style={{ background:'rgba(255,255,255,0.92)', color: PLATFORM_COLORS[platform] || '#374151', backdropFilter:'blur(8px)' }}>
          {platform}
        </span>
        {/* Level badge */}
        <span className={`absolute top-2.5 right-2.5 text-xs font-bold px-2.5 py-1 rounded-full border ${LEVEL_STYLES[level] || LEVEL_STYLES.intermediate}`}>
          {level.charAt(0).toUpperCase() + level.slice(1)}
        </span>
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col flex-1">
        {/* Priority tag */}
        <div className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border w-fit mb-2.5 ${cfg.badge}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
          {cfg.label} · {(course.skill || 'SKILL').toUpperCase()}
        </div>

        <h3 className="font-display font-bold text-ink text-sm leading-tight mb-2">{course.title}</h3>
        <p className="text-xs text-muted leading-relaxed mb-3 flex-1">{course.desc}</p>

        {/* Meta row */}
        <div className="flex items-center gap-3 mb-3 text-xs text-muted">
          <span className="flex items-center gap-1"><Clock size={11} /> {course.hours || 10}h</span>
          <span className="flex items-center gap-1"><Star size={11} className="text-amber-400" /> {course.rating || 4.8}</span>
          <span className="flex items-center gap-1"><Users size={11} /> {course.students || '100k+'}</span>
        </div>

        {/* Match bar */}
        <div className="mb-3">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted">JD match</span>
            <span className="font-mono font-bold text-primary">{mScore}%</span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width:`${mScore}%`, background:`linear-gradient(90deg, ${color[0]}, ${color[1]})` }} />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          {course.free
            ? <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                Free{course.cert ? ' + Certificate' : ''}
              </span>
            : <span className="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                {course.price || '$14.99'}
              </span>
          }
          <a href={course.url || `https://www.coursera.org/search?query=${encodeURIComponent(course.skill || course.title)}`}
            target="_blank" rel="noreferrer"
            className="flex items-center gap-1.5 text-xs font-bold text-white px-3 py-1.5 rounded-lg transition-all hover:-translate-y-0.5"
            style={{ background:`linear-gradient(135deg, ${color[0]}, ${color[1]})`, boxShadow:`0 4px 12px ${color[0]}55` }}>
            Start <ExternalLink size={11} />
          </a>
        </div>
      </div>
    </div>
  )
}

function LearningPathBanner({ gaps, total }) {
  const path = gaps.slice(0, 4).join(' → ')
  return (
    <div className="rounded-2xl border border-indigo-100 p-5 mb-5 flex items-center gap-4"
      style={{ background:'linear-gradient(135deg, #eef2ff, #f5f3ff)' }}>
      <div className="w-11 h-11 gradient-primary rounded-2xl flex items-center justify-center shrink-0">
        <Map size={20} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-display font-bold text-indigo-900 text-sm mb-0.5">Suggested Learning Path</p>
        <p className="text-indigo-600 text-xs truncate">{path || 'Build skills matching this job description'}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="font-extrabold text-2xl text-indigo-700 font-display">+{Math.min(total * 3, 25)}pts</p>
        <p className="text-xs text-indigo-500">estimated score boost</p>
      </div>
    </div>
  )
}

/* ─── Main Component ──────────────────────────────────────────────────────── */
export default function CourseRecommendations({ skillGaps, jobDescription = '', resumeText = '' }) {
  const { critical = [], important = [], optional = [] } = skillGaps || {}
  const allGaps = useMemo(() => [...critical, ...important, ...optional], [critical, important, optional])

  const [courses, setCourses]           = useState([])
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState(null)
  const [activeFilter, setActiveFilter] = useState('all')
  const [showAll, setShowAll]           = useState(false)

  useEffect(() => {
    if (allGaps.length === 0) {
      setCourses([])
      return
    }

    let isMounted = true
    setLoading(true)
    setError(null)

    getCourseRecommendations(skillGaps, jobDescription, resumeText)
      .then(res => {
        if (isMounted) {
          setCourses(res.courses || [])
          setLoading(false)
        }
      })
      .catch(err => {
        if (isMounted) {
          console.error("Failed to fetch course recommendations:", err)
          setError("Could not generate AI course recommendations. Please try again.")
          setLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [JSON.stringify(skillGaps), jobDescription, resumeText])

  const filtered = useMemo(() => {
    switch (activeFilter) {
      case 'critical':  return courses.filter(c => c.priority === 'critical')
      case 'important': return courses.filter(c => c.priority === 'important')
      case 'free':      return courses.filter(c => c.free)
      case 'beginner':  return courses.filter(c => c.level === 'beginner')
      case 'certified': return courses.filter(c => c.cert)
      default:          return courses
    }
  }, [courses, activeFilter])

  const visible = showAll ? filtered : filtered.slice(0, 4)

  const filters = [
    { id:'all',       label:`All (${courses.length})` },
    { id:'critical',  label:`Critical (${critical.length})`,   dot:'bg-red-500' },
    { id:'important', label:`Important (${important.length})`, dot:'bg-amber-500' },
    { id:'free',      label:'Free only',                        icon:'🆓' },
    { id:'beginner',  label:'Beginner',                         icon:'⚡' },
    { id:'certified', label:'Certified',                        icon:'🎓' },
  ]

  /* No gaps scenario */
  if (allGaps.length === 0) {
    return (
      <div className="card p-12 text-center animate-fade-up">
        <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 rounded-3xl flex items-center justify-center mx-auto mb-4">
          <GraduationCap size={28} className="text-emerald-500" />
        </div>
        <h3 className="font-display font-bold text-ink text-lg mb-2">You already match all key skills!</h3>
        <p className="text-muted text-sm max-w-sm mx-auto">No significant skill gaps were detected for this job description. Focus on deepening your existing expertise and building portfolio projects.</p>
      </div>
    )
  }

  /* Loading State */
  if (loading) {
    return <LoadingSkeleton />
  }

  /* Error State */
  if (error) {
    return (
      <div className="card p-8 text-center animate-fade-up border border-red-100 bg-red-50/50">
        <AlertCircle size={28} className="text-red-500 mx-auto mb-3" />
        <h3 className="font-display font-bold text-ink text-base mb-1">Recommendation Generation Failed</h3>
        <p className="text-muted text-xs mb-4">{error}</p>
        <button
          onClick={() => {
            setLoading(true)
            getCourseRecommendations(skillGaps, jobDescription, resumeText)
              .then(res => { setCourses(res.courses || []); setLoading(false); setError(null); })
              .catch(() => { setError("Could not generate AI course recommendations."); setLoading(false); })
          }}
          className="btn-primary text-xs px-4 py-2 mx-auto">
          Retry AI Recommendations
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-5 animate-fade-up">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-display font-extrabold text-ink text-lg mb-1">AI-Curated Course Recommendations</h2>
          <p className="text-sm text-muted">
            {courses.length} personalized courses dynamically generated for your <span className="text-primary font-semibold">{allGaps.length} skill gaps</span> · powered by Llama 3.3
          </p>
        </div>
        <div className="text-right shrink-0 ml-4">
          <p className="text-xs text-muted">Recommendation engine</p>
          <p className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-full mt-1 flex items-center gap-1">
            <Sparkles size={11} className="text-indigo-600" /> Contextual LLM
          </p>
        </div>
      </div>

      {/* Learning path banner */}
      <LearningPathBanner gaps={allGaps} total={allGaps.length} />

      {/* Match reason strip */}
      <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-700">
        <TrendingUp size={15} className="text-emerald-500 shrink-0" />
        <span>Completing these resources could raise your match score by an estimated <strong>+{Math.min(allGaps.length * 3, 25)} points</strong>. Prioritize <strong>critical gaps</strong> first.</span>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-muted">
          <Filter size={11} /> Filter:
        </span>
        {filters.map(f => (
          <button key={f.id}
            onClick={() => setActiveFilter(f.id)}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
              activeFilter === f.id
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-muted border-slate-200 hover:border-primary/40 hover:text-primary'
            }`}>
            {f.dot && <span className={`w-2 h-2 rounded-full ${f.dot}`} />}
            {f.icon && <span>{f.icon}</span>}
            {f.label}
          </button>
        ))}
      </div>

      {/* Course grid */}
      {visible.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {visible.map(c => (
              <CourseCard key={c.id} course={c} />
            ))}
          </div>

          {/* Show more */}
          {filtered.length > 4 && (
            <div className="text-center pt-2">
              <button
                onClick={() => setShowAll(v => !v)}
                className="btn-ghost text-sm px-6 py-2.5 inline-flex items-center gap-2">
                <BookOpen size={14} />
                {showAll ? 'Show less' : `Show ${filtered.length - 4} more courses`}
              </button>
              <p className="text-xs text-muted mt-2">Dynamic learning resources tailored to your target position</p>
            </div>
          )}
        </>
      ) : (
        <div className="card p-8 text-center">
          <BookOpen size={24} className="text-muted mx-auto mb-3" />
          <p className="text-sm text-muted">No courses match the current filter. Try selecting a different category.</p>
        </div>
      )}
    </div>
  )
}
