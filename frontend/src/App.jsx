import React, { useState, useEffect } from 'react'
import {
  BrainCircuit, Github, Sparkles, Upload, BarChart3,
  Target, Briefcase, Zap, ArrowRight, CheckCircle2,
  Shield, Clock, TrendingUp, X as XIcon, Star
} from 'lucide-react'
import UploadSection from './components/UploadSection'
import ResultsDashboard from './components/ResultsDashboard'
import LoadingScreen from './components/LoadingScreen'
import { useAnalysis } from './hooks/useAnalysis'

/* ─── Header ───────────────────────────────────────────────── */
function Header({ onLogoClick }) {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])
  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
      scrolled ? 'bg-white shadow-sm border-b border-slate-100' : 'bg-white/80 backdrop-blur-sm'
    }`}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between h-15" style={{ height: 60 }}>
          <button onClick={onLogoClick} className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 gradient-primary rounded-xl flex items-center justify-center shadow-sm">
              <BrainCircuit size={16} className="text-white" />
            </div>
            <span className="font-display font-bold text-base tracking-tight text-ink">
              Career<span className="text-primary">IQ</span>
            </span>
            <span className="hidden sm:flex items-center gap-1 text-xs bg-primary-light text-primary font-semibold px-2.5 py-0.5 rounded-full border border-primary-mid ml-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse inline-block" />
              Beta
            </span>
          </button>
          <div className="flex items-center gap-3">
            <span className="hidden md:flex items-center gap-1.5 text-xs font-medium text-muted">
              <Sparkles size={11} className="text-primary" />
              Powered by Llama 3.1
            </span>
            <a href="https://github.com" target="_blank" rel="noreferrer"
              className="p-2 rounded-lg text-muted hover:text-ink hover:bg-bg-subtle transition-all">
              <Github size={16} />
            </a>
          </div>
        </div>
      </div>
    </header>
  )
}

/* ─── Hero Section ──────────────────────────────────────────── */
function HeroSection({ onStart }) {
  const features = [
    { icon: BarChart3,    title: 'AI Semantic Scoring',  desc: 'BERT-powered embeddings measure true alignment beyond keywords.',          color: 'indigo' },
    { icon: Target,       title: 'Skill Gap Detection',  desc: 'Critical vs optional gaps ranked by JD frequency and impact.',             color: 'violet' },
    { icon: BrainCircuit, title: 'LLM Deep Analysis',    desc: 'Section-by-section scoring powered by Llama 3.1 via Groq.',               color: 'cyan'   },
    { icon: Briefcase,    title: 'Live Job Matching',    desc: 'Real-time listings from LinkedIn, Indeed, and Glassdoor.',                 color: 'emerald'},
    { icon: Zap,          title: 'AI Career Coach',      desc: 'Rewritten bullets and a personalized 30-day skill roadmap.',               color: 'amber'  },
    { icon: Shield,       title: 'ATS Simulation',       desc: 'Simulate how applicant tracking systems parse your resume.',               color: 'rose'   },
  ]
  const colorMap = {
    indigo:  { bg: 'bg-indigo-50',  icon: 'text-indigo-500',  border: 'border-indigo-100' },
    violet:  { bg: 'bg-violet-50',  icon: 'text-violet-500',  border: 'border-violet-100' },
    cyan:    { bg: 'bg-cyan-50',    icon: 'text-cyan-500',    border: 'border-cyan-100'   },
    emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-500', border: 'border-emerald-100'},
    amber:   { bg: 'bg-amber-50',   icon: 'text-amber-500',   border: 'border-amber-100'  },
    rose:    { bg: 'bg-rose-50',    icon: 'text-rose-500',    border: 'border-rose-100'   },
  }
  const stats = [
    { value: '95%',  label: 'ATS Pass Rate'   },
    { value: '3x',   label: 'More Interviews' },
    { value: '<10s', label: 'Instant Results' },
  ]
  const trust = [
    { icon: CheckCircle2, label: 'No sign-up' },
    { icon: Shield,       label: 'Data never stored' },
    { icon: Clock,        label: 'Free forever' },
  ]

  return (
    <>
      {/* ── HERO ── */}
      <section className="pt-20 pb-0 min-h-screen flex flex-col justify-center bg-white relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute inset-0">
          <div style={{ position:'absolute', top:'-120px', right:'-160px', width:'600px', height:'600px',
            background:'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 65%)', borderRadius:'50%' }} />
          <div style={{ position:'absolute', bottom:'-80px', left:'-100px', width:'480px', height:'480px',
            background:'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 65%)', borderRadius:'50%' }} />
          <div style={{ position:'absolute', top:'30%', left:'40%', width:'300px', height:'300px',
            background:'radial-gradient(circle, rgba(6,182,212,0.05) 0%, transparent 65%)', borderRadius:'50%' }} />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-6 w-full py-16">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* ─ LEFT: Copy ─ */}
            <div>
              {/* Eyebrow */}
              <div className="inline-flex items-center gap-2 bg-primary-light border border-primary-mid text-primary text-xs font-semibold px-3.5 py-1.5 rounded-full mb-6 animate-fade-up">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                Free AI-Powered Resume Tool
              </div>

              {/* Headline */}
              <h1 className="font-display font-extrabold text-ink text-5xl md:text-6xl leading-[1.05] tracking-tight mb-5 animate-fade-up" style={{ animationDelay:'60ms' }}>
                Get your resume
                <br />
                <span className="gradient-text-dark">match score</span>
                <br />
                in seconds.
              </h1>

              {/* Sub */}
              <p className="text-muted text-lg leading-relaxed mb-8 max-w-md animate-fade-up" style={{ animationDelay:'120ms' }}>
                Upload your resume and a job description. Our AI gives you instant semantic scoring, skill gap analysis, and personalized coaching.
              </p>

              {/* Stats */}
              <div className="flex items-center gap-8 mb-8 animate-fade-up" style={{ animationDelay:'180ms' }}>
                {stats.map((s, i) => (
                  <div key={i} className="text-center">
                    <div className="font-display font-extrabold text-2xl text-ink">{s.value}</div>
                    <div className="text-xs text-muted mt-0.5 font-medium">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Trust row */}
              <div className="flex items-center gap-5 animate-fade-up" style={{ animationDelay:'220ms' }}>
                {trust.map((t, i) => (
                  <span key={i} className="flex items-center gap-1.5 text-xs text-muted font-medium">
                    <t.icon size={12} className="text-primary" />
                    {t.label}
                  </span>
                ))}
              </div>

              {/* Social proof */}
              <div className="flex items-center gap-2 mt-6 animate-fade-up" style={{ animationDelay:'260ms' }}>
                <div className="flex -space-x-2">
                  {['4C51F5','7C3AED','06B6D4','10B981'].map((c, i) => (
                    <div key={i} className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold"
                      style={{ background: '#' + c }}>
                      {['A','B','C','D'][i]}
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted ml-1">
                  <div className="flex">
                    {[1,2,3,4,5].map(s => <Star key={s} size={11} className="text-amber-400 fill-amber-400" />)}
                  </div>
                  <span className="font-semibold text-ink">4.9</span>
                  <span>from 2,400+ users</span>
                </div>
              </div>
            </div>

            {/* ─ RIGHT: Upload card ─ */}
            <div className="animate-fade-up" style={{ animationDelay:'200ms' }}>
              <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/60 p-7">
                {/* Card header */}
                <div className="flex items-center gap-2.5 mb-5">
                  <div className="w-8 h-8 gradient-primary rounded-xl flex items-center justify-center">
                    <Sparkles size={14} className="text-white" />
                  </div>
                  <div>
                    <p className="font-display font-semibold text-ink text-sm leading-tight">Analyze Your Resume</p>
                    <p className="text-xs text-muted">Instant AI scoring in under 10 seconds</p>
                  </div>
                  <div className="ml-auto flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">
                    <span className="live-dot" />
                    <span className="ml-1">Live</span>
                  </div>
                </div>
                <UploadSection onSubmit={onStart} />
              </div>

              {/* Card footnote */}
              <p className="text-center text-xs text-muted mt-3">
                Supports PDF and DOCX &middot; Your data is never stored or shared
              </p>
            </div>

          </div>
        </div>

        {/* Bottom fade into features */}
        <div className="relative z-10 h-16 bg-gradient-to-b from-white to-bg-subtle" />
      </section>

      {/* ── FEATURES ── */}
      <section className="bg-bg-subtle py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary bg-primary-light border border-primary-mid px-3.5 py-1.5 rounded-full mb-4">
              <TrendingUp size={11} /> Full Feature Suite
            </span>
            <h2 className="font-display font-extrabold text-3xl md:text-4xl text-ink tracking-tight mt-4 mb-4">
              Everything you need to land
              <br />
              <span className="gradient-text-dark">your next role</span>
            </h2>
            <p className="text-muted text-base max-w-lg mx-auto leading-relaxed">
              Six AI tools working together to give you a competitive edge in every application.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => {
              const c = colorMap[f.color]
              return (
                <div key={i} className="card card-lift bg-white p-6 cursor-default group">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-4 border ${c.bg} ${c.border} transition-all`}>
                    <f.icon size={17} className={c.icon} />
                  </div>
                  <h3 className="font-display font-semibold text-ink text-sm mb-2">{f.title}</h3>
                  <p className="text-xs text-muted leading-relaxed">{f.desc}</p>
                </div>
              )
            })}
          </div>

          <div className="text-center mt-12">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="btn-primary inline-flex items-center gap-2 px-6 py-3 text-sm"
            >
              <Sparkles size={15} />
              Try It Free
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </section>
    </>
  )
}

/* ─── App Root ──────────────────────────────────────────────── */
export default function App() {
  const { data, loading, error, progress, run, reset } = useAnalysis()

  return (
    <div className="min-h-screen font-body">
      <Header onLogoClick={reset} />
      <main>
        {loading && <LoadingScreen progress={progress} />}

        {error && !loading && (
          <div className="min-h-screen bg-bg flex items-center justify-center px-6 pt-16">
            <div className="card p-8 text-center max-w-md w-full">
              <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <XIcon size={20} className="text-danger" />
              </div>
              <h3 className="font-display font-semibold text-ink mb-2">Analysis Failed</h3>
              <p className="text-danger text-sm mb-5 leading-relaxed">{error}</p>
              <button onClick={reset} className="btn-primary text-sm px-6 py-2.5">Try Again</button>
            </div>
          </div>
        )}

        {!loading && data && (
          <div className="bg-bg min-h-screen pt-16">
            <ResultsDashboard data={data} onReset={reset} />
          </div>
        )}

        {!loading && !data && !error && (
          <HeroSection onStart={(file, jd) => run(file, jd)} />
        )}
      </main>
    </div>
  )
}
