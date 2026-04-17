import React, { useState, useEffect } from 'react'
import { BrainCircuit, Github, CheckCircle2, Shield, Zap, BarChart3, Target, BookOpen, ArrowRight, X as XIcon } from 'lucide-react'
import UploadSection from './components/UploadSection'
import ResultsDashboard from './components/ResultsDashboard'
import LoadingScreen from './components/LoadingScreen'
import { useAnalysis } from './hooks/useAnalysis'

function Header({ onLogoClick }) {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', fn); return () => window.removeEventListener('scroll', fn)
  }, [])
  return (
    <header style={{
      position:'fixed', top:0, left:0, right:0, zIndex:50, height:60,
      background: scrolled ? 'rgba(255,255,255,0.97)' : '#fff',
      borderBottom: '1px solid #E8EAF0',
      backdropFilter:'blur(12px)',
      boxShadow: scrolled ? '0 1px 8px rgba(0,0,0,0.06)' : 'none',
      transition:'all 0.2s',
    }}>
      <div style={{ maxWidth:1180, margin:'0 auto', padding:'0 24px', height:'100%', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <button onClick={onLogoClick} style={{ display:'flex', alignItems:'center', gap:10, border:'none', background:'transparent', cursor:'pointer' }}>
          <div style={{ width:34, height:34, background:'linear-gradient(135deg,#5147E5,#8B7CF6)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <BrainCircuit size={17} color="#fff" />
          </div>
          <span style={{ fontWeight:800, fontSize:'1rem', color:'#1A1D2E' }}>
            Career<span style={{ color:'#5147E5' }}>IQ</span>
          </span>
          <span style={{ fontSize:'0.65rem', fontWeight:700, color:'#5147E5', background:'#EEF0FE', border:'1px solid #D8DCFC', borderRadius:99, padding:'2px 9px', marginLeft:2 }}>
            BETA
          </span>
        </button>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ fontSize:'0.75rem', color:'#9CA3AF' }}>Powered by Llama 3.3</span>
          <a href="https://github.com" target="_blank" rel="noreferrer"
            style={{ padding:8, borderRadius:8, color:'#6B7280', display:'flex', textDecoration:'none' }}>
            <Github size={16} />
          </a>
        </div>
      </div>
    </header>
  )
}

const FEATURES = [
  { icon: BarChart3,    text:'AI Semantic Scoring',  sub:'BERT embeddings' },
  { icon: Target,       text:'Skill Gap Detection',  sub:'Critical vs optional' },
  { icon: BrainCircuit, text:'LLM Deep Analysis',    sub:'Llama 3.3 · 70B' },
  { icon: BookOpen,     text:'Course Roadmap',        sub:'Auto-curated' },
  { icon: Zap,          text:'ATS Simulation',        sub:'8-point check' },
]

const TRUST = [
  { icon: CheckCircle2, text:'No sign-up required' },
  { icon: Shield,       text:'Data never stored'   },
  { icon: Zap,          text:'Results in ~10s'     },
]

/* ── Fake score-card preview (right column) ── */
function ScorePreview() {
  const cats = [
    { label:'Content',       pct:88, color:'#22C55E' },
    { label:'Sections',      pct:100,color:'#22C55E' },
    { label:'ATS Essentials',pct:74, color:'#F59E0B' },
    { label:'Skill Gaps',    pct:60, color:'#EF4444' },
  ]
  return (
    <div className="ev-card" style={{ width:260, padding:'24px 20px', boxShadow:'0 8px 32px rgba(81,71,229,0.12)' }}>
      <p style={{ fontSize:'0.68rem', fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.08em', textAlign:'center', marginBottom:6 }}>Your Score</p>
      <div style={{ textAlign:'center', marginBottom:4 }}>
        <span style={{ fontSize:'2.4rem', fontWeight:800, color:'#22C55E', fontVariantNumeric:'tabular-nums' }}>82</span>
        <span style={{ fontSize:'1.2rem', color:'#9CA3AF', fontWeight:600 }}>/100</span>
      </div>
      <p style={{ textAlign:'center', fontSize:'0.72rem', color:'#9CA3AF', marginBottom:16 }}>6 areas to improve</p>
      <div style={{ height:1, background:'#F0F1F5', marginBottom:16 }} />
      {cats.map((c,i) => (
        <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 0', borderBottom: i<cats.length-1 ? '1px solid #F0F1F5' : 'none' }}>
          <span style={{ fontSize:'0.68rem', fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.07em' }}>{c.label}</span>
          <span style={{ fontSize:'0.7rem', fontWeight:700, padding:'2px 9px', borderRadius:99, background: c.pct>=85?'#F0FDF4':c.pct>=65?'#FFFBEB':'#FEF2F2', color: c.pct>=85?'#16A34A':c.pct>=65?'#D97706':'#DC2626' }}>
            {c.pct}%
          </span>
        </div>
      ))}
      <div style={{ marginTop:16, padding:'12px', background:'#EEF0FE', borderRadius:10 }}>
        <p style={{ fontSize:'0.72rem', fontWeight:600, color:'#3D34C4', textAlign:'center' }}>
          See full report below <ArrowRight size={11} style={{ display:'inline', verticalAlign:'middle' }} />
        </p>
      </div>
    </div>
  )
}

function HeroSection({ onStart }) {
  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', paddingTop:60, background:'#F5F6FA', position:'relative', overflow:'hidden' }}>
      {/* Background blobs */}
      <div style={{ position:'absolute', top:-100, right:-150, width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle, rgba(81,71,229,0.07) 0%, transparent 65%)', pointerEvents:'none' }} />
      <div style={{ position:'absolute', bottom:-80, left:-80, width:400, height:400, borderRadius:'50%', background:'radial-gradient(circle, rgba(139,92,246,0.05) 0%, transparent 65%)', pointerEvents:'none' }} />

      <div style={{ maxWidth:1100, margin:'0 auto', padding:'48px 24px', width:'100%', display:'grid', gridTemplateColumns:'1fr 1fr', gap:48, alignItems:'center' }}>

        {/* LEFT ── Copy */}
        <div className="animate-fade-up">
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'#EEF0FE', border:'1px solid #D8DCFC', borderRadius:99, padding:'6px 14px', marginBottom:20 }}>
            <span style={{ width:7, height:7, borderRadius:'50%', background:'#5147E5', display:'inline-block', animation:'skeleton 1.5s ease-in-out infinite' }} />
            <span style={{ fontSize:'0.72rem', fontWeight:700, color:'#5147E5' }}>Free AI Resume Analyzer</span>
          </div>

          <h1 style={{ fontSize:'3rem', fontWeight:800, color:'#1A1D2E', lineHeight:1.1, letterSpacing:'-0.02em', marginBottom:16 }}>
            Is your resume
            <br />
            <span className="gradient-text-accent">good enough?</span>
          </h1>

          <p style={{ fontSize:'1rem', color:'#6B7280', lineHeight:1.7, marginBottom:28, maxWidth:420 }}>
            Upload your resume and a job description. Get instant ATS scoring, AI skill gap analysis, course recommendations, and personalized coaching in under 10 seconds.
          </p>

          {/* Feature pills */}
          <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:28 }}>
            {FEATURES.map((f,i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:6, background:'#fff', border:'1px solid #E8EAF0', borderRadius:99, padding:'5px 12px', fontSize:'0.72rem', fontWeight:600, color:'#374151' }}>
                <f.icon size={12} color="#5147E5" />
                {f.text}
              </div>
            ))}
          </div>

          {/* Trust row */}
          <div style={{ display:'flex', gap:20 }}>
            {TRUST.map((t,i) => (
              <span key={i} style={{ display:'flex', alignItems:'center', gap:5, fontSize:'0.72rem', color:'#9CA3AF', fontWeight:500 }}>
                <t.icon size={12} color="#22C55E" /> {t.text}
              </span>
            ))}
          </div>
        </div>

        {/* RIGHT ── Upload card + score preview */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }} className="animate-slide-left">
          {/* Upload card */}
          <div className="ev-card" style={{ padding:24, boxShadow:'0 8px 32px rgba(81,71,229,0.1)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
              <div style={{ width:36, height:36, background:'linear-gradient(135deg,#5147E5,#8B7CF6)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <BrainCircuit size={16} color="#fff" />
              </div>
              <div>
                <p style={{ fontWeight:700, fontSize:'0.9rem', color:'#1A1D2E' }}>Analyze Your Resume</p>
                <p style={{ fontSize:'0.72rem', color:'#9CA3AF' }}>AI scoring in under 10 seconds</p>
              </div>
            </div>
            <UploadSection onSubmit={onStart} />
          </div>

          {/* Score preview teaser */}
          <div style={{ display:'flex', justifyContent:'center' }}>
            <ScorePreview />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const { data, loading, error, progress, run, reset } = useAnalysis()
  return (
    <div style={{ minHeight:'100vh', fontFamily:"'Inter', sans-serif" }}>
      <Header onLogoClick={reset} />
      <main>
        {loading && <LoadingScreen progress={progress} />}
        {error && !loading && (
          <div style={{ minHeight:'100vh', background:'#F5F6FA', display:'flex', alignItems:'center', justifyContent:'center', paddingTop:60 }}>
            <div className="ev-card" style={{ padding:32, textAlign:'center', maxWidth:400 }}>
              <div style={{ width:48, height:48, background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
                <XIcon size={20} color="#EF4444" />
              </div>
              <h3 style={{ fontWeight:700, color:'#1A1D2E', marginBottom:8 }}>Analysis Failed</h3>
              <p style={{ color:'#EF4444', fontSize:'0.875rem', marginBottom:20, lineHeight:1.6 }}>{error}</p>
              <button onClick={reset} className="btn-primary">Try Again</button>
            </div>
          </div>
        )}
        {!loading && data && <ResultsDashboard data={data} onReset={reset} />}
        {!loading && !data && !error && <HeroSection onStart={(f,jd) => run(f,jd)} />}
      </main>
    </div>
  )
}
