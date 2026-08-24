import React, { useState, useEffect } from 'react'
import { Briefcase, MapPin, ExternalLink, Globe, Search, Building2, Clock, ChevronRight } from 'lucide-react'
import { getJobRecommendations } from '../services/api'

const TABS = [
  { key: 'all',    label: 'All Jobs' },
  { key: 'india',  label: 'India' },
  { key: 'remote', label: 'Remote' },
  { key: 'us',     label: 'US' },
  { key: 'uk',     label: 'UK' },
]

const LOCATIONS = ['India', 'Remote', 'United States', 'United Kingdom', 'Singapore', 'Canada']

function matchBadgeStyle(score) {
  if (score >= 70) return { background:'#F0FDF4', border:'1px solid #BBF7D0', color:'#16A34A' }
  if (score >= 40) return { background:'#FFFBEB', border:'1px solid #FDE68A', color:'#D97706' }
  return { background:'#F5F6FA', border:'1px solid #E8EAF0', color:'#9CA3AF' }
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  try {
    const days = Math.floor((new Date() - new Date(dateStr)) / 86400000)
    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days}d ago`
    if (days < 30) return `${Math.floor(days / 7)}w ago`
    return `${Math.floor(days / 30)}mo ago`
  } catch { return '' }
}

function JobCard({ job }) {
  const [expanded, setExpanded] = useState(false)
  const ms = matchBadgeStyle(job.match_score)

  return (
    <div
      className="ev-card"
      onClick={() => setExpanded(!expanded)}
      style={{ cursor:'pointer', padding:18, transition:'all 0.15s' }}
      onMouseEnter={e => e.currentTarget.style.boxShadow='0 4px 16px rgba(0,0,0,0.1)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow=''}
    >
      <div style={{ display:'flex', alignItems:'flex-start', gap:14 }}>
        {/* Logo */}
        <div style={{ width:40, height:40, borderRadius:10, border:'1px solid #E8EAF0', background:'#F8F9FC', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, overflow:'hidden' }}>
          {job.logo ? (
            <img src={job.logo} alt={job.company} style={{ width:'100%', height:'100%', objectFit:'contain', padding:4 }} onError={e => e.target.style.display='none'} />
          ) : (
            <Building2 size={16} color="#D1D5DB" />
          )}
        </div>

        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:10 }}>
            <div style={{ minWidth:0 }}>
              <h3 style={{ fontWeight:600, fontSize:'0.875rem', color:'#1A1D2E', margin:'0 0 2px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {job.title}
              </h3>
              <p style={{ fontSize:'0.78rem', color:'#6B7280', margin:0 }}>{job.company}</p>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
              {job.match_score > 0 && (
                <span style={{ fontSize:'0.68rem', fontWeight:700, padding:'3px 9px', borderRadius:99, ...ms }}>
                  {job.match_score}%
                </span>
              )}
              <ChevronRight size={14} color="#D1D5DB" style={{ transform: expanded ? 'rotate(90deg)' : 'none', transition:'transform 0.2s' }} />
            </div>
          </div>

          <div style={{ display:'flex', flexWrap:'wrap', alignItems:'center', gap:8, marginTop:8 }}>
            <span style={{ display:'flex', alignItems:'center', gap:3, fontSize:'0.7rem', color:'#9CA3AF' }}>
              <MapPin size={10} /> {job.location}
            </span>
            {job.type && (
              <span style={{ fontSize:'0.68rem', background:'#EFF6FF', border:'1px solid #BFDBFE', color:'#2563EB', padding:'2px 8px', borderRadius:99 }}>{job.type}</span>
            )}
            {job.remote && (
              <span style={{ fontSize:'0.68rem', background:'#F0FDF4', border:'1px solid #BBF7D0', color:'#16A34A', padding:'2px 8px', borderRadius:99, display:'flex', alignItems:'center', gap:3 }}>
                <Globe size={9} /> Remote
              </span>
            )}
            {job.salary && (
              <span style={{ fontSize:'0.68rem', color:'#16A34A', fontWeight:600 }}>{job.salary}</span>
            )}
            {job.posted_at && (
              <span style={{ display:'flex', alignItems:'center', gap:3, fontSize:'0.68rem', color:'#D1D5DB' }}>
                <Clock size={9} /> {formatDate(job.posted_at)}
              </span>
            )}
          </div>

          {job.tags && job.tags.length > 0 && (
            <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginTop:8 }}>
              {job.tags.slice(0, 5).map((tag, i) => (
                <span key={i} style={{ fontSize:'0.65rem', background:'#F5F6FA', border:'1px solid #E8EAF0', color:'#6B7280', padding:'2px 7px', borderRadius:99 }}>{tag}</span>
              ))}
            </div>
          )}

          {expanded && (
            <div style={{ marginTop:14, paddingTop:14, borderTop:'1px solid #F0F1F5' }} className="animate-fade-in">
              {job.description && (
                <p style={{ fontSize:'0.82rem', color:'#6B7280', lineHeight:1.6, marginBottom:12 }}>{job.description}...</p>
              )}
              <a
                href={job.url}
                target="_blank"
                rel="noreferrer"
                onClick={e => e.stopPropagation()}
                className="btn-primary"
                style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'8px 16px', fontSize:'0.8rem', textDecoration:'none' }}
              >
                Apply Now <ExternalLink size={12} />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function JobRecommendations({ skills }) {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('all')
  const [search, setSearch] = useState('')
  const [location, setLocation] = useState('India')
  const [loaded, setLoaded] = useState(false)

  const loadJobs = async (loc = location) => {
    try {
      setLoading(true)
      setError(null)
      const data = await getJobRecommendations(skills, loc)
      setJobs(data.jobs || [])
      setLoaded(true)
    } catch (e) {
      setError('Could not load jobs. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (skills?.length > 0) loadJobs('India')
  }, [])

  const filtered = jobs.filter(job => {
    const matchesTab = activeTab === 'all' || job.region === activeTab
    const matchesSearch = !search ||
      job.title.toLowerCase().includes(search.toLowerCase()) ||
      job.company.toLowerCase().includes(search.toLowerCase())
    return matchesTab && matchesSearch
  })

  const tabCounts = TABS.reduce((acc, tab) => {
    acc[tab.key] = tab.key === 'all' ? jobs.length : jobs.filter(j => j.region === tab.key).length
    return acc
  }, {})

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

      {/* Header card */}
      <div className="ev-card" style={{ padding:20 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <Briefcase size={18} color="#5147E5" />
            <h2 style={{ fontWeight:700, fontSize:'1rem', color:'#1A1D2E', margin:0 }}>Live Job Recommendations</h2>
            {loaded && !loading && (
              <span className="ev-badge ev-badge-accent" style={{ fontSize:'0.65rem' }}>{jobs.length} jobs</span>
            )}
          </div>
          <span style={{ fontSize:'0.68rem', color:'#9CA3AF' }}>LinkedIn · Indeed · Glassdoor</span>
        </div>

        <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
          <select
            value={location}
            onChange={e => setLocation(e.target.value)}
            className="ev-input"
            style={{ width:'auto', padding:'8px 12px', fontSize:'0.82rem' }}
          >
            {LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
          </select>

          <div style={{ flex:1, position:'relative', minWidth:160 }}>
            <Search size={13} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#9CA3AF' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search title or company..."
              className="ev-input"
              style={{ paddingLeft:30, width:'100%', boxSizing:'border-box', fontSize:'0.82rem' }}
            />
          </div>

          <button
            onClick={() => loadJobs(location)}
            disabled={loading}
            className="btn-primary"
            style={{ padding:'8px 18px', fontSize:'0.82rem', display:'flex', alignItems:'center', gap:6, opacity: loading ? 0.6 : 1 }}
          >
            <Search size={13} />
            {loading ? 'Searching...' : loaded ? 'Refresh' : 'Find Jobs'}
          </button>
        </div>
      </div>

      {/* Empty state */}
      {!loaded && !loading && (
        <div className="ev-card" style={{ padding:48, textAlign:'center' }}>
          <Briefcase size={32} color="#E8EAF0" style={{ margin:'0 auto 12px' }} />
          <p style={{ color:'#9CA3AF', fontSize:'0.875rem', marginBottom:4 }}>Click "Find Jobs" to search real-time listings</p>
          <p style={{ color:'#D1D5DB', fontSize:'0.75rem' }}>Jobs matched to your skills from LinkedIn, Indeed & Glassdoor</p>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {[1,2,3].map(i => (
            <div key={i} className="ev-card" style={{ padding:18 }}>
              <div style={{ display:'flex', gap:14 }}>
                <div className="skeleton-box" style={{ width:40, height:40, borderRadius:10, flexShrink:0 }} />
                <div style={{ flex:1 }}>
                  <div className="skeleton-box" style={{ width:'60%', height:14, borderRadius:6, marginBottom:8 }} />
                  <div className="skeleton-box" style={{ width:'40%', height:11, borderRadius:6 }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="ev-card" style={{ padding:20, textAlign:'center', borderColor:'#FECACA' }}>
          <p style={{ color:'#EF4444', fontSize:'0.875rem', marginBottom:8 }}>{error}</p>
          <button onClick={() => loadJobs()} style={{ fontSize:'0.75rem', color:'#5147E5', background:'none', border:'none', cursor:'pointer', textDecoration:'underline' }}>Try again</button>
        </div>
      )}

      {/* Results */}
      {loaded && !loading && (
        <>
          {/* Tab bar */}
          <div className="ev-tabs" style={{ paddingBottom:0, borderBottom:'1px solid #E8EAF0' }}>
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`ev-tab${activeTab === tab.key ? ' active' : ''}`}
                style={{ display:'flex', alignItems:'center', gap:6 }}
              >
                {tab.label}
                <span style={{
                  fontSize:'0.62rem', fontWeight:700, padding:'1px 6px', borderRadius:99,
                  background: activeTab === tab.key ? 'rgba(255,255,255,0.25)' : '#F0F1F5',
                  color: activeTab === tab.key ? '#fff' : '#9CA3AF',
                }}>
                  {tabCounts[tab.key]}
                </span>
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="ev-card" style={{ padding:40, textAlign:'center' }}>
              <Briefcase size={28} color="#E8EAF0" style={{ margin:'0 auto 10px' }} />
              <p style={{ color:'#9CA3AF', fontSize:'0.875rem' }}>No jobs found for this filter.</p>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {filtered.map((job, i) => <JobCard key={`${job.id}-${i}`} job={job} />)}
            </div>
          )}

          <p style={{ textAlign:'center', fontSize:'0.68rem', color:'#D1D5DB', paddingTop:8 }}>
            Real-time jobs from LinkedIn · Indeed · Glassdoor via JSearch
          </p>
        </>
      )}
    </div>
  )
}
