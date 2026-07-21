import React, { useState, lazy, Suspense } from 'react'
import { Target, Brain, BarChart3, RefreshCw, BookOpen, ChevronDown, ChevronUp, MessageSquare, Briefcase, Loader2 } from 'lucide-react'
import ScoreSidebar from './dashboard/ScoreSidebar'
import ScoreFitTab from './dashboard/OverviewTab'
import GapsATSTab from './dashboard/SkillsTab'

// Lazy-loaded tab components for code splitting & faster initial page load
const JobRecommendations = lazy(() => import('./JobRecommendations'))
const CourseRecommendations = lazy(() => import('./CourseRecommendations'))
const InterviewPrep = lazy(() => import('./InterviewPrep'))
const AICoach = lazy(() => import('./AICoach'))
const ATSBreakdown = lazy(() => import('./ATSBreakdown'))
const LLMInsights = lazy(() => import('./LLMInsights'))

const TABS = [
  { id:'score_fit',  label:'Score & Fit', icon:BarChart3, ariaLabel:'Score and fit analysis tab' },
  { id:'gaps_ats',   label:'Gaps & ATS',  icon:Target,    ariaLabel:'Skill gaps and ATS simulation tab' },
  { id:'ai_coach',   label:'AI Coach',    icon:Brain,     ariaLabel:'AI bullet rewriter and interview coach tab' },
  { id:'resources',  label:'Resources',   icon:BookOpen,  ariaLabel:'Job recommendations and learning resources tab' },
]

const scoreColor = v => v >= 75 ? '#22C55E' : v >= 50 ? '#F59E0B' : '#EF4444'

function TabFallback() {
  return (
    <div className="ev-card flex items-center justify-center p-12 gap-3 text-muted text-sm animate-fade-in">
      <Loader2 size={20} className="animate-spin text-accent" aria-hidden="true" /> Loading section...
    </div>
  )
}

/* ── Collapsible Interview Section inside AI Coach ── */
function CollapsibleInterviewSection({ llm }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="ev-card" style={{ overflow:'hidden', padding:0 }}>
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label="Toggle Interview Questions & Prep Guide"
        style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', background:'none', border:'none', cursor:'pointer', textAlign:'left' }}
        onMouseEnter={e => e.currentTarget.style.background='#FAFBFF'}
        onMouseLeave={e => e.currentTarget.style.background='none'}
      >
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:32, height:32, borderRadius:10, background:'linear-gradient(135deg,#5147E5,#8B7CF6)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <MessageSquare size={16} color="#fff" aria-hidden="true" />
          </div>
          <div>
            <h4 style={{ fontWeight:700, fontSize:'0.9rem', color:'#1A1D2E', margin:0 }}>Interview Questions & Prep Guide</h4>
            <p style={{ fontSize:'0.72rem', color:'#9CA3AF', margin:0 }}>Tailored technical questions, STAR tips, and salary insights</p>
          </div>
        </div>
        {open
          ? <ChevronUp size={16} color="#9CA3AF" aria-hidden="true" />
          : <ChevronDown size={16} color="#9CA3AF" aria-hidden="true" />}
      </button>

      {open && (
        <div style={{ padding:'0 20px 20px' }} className="animate-fade-in">
          <InterviewPrep llm={llm} />
        </div>
      )}
    </div>
  )
}

/* ── Combined AI Coach Tab ── */
function AICoachTab({ data }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }} className="animate-fade-up">
      <AICoach analysisData={data} />
      <CollapsibleInterviewSection llm={data.llm_evaluation} />
    </div>
  )
}

/* ── Merged Resources Tab ── */
function ResourcesTab({ data }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:24 }} className="animate-fade-up">
      <div>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
          <div style={{ width:28, height:28, background:'#EEF0FE', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Briefcase size={14} color="#5147E5" aria-hidden="true" />
          </div>
          <h3 style={{ fontWeight:700, fontSize:'1rem', color:'#1A1D2E', margin:0 }}>Live Job Opportunities</h3>
        </div>
        <JobRecommendations skills={data.resume_skills} />
      </div>

      <div>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
          <div style={{ width:28, height:28, background:'#F0FDF4', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <BookOpen size={14} color="#16A34A" aria-hidden="true" />
          </div>
          <h3 style={{ fontWeight:700, fontSize:'1rem', color:'#1A1D2E', margin:0 }}>Personalized Learning & Courses</h3>
        </div>
        <CourseRecommendations
          skillGaps={data.skill_gap_analysis}
          jobDescription={data.job_description}
          resumeText={data.resume_text}
        />
      </div>
    </div>
  )
}

/* ── Thin Container Dashboard ── */
export default function ResultsDashboard({ data, onReset, onSelectAnalysis }) {
  const [activeTab, setActiveTab] = useState('score_fit')
  if (!data) return null

  const clarity = data.signal_noise?.clarity_score ?? 0
  const overall = Math.round(data.semantic_match_score * 0.4 + data.ats_keyword_score * 0.35 + clarity * 0.25)
  const totalGaps = (data.skill_gap_analysis?.critical?.length ?? 0) + (data.skill_gap_analysis?.important?.length ?? 0) + (data.skill_gap_analysis?.optional?.length ?? 0)

  const handleKeyDown = (e, currentIndex) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault()
      const nextIndex = (currentIndex + 1) % TABS.length
      setActiveTab(TABS[nextIndex].id)
      document.getElementById(`tab-${TABS[nextIndex].id}`)?.focus()
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault()
      const prevIndex = (currentIndex - 1 + TABS.length) % TABS.length
      setActiveTab(TABS[prevIndex].id)
      document.getElementById(`tab-${TABS[prevIndex].id}`)?.focus()
    } else if (e.key === 'Home') {
      e.preventDefault()
      setActiveTab(TABS[0].id)
      document.getElementById(`tab-${TABS[0].id}`)?.focus()
    } else if (e.key === 'End') {
      e.preventDefault()
      setActiveTab(TABS[TABS.length - 1].id)
      document.getElementById(`tab-${TABS[TABS.length - 1].id}`)?.focus()
    }
  }

  return (
    <div style={{ minHeight:'100vh', background:'#F5F6FA', paddingTop:62 }}>

      {/* ── Subheader tab bar ── */}
      <div style={{ background:'#fff', borderBottom:'1px solid #E8EAF0', position:'sticky', top:62, zIndex:40 }}>
        <div style={{ maxWidth:1280, margin:'0 auto', padding:'0 28px', height:52, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:16, overflowX:'auto' }}>
            <div className="ev-tabs" role="tablist" aria-label="Dashboard sections">
              {TABS.map((tab, idx) => (
                <button
                  key={tab.id}
                  id={`tab-${tab.id}`}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  aria-controls={`tabpanel-${tab.id}`}
                  aria-label={tab.ariaLabel}
                  tabIndex={activeTab === tab.id ? 0 : -1}
                  onClick={() => setActiveTab(tab.id)}
                  onKeyDown={(e) => handleKeyDown(e, idx)}
                  className={`ev-tab ${activeTab === tab.id ? 'active' : ''}`}
                >
                  <tab.icon size={13} color={activeTab === tab.id ? '#5147E5' : '#6B7280'} aria-hidden="true" />
                  {tab.label}
                  {tab.id === 'resources' && totalGaps > 0 && (
                    <span
                      aria-label={`${totalGaps} gap recommendations`}
                      style={{ fontSize:'0.62rem', fontWeight:700, background: activeTab==='resources'?'#5147E5':'#EEF0FE', color: activeTab==='resources'?'#fff':'#5147E5', borderRadius:99, padding:'1px 6px' }}
                    >
                      {totalGaps}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0, marginLeft:16 }}>
            <span style={{ fontSize:'0.72rem', color:'#9CA3AF', background:'#F5F6FA', border:'1px solid #E8EAF0', padding:'4px 10px', borderRadius:99 }}>
              {data.total_skills_detected} skills detected
            </span>
            <span style={{ fontSize:'0.72rem', fontWeight:700, padding:'4px 10px', borderRadius:99, background:scoreColor(overall)+'18', color:scoreColor(overall) }}>
              {overall}% Match
            </span>
            <button onClick={onReset} className="btn-ghost" style={{ fontSize:'0.75rem', padding:'4px 10px' }} aria-label="Start new analysis">
              <RefreshCw size={12} aria-hidden="true" /> New Analysis
            </button>
          </div>
        </div>
      </div>

      {/* ── Two-column layout ── */}
      <div style={{ maxWidth:1280, margin:'0 auto', display:'flex' }}>
        <ScoreSidebar data={data} activeTab={activeTab} onTabChange={setActiveTab} onSelectAnalysis={onSelectAnalysis} />

        {/* Right content with Suspense lazy loading & ARIA tabpanel */}
        <div
          role="tabpanel"
          id={`tabpanel-${activeTab}`}
          aria-labelledby={`tab-${activeTab}`}
          tabIndex={0}
          style={{ flex:1, minWidth:0, padding:'24px 24px 48px' }}
        >
          <Suspense fallback={<TabFallback />}>
            <div key={activeTab}>
              {activeTab === 'score_fit' && <ScoreFitTab data={data} />}
              {activeTab === 'gaps_ats'   && <GapsATSTab data={data} />}
              {activeTab === 'ai_coach'   && <AICoachTab data={data} />}
              {activeTab === 'resources'  && <ResourcesTab data={data} />}
            </div>
          </Suspense>
        </div>
      </div>
    </div>
  )
}
