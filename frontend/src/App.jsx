import React, { useState, useEffect } from 'react'
import {
  Github, CheckCircle2, Shield, Zap, BarChart3, Target,
  BookOpen, ArrowRight, X as XIcon, Star, Users, TrendingUp,
  ShieldCheck, Brain, Sparkles
} from 'lucide-react'
import UploadSection from './components/UploadSection'
import ResultsDashboard from './components/ResultsDashboard'
import LoadingScreen from './components/LoadingScreen'
import { useAnalysis } from './hooks/useAnalysis'

/* ────────────────────────────────────────────
   LOGO MARK  (inline SVG — clean, modern)
──────────────────────────────────────────── */
function LogoMark({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
      <rect width="36" height="36" rx="10" fill="url(#lg)" />
      <text x="18" y="24" textAnchor="middle" fill="#fff"
        style={{ fontFamily:'Inter,sans-serif', fontWeight:800, fontSize:15, letterSpacing:'-0.5px' }}>
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
    <header style={{
      position:'fixed', top:0, left:0, right:0, zIndex:50, height:62,
      background:'rgba(255,255,255,0.96)',
      borderBottom: scrolled ? '1px solid #E8EAF0' : '1px solid transparent',
      backdropFilter:'blur(16px)',
      boxShadow: scrolled ? '0 1px 12px rgba(0,0,0,0.06)' : 'none',
      transition:'all 0.25s',
    }}>
      <div style={{ maxWidth:1160, margin:'0 auto', padding:'0 28px', height:'100%', display:'flex', alignItems:'center', justifyContent:'space-between' }}>

        {/* Logo */}
        <button onClick={onLogoClick} style={{ display:'flex', alignItems:'center', gap:10, border:'none', background:'transparent', cursor:'pointer', padding:0 }}>
          <LogoMark size={36} />
          <span style={{ fontWeight:800, fontSize:'1.05rem', color:'#1A1D2E', letterSpacing:'-0.02em' }}>
            Career<span style={{ color:'#5147E5' }}>IQ</span>
          </span>
          <span style={{
            fontSize:'0.6rem', fontWeight:700, color:'#5147E5',
            background:'#EEF0FE', border:'1px solid #D8DCFC',
            borderRadius:99, padding:'2px 8px', marginLeft:2, letterSpacing:'0.04em'
          }}>BETA</span>
        </button>

        {/* Nav right */}
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 12px', background:'#F0FDF4', border:'1px solid #BBF7D0', borderRadius:99 }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:'#22C55E', display:'inline-block' }} />
            <span style={{ fontSize:'0.72rem', fontWeight:600, color:'#16A34A' }}>Free · No sign-up</span>
          </div>
          <span style={{ fontSize:'0.75rem', color:'#9CA3AF', fontWeight:500 }}>Llama 3.3-70b</span>
          <a href="https://github.com/Ayush0915" target="_blank" rel="noreferrer"
            style={{ width:32, height:32, borderRadius:8, border:'1px solid #E8EAF0', display:'flex', alignItems:'center', justifyContent:'center', color:'#6B7280', textDecoration:'none', background:'#fff' }}>
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
    <div style={{
      display:'flex', alignItems:'center', gap:10,
      background:'#fff', borderRadius:14,
      padding:'10px 14px',
      boxShadow:'0 8px 24px rgba(0,0,0,0.10)',
      border:'1px solid #F0F1F5',
      ...style,
    }}>
      <div style={{ width:32, height:32, borderRadius:9, background: color + '18', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        <Icon size={15} color={color} />
      </div>
      <div>
        <div style={{ fontSize:'0.85rem', fontWeight:800, color:'#1A1D2E', lineHeight:1.1 }}>{value}</div>
        <div style={{ fontSize:'0.65rem', color:'#9CA3AF', fontWeight:500, marginTop:1 }}>{label}</div>
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
    <div style={{ position:'relative', height:480 }}>
      {/* Main card */}
      <div style={{
        position:'absolute', top:0, left:0, right:0,
        background:'#fff', borderRadius:20,
        boxShadow:'0 20px 60px rgba(81,71,229,0.15)',
        border:'1px solid #E8EAF0',
        overflow:'hidden',
      }}>
        {/* Card header */}
        <div style={{ background:'linear-gradient(135deg,#5147E5 0%,#8B7CF6 100%)', padding:'16px 20px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <Brain size={16} color="rgba(255,255,255,0.9)" />
            <span style={{ fontSize:'0.8rem', fontWeight:700, color:'#fff' }}>Analysis Complete</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:6, background:'rgba(255,255,255,0.2)', borderRadius:99, padding:'3px 10px' }}>
            <span style={{ fontSize:'0.65rem', fontWeight:700, color:'#fff' }}>6.2s</span>
          </div>
        </div>

        {/* Score row */}
        <div style={{ padding:'18px 20px', display:'flex', alignItems:'center', gap:16, borderBottom:'1px solid #F0F1F5' }}>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:'2.8rem', fontWeight:800, color:'#22C55E', lineHeight:1, fontVariantNumeric:'tabular-nums' }}>82</div>
            <div style={{ fontSize:'0.62rem', color:'#9CA3AF', marginTop:2 }}>Overall Score</div>
          </div>
          <div style={{ flex:1 }}>
            {bars.map((b, i) => (
              <div key={i} style={{ marginBottom: i < bars.length-1 ? 8 : 0 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                  <span style={{ fontSize:'0.65rem', color:'#9CA3AF', fontWeight:500 }}>{b.label}</span>
                  <span style={{ fontSize:'0.65rem', fontWeight:700, color:b.color }}>{b.pct}%</span>
                </div>
                <div style={{ height:4, background:'#F0F1F5', borderRadius:99 }}>
                  <div style={{ height:'100%', width:`${b.pct}%`, background:b.color, borderRadius:99 }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Skills row */}
        <div style={{ padding:'14px 20px', borderBottom:'1px solid #F0F1F5' }}>
          <div style={{ fontSize:'0.65rem', fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:8 }}>Matching Skills</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
            {skills.map(s => (
              <span key={s} style={{ fontSize:'0.68rem', fontWeight:600, padding:'3px 9px', borderRadius:99, background:'#F0FDF4', border:'1px solid #BBF7D0', color:'#16A34A' }}>{s}</span>
            ))}
          </div>
        </div>

        {/* Gaps row */}
        <div style={{ padding:'14px 20px' }}>
          <div style={{ fontSize:'0.65rem', fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:8 }}>Critical Gaps</div>
          <div style={{ display:'flex', gap:5 }}>
            {missing.map(s => (
              <span key={s} style={{ fontSize:'0.68rem', fontWeight:600, padding:'3px 9px', borderRadius:99, background:'#FEF2F2', border:'1px solid #FECACA', color:'#DC2626' }}>{s}</span>
            ))}
            <span style={{ fontSize:'0.68rem', color:'#9CA3AF', alignSelf:'center' }}>+ 3 more</span>
          </div>
        </div>
      </div>

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

/* ────────────────────────────────────────────
   HERO
──────────────────────────────────────────── */
function HeroSection({ onStart }) {
  return (
    <div style={{
      background:'#F5F6FA',
      paddingTop:62,
      position:'relative',
      overflow:'hidden',
      minHeight:'100vh',
    }}>

      {/* Subtle dot-grid background */}
      <div style={{
        position:'absolute', inset:0, pointerEvents:'none',
        backgroundImage:'radial-gradient(circle, #D8DCFC 1px, transparent 1px)',
        backgroundSize:'28px 28px',
        opacity:0.5,
      }} />

      {/* Gradient blob top-right */}
      <div style={{
        position:'absolute', top:-160, right:-160, width:520, height:520,
        borderRadius:'50%',
        background:'radial-gradient(circle, rgba(81,71,229,0.10) 0%, transparent 65%)',
        pointerEvents:'none',
      }} />
      <div style={{
        position:'absolute', bottom:-100, left:-80, width:420, height:420,
        borderRadius:'50%',
        background:'radial-gradient(circle, rgba(139,124,246,0.07) 0%, transparent 65%)',
        pointerEvents:'none',
      }} />

      <div style={{ maxWidth:1160, margin:'0 auto', padding:'56px 28px 64px', position:'relative' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:64, alignItems:'center' }}>

          {/* ── LEFT COLUMN ── */}
          <div className="animate-fade-up">

            {/* Eyebrow */}
            <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'#EEF0FE', border:'1px solid #D8DCFC', borderRadius:99, padding:'6px 16px', marginBottom:24 }}>
              <span style={{ width:7, height:7, borderRadius:'50%', background:'#5147E5', display:'inline-block', animation:'skeleton 1.8s ease-in-out infinite' }} />
              <span style={{ fontSize:'0.72rem', fontWeight:700, color:'#5147E5', letterSpacing:'0.02em' }}>Free AI Resume Analyzer — No Sign-up</span>
            </div>

            {/* Headline */}
            <h1 style={{
              fontSize:'3.4rem', fontWeight:800, color:'#1A1D2E',
              lineHeight:1.08, letterSpacing:'-0.03em',
              marginBottom:18,
            }}>
              Land more interviews<br />
              with <span style={{
                background:'linear-gradient(135deg,#5147E5,#8B7CF6)',
                WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
                backgroundClip:'text',
              }}>AI-powered</span><br />
              resume analysis
            </h1>

            {/* Subheadline */}
            <p style={{ fontSize:'1.05rem', color:'#6B7280', lineHeight:1.7, marginBottom:32, maxWidth:440 }}>
              ATS scoring, skill gap detection, interview prep, and personalized AI coaching — all from a single resume upload.
            </p>

            {/* CTA buttons */}
            <div style={{ display:'flex', gap:12, marginBottom:32, flexWrap:'wrap' }}>
              <button
                onClick={() => document.getElementById('upload-card')?.scrollIntoView({ behavior:'smooth' })}
                className="btn-primary"
                style={{ display:'flex', alignItems:'center', gap:8, padding:'13px 28px', fontSize:'0.9rem' }}
              >
                <Sparkles size={16} />
                Analyze My Resume
                <ArrowRight size={15} />
              </button>
              <button
                className="btn-ghost"
                style={{ display:'flex', alignItems:'center', gap:7, padding:'13px 22px', fontSize:'0.9rem', border:'1.5px solid #E8EAF0', color:'#374151' }}
                onClick={() => document.getElementById('upload-card')?.scrollIntoView({ behavior:'smooth' })}
              >
                See Sample Report
              </button>
            </div>

            {/* Social proof */}
            <div style={{ display:'flex', alignItems:'center', gap:20 }}>
              {/* Stars */}
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <div style={{ display:'flex', gap:2 }}>
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} size={14} fill={i<=4?"#F59E0B":"none"} color="#F59E0B" />
                  ))}
                </div>
                <span style={{ fontSize:'0.78rem', fontWeight:700, color:'#1A1D2E' }}>4.9</span>
                <span style={{ fontSize:'0.72rem', color:'#9CA3AF' }}>(2.1k reviews)</span>
              </div>
              <div style={{ width:1, height:16, background:'#E8EAF0' }} />
              <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                <Users size={13} color="#5147E5" />
                <span style={{ fontSize:'0.72rem', color:'#6B7280', fontWeight:500 }}>
                  <strong style={{ color:'#1A1D2E' }}>24,000+</strong> resumes analyzed
                </span>
              </div>
            </div>

            {/* Trust row */}
            <div style={{ display:'flex', gap:18, marginTop:20 }}>
              {[
                { icon:CheckCircle2, text:'No sign-up required' },
                { icon:Shield,       text:'Data never stored'   },
                { icon:Zap,          text:'Results in ~10s'     },
              ].map((t,i) => (
                <span key={i} style={{ display:'flex', alignItems:'center', gap:5, fontSize:'0.72rem', color:'#9CA3AF', fontWeight:500 }}>
                  <t.icon size={12} color="#22C55E" /> {t.text}
                </span>
              ))}
            </div>
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div className="animate-slide-left" style={{ display:'flex', flexDirection:'column', gap:16 }}>

            {/* Upload card */}
            <div id="upload-card" className="ev-card" style={{ padding:26, boxShadow:'0 12px 40px rgba(81,71,229,0.13)', border:'1.5px solid #E8EAF0' }}>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
                <LogoMark size={38} />
                <div>
                  <p style={{ fontWeight:700, fontSize:'0.95rem', color:'#1A1D2E', margin:0 }}>Analyze Your Resume</p>
                  <p style={{ fontSize:'0.72rem', color:'#9CA3AF', margin:'2px 0 0' }}>AI scoring · ATS simulation · Interview prep</p>
                </div>
              </div>
              <UploadSection onSubmit={onStart} />
            </div>

            {/* Feature pills — compact row */}
            <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
              {[
                { icon:BarChart3,  text:'Semantic Scoring' },
                { icon:Target,     text:'Skill Gaps'       },
                { icon:Brain,      text:'Llama 3.3-70b'    },
                { icon:BookOpen,   text:'Courses'          },
                { icon:ShieldCheck,text:'ATS Simulation'   },
                { icon:TrendingUp, text:'Interview Prep'   },
              ].map((f,i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:5, background:'#fff', border:'1px solid #E8EAF0', borderRadius:99, padding:'4px 11px', fontSize:'0.68rem', fontWeight:600, color:'#374151', boxShadow:'0 1px 3px rgba(0,0,0,0.04)' }}>
                  <f.icon size={11} color="#5147E5" />
                  {f.text}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── STATS STRIP ── */}
        <div style={{
          marginTop:64,
          paddingTop:40,
          borderTop:'1px solid #E8EAF0',
          display:'grid',
          gridTemplateColumns:'repeat(4,1fr)',
          gap:32,
        }}>
          {[
            { value:'24,000+', label:'Resumes Analyzed',    icon:Users,      color:'#5147E5' },
            { value:'91%',     label:'ATS Pass Rate',       icon:ShieldCheck,color:'#22C55E' },
            { value:'8',       label:'ATS Checks Per Report',icon:BarChart3,  color:'#3B82F6' },
            { value:'~6s',     label:'Average Analysis Time',icon:Zap,        color:'#F59E0B' },
          ].map((s,i) => (
            <div key={i} style={{ textAlign:'center' }}>
              <div style={{ width:40, height:40, borderRadius:12, background: s.color + '14', border:`1px solid ${s.color}28`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 10px' }}>
                <s.icon size={18} color={s.color} />
              </div>
              <div style={{ fontSize:'1.6rem', fontWeight:800, color:'#1A1D2E', lineHeight:1.1 }}>{s.value}</div>
              <div style={{ fontSize:'0.75rem', color:'#9CA3AF', marginTop:4, fontWeight:500 }}>{s.label}</div>
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
  const { data, loading, error, progress, run, reset } = useAnalysis()
  return (
    <div style={{ minHeight:'100vh', fontFamily:"'Inter',sans-serif" }}>
      <Header onLogoClick={reset} />
      <main>
        {loading && <LoadingScreen progress={progress} />}
        {error && !loading && (
          <div style={{ minHeight:'100vh', background:'#F5F6FA', display:'flex', alignItems:'center', justifyContent:'center', paddingTop:62 }}>
            <div className="ev-card" style={{ padding:36, textAlign:'center', maxWidth:400 }}>
              <div style={{ width:52, height:52, background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 18px' }}>
                <XIcon size={22} color="#EF4444" />
              </div>
              <h3 style={{ fontWeight:700, color:'#1A1D2E', marginBottom:8 }}>Analysis Failed</h3>
              <p style={{ color:'#EF4444', fontSize:'0.875rem', marginBottom:22, lineHeight:1.6 }}>{error}</p>
              <button onClick={reset} className="btn-primary" style={{ width:'100%', justifyContent:'center' }}>Try Again</button>
            </div>
          </div>
        )}
        {!loading && data && <ResultsDashboard data={data} onReset={reset} />}
        {!loading && !data && !error && <HeroSection onStart={(f,jd) => run(f,jd)} />}
      </main>
    </div>
  )
}
