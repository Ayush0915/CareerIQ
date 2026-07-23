import React, { useState, useEffect } from 'react'
import {
  Github, CheckCircle2, Shield, Zap, BarChart3,
  ArrowRight, X as XIcon, TrendingUp,
  ShieldCheck, Brain, Sparkles
} from 'lucide-react'
import UploadSection from './components/UploadSection'
import ResultsDashboard from './components/ResultsDashboard'
import LoadingScreen from './components/LoadingScreen'
import { useAnalysis } from './hooks/useAnalysis'
import Card from './components/ui/Card'
import Badge from './components/ui/Badge'
import ScoreBar from './components/ui/ScoreBar'

/* ────────────────────────────────────────────
   LOGO MARK  (inline SVG — clean, modern)
──────────────────────────────────────────── */
function LogoMark({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <rect width="36" height="36" rx="10" fill="url(#lg)" />
      <text x="18" y="24" textAnchor="middle" fill="#fff"
        className="font-sans font-extrabold text-[15px] tracking-[-0.5px]">
        IQ
      </text>
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop stopColor="#5147E5"/>
          <stop offset="1" stopColor="#8B7CF6"/>
        </linearGradient>
      </defs>
    </svg>
  )
}

/* ────────────────────────────────────────────
   HEADER
──────────────────────────────────────────── */
function Header({ onLogoClick }) {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 h-[62px] bg-white/96 backdrop-blur-[16px] transition-all duration-250 ${
      scrolled ? 'border-b border-border shadow-[0_1px_12px_rgba(0,0,0,0.06)]' : 'border-b border-transparent shadow-none'
    }`}>
      <div className="max-w-[1160px] mx-auto px-7 h-full flex items-center justify-between">

        {/* Logo */}
        <button onClick={onLogoClick} className="flex items-center gap-2.5 border-none bg-transparent cursor-pointer p-0">
          <LogoMark size={36} />
          <span className="font-extrabold text-[1.05rem] text-navy tracking-[-0.02em]">
            Career<span className="text-accent">IQ</span>
          </span>
          <Badge variant="accent" className="ml-0.5 tracking-[0.04em]">
            BETA
          </Badge>
        </button>

        {/* Nav right */}
        <div className="flex items-center gap-4">
          <a href="https://github.com/Ayush0915" target="_blank" rel="noreferrer"
            className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted no-underline bg-white">
            <Github size={14} />
          </a>
        </div>
      </div>
    </header>
  )
}

/* ────────────────────────────────────────────
   FLOATING STAT BADGE
──────────────────────────────────────────── */
function StatBadge({ icon:Icon, value, label, color, style }) {
  return (
    <div
      className="flex items-center gap-2.5 bg-white rounded-[14px] px-3.5 py-2.5 shadow-[0_8px_24px_rgba(0,0,0,0.10)] border border-[#F0F1F5]"
      style={style}
    >
      <div
        className="w-8 h-8 rounded-[9px] flex items-center justify-center shrink-0"
        style={{ background: color + '18' }}
      >
        <Icon size={15} color={color} />
      </div>
      <div>
        <div className="text-[0.85rem] font-extrabold text-navy leading-tight">{value}</div>
        <div className="text-[0.65rem] text-subtle font-medium mt-0.5">{label}</div>
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────
   RESULT PREVIEW MOCKUP (right column)
──────────────────────────────────────────── */
function ResultMockup() {
  const skills = ['Python', 'React', 'Docker', 'FastAPI', 'ML']
  const missing = ['Kubernetes', 'Terraform']
  const bars = [
    { label:'Semantic Match', pct:84, color:'#22C55E' },
    { label:'ATS Score',      pct:76, color:'#5147E5' },
    { label:'Skill Match',    pct:91, color:'#3B82F6' },
    { label:'Writing Quality',pct:68, color:'#F59E0B' },
  ]

  return (
    <div className="relative h-[480px]">
      {/* Main card */}
      <Card className="absolute top-0 left-0 right-0 p-0 overflow-hidden shadow-[0_20px_60px_rgba(81,71,229,0.15)]">
        {/* Card header */}
        <div className="bg-gradient-to-r from-accent to-[#8B7CF6] px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain size={16} className="text-white/90" />
            <span className="text-[0.8rem] font-bold text-white">Analysis Complete</span>
          </div>
          <div className="flex items-center gap-1.5 bg-white/20 rounded-full px-2.5 py-0.5">
            <span className="text-[0.65rem] font-bold text-white">6.2s</span>
          </div>
        </div>

        {/* Score row */}
        <div className="px-5 py-[18px] flex items-center gap-4 border-b border-[#F0F1F5]">
          <div className="text-center">
            <div className="text-[2.8rem] font-extrabold text-success leading-none tabular-nums">82</div>
            <div className="text-[0.62rem] text-subtle mt-0.5">Overall Score</div>
          </div>
          <div className="flex-1">
            {bars.map((b, i) => (
              <ScoreBar
                key={i}
                label={b.label}
                value={b.pct}
                color={b.color}
                height={4}
                className={i < bars.length - 1 ? 'mb-2' : 'mb-0'}
              />
            ))}
          </div>
        </div>

        {/* Skills row */}
        <div className="px-5 py-3.5 border-b border-[#F0F1F5]">
          <div className="text-[0.65rem] font-bold text-subtle uppercase tracking-[0.07em] mb-2">Matching Skills</div>
          <div className="flex flex-wrap gap-1.25">
            {skills.map(s => (
              <Badge variant="match" key={s}>
                {s}
              </Badge>
            ))}
          </div>
        </div>

        {/* Gaps row */}
        <div className="px-5 py-3.5">
          <div className="text-[0.65rem] font-bold text-subtle uppercase tracking-[0.07em] mb-2">Critical Gaps</div>
          <div className="flex gap-1.25">
            {missing.map(s => (
              <Badge variant="critical" key={s}>
                {s}
              </Badge>
            ))}
            <span className="text-[0.68rem] text-subtle self-center">+ 3 more</span>
          </div>
        </div>
      </Card>

      {/* Floating stat badges */}
      <StatBadge
        icon={ShieldCheck} value="ATS Ready" label="Formatting passed"
        color="#22C55E"
        style={{ position:'absolute', bottom:40, left:-30, zIndex:10, width:160 }}
      />
      <StatBadge
        icon={Sparkles} value="4 Tips" label="AI improvements"
        color="#5147E5"
        style={{ position:'absolute', bottom:110, right:-20, zIndex:10, width:155 }}
      />
    </div>
  )
}

const ROTATING_WORDS = ['interviews', 'callbacks', 'job offers', 'shortlists', 'opportunities']

function RotatingHeadlineWord() {
  const [index, setIndex] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    // Respect prefers-reduced-motion setting
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return
    }

    let timeoutId
    const intervalId = setInterval(() => {
      setVisible(false)
      timeoutId = setTimeout(() => {
        setIndex((prev) => (prev + 1) % ROTATING_WORDS.length)
        setVisible(true)
      }, 200)
    }, 2500)

    return () => {
      clearInterval(intervalId)
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [])

  return (
    <span
      className="inline-block transition-all duration-350 ease-out"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(8px)',
      }}
    >
      {ROTATING_WORDS[index]}
    </span>
  )
}

/* ────────────────────────────────────────────
   HERO
──────────────────────────────────────────── */
function HeroSection({ onStart }) {
  return (
    <div className="bg-bg pt-[62px] relative overflow-hidden">

      {/* Subtle dot-grid background */}
      <div className="absolute inset-0 pointer-events-none opacity-50 bg-[radial-gradient(circle,#D8DCFC_1px,transparent_1px)] bg-[size:28px_28px]" />

      {/* Gradient blob top-right and left-center (brought up closer to the card) */}
      <div className="absolute -top-[160px] -right-[160px] w-[520px] h-[520px] rounded-full bg-[radial-gradient(circle,rgba(81,71,229,0.10)_0%,transparent_65%)] pointer-events-none" />
      <div className="absolute top-[260px] -left-[60px] w-[360px] h-[360px] rounded-full bg-[radial-gradient(circle,rgba(139,124,246,0.08)_0%,transparent_65%)] pointer-events-none" />

      <div className="max-w-[1160px] mx-auto px-7 pt-10 pb-10 relative">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">

          {/* ── LEFT COLUMN ── */}
          <div className="animate-fade-up">

            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 bg-accent-light border border-accent-mid rounded-full px-4 py-1.5 mb-6">
              <span className="w-1.75 h-1.75 rounded-full bg-accent inline-block animate-skeleton" />
              <span className="text-[0.72rem] font-bold text-accent tracking-[0.02em]">Free AI Resume Analyzer — No Sign-up</span>
            </div>

            {/* Headline */}
            <h1 className="text-[3.4rem] font-extrabold text-navy leading-[1.08] tracking-[-0.03em] mb-4.5">
              Land more <RotatingHeadlineWord /><br />
              with <span className="bg-gradient-to-r from-accent to-[#8B7CF6] bg-clip-text text-transparent">AI-powered</span><br />
              resume analysis
            </h1>

            {/* Subheadline */}
            <p className="text-[1.05rem] text-muted leading-[1.7] mb-8 max-w-[440px]">
              ATS scoring, skill gap detection, interview prep, and personalized AI coaching — all from a single resume upload.
            </p>

            {/* CTA buttons */}
            <div className="flex gap-3 mb-8 flex-wrap">
              <button
                onClick={() => document.getElementById('upload-card')?.scrollIntoView({ behavior:'smooth' })}
                className="btn-primary flex items-center gap-2 px-7 py-3.25 text-[0.9rem]"
              >
                <Sparkles size={16} />
                Analyze My Resume
                <ArrowRight size={15} />
              </button>
              <button
                className="btn-ghost flex items-center gap-1.75 px-5.5 py-3.25 text-[0.9rem] border-[1.5px] border-border text-navy-muted"
                onClick={() => document.getElementById('upload-card')?.scrollIntoView({ behavior:'smooth' })}
              >
                See Sample Report
              </button>
            </div>

            {/* Trust row */}
            <div className="flex gap-4.5 mt-5 flex-wrap">
              {[
                { icon:CheckCircle2, text:'No sign-up required' },
                { icon:Shield,       text:'Data never stored'   },
                { icon:Zap,          text:'Results in ~10s'     },
              ].map((t,i) => (
                <span key={i} className="flex items-center gap-1.25 text-[0.72rem] text-subtle font-medium">
                  <t.icon size={12} color="#22C55E" /> {t.text}
                </span>
              ))}
            </div>
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div className="animate-slide-left flex flex-col gap-2">

            {/* Upload card */}
            <Card id="upload-card" className="p-6.5 shadow-[0_12px_40px_rgba(81,71,229,0.13)] border-[1.5px] border-border">
              <div className="flex items-center gap-3 mb-5">
                <LogoMark size={38} />
                <div>
                  <p className="font-bold text-[0.95rem] text-navy m-0">Analyze Your Resume</p>
                  <p className="text-[0.72rem] text-subtle mt-0.5 mb-0">AI scoring · ATS simulation · Interview prep</p>
                </div>
              </div>
              <UploadSection onSubmit={onStart} />
            </Card>
          </div>
        </div>

        {/* ── STATS STRIP ── */}
        <div className="grid grid-cols-1 min-[480px]:grid-cols-2 md:grid-cols-4 gap-8 mt-8 pt-6 border-t border-border">
          {[
            { value:'8',              label:'ATS Checks Per Report', icon:BarChart3,   color:'#5147E5' },
            { value:'5',              label:'AI Coaching Tools',    icon:Brain,       color:'#22C55E' },
            { value:'<10s',           label:'Analysis Time',        icon:Zap,         color:'#F59E0B' },
            { value:'Llama 3.3-70b',  label:'Powered By',           icon:ShieldCheck, color:'#3B82F6' },
          ].map((s,i) => (
            <div key={i} className="text-center">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2.5" style={{ background: s.color + '14', border: `1px solid ${s.color}28` }}>
                <s.icon size={18} color={s.color} />
              </div>
              <div className="text-[1.6rem] font-extrabold text-navy leading-tight">{s.value}</div>
              <div className="text-[0.75rem] text-subtle mt-1 font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}


/* ────────────────────────────────────────────
   ROOT APP
──────────────────────────────────────────── */
export default function App() {
  const { data, loading, error, progress, run, reset, loadAnalysis } = useAnalysis()
  return (
    <div className="min-h-screen font-sans">
      <Header onLogoClick={reset} />
      <main>
        {loading && <LoadingScreen progress={progress} />}
        {error && !loading && (
          <div className="min-h-screen bg-bg flex items-center justify-center pt-[62px]">
            <Card className="p-9 text-center max-w-[400px]">
              <div className="w-13 h-13 bg-danger-bg border border-danger-border rounded-xl flex items-center justify-center mx-auto mb-4.5">
                <XIcon size={22} color="#EF4444" />
              </div>
              <h3 className="font-bold text-navy mb-2">Analysis Failed</h3>
              <p className="text-danger text-[0.875rem] mb-5.5 leading-[1.6]">{error}</p>
              <button onClick={reset} className="btn-primary w-full justify-center">Try Again</button>
            </Card>
          </div>
        )}
        {!loading && data && <ResultsDashboard data={data} onReset={reset} onSelectAnalysis={loadAnalysis} />}
        {!loading && !data && !error && <HeroSection onStart={(f,jd,jf) => run(f,jd,jf)} />}
      </main>
    </div>
  )
}
