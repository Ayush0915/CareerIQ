import React, { useState, useEffect } from 'react'
import { Briefcase, MapPin, ExternalLink, Loader2, Globe, Wifi, Search, Building2, Clock, ChevronRight, IndianRupee } from 'lucide-react'
import { getJobRecommendations } from '../services/api'

const TABS = [
  { key: 'all', label: 'All Jobs' },
  { key: 'india', label: '🇮🇳 India' },
  { key: 'remote', label: '🌐 Remote' },
  { key: 'us', label: '🇺🇸 US' },
  { key: 'uk', label: '🇬🇧 UK' },
]

const LOCATIONS = ['India', 'Remote', 'United States', 'United Kingdom', 'Singapore', 'Canada']

function JobCard({ job, index }) {
  const [expanded, setExpanded] = useState(false)

  const matchColor = job.match_score >= 70
    ? 'text-green-600 bg-green-50 border-green-200'
    : job.match_score >= 40
    ? 'text-amber-600 bg-amber-50 border-amber-200'
    : 'text-gray-400 bg-gray-50 border-gray-200'

  const formatDate = (dateStr) => {
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

  return (
    <div
      className="card hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group overflow-hidden"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Company Logo */}
          <div className="w-10 h-10 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-center shrink-0 overflow-hidden">
            {job.logo ? (
              <img src={job.logo} alt={job.company} className="w-full h-full object-contain p-1" onError={e => e.target.style.display='none'} />
            ) : (
              <Building2 size={18} className="text-gray-300" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-semibold text-gray-800 group-hover:text-primary transition-colors leading-tight">
                  {job.title}
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">{job.company}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {job.match_score > 0 && (
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${matchColor}`}>
                    {job.match_score}%
                  </span>
                )}
                <ChevronRight
                  size={16}
                  className={`text-gray-300 transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <MapPin size={11} /> {job.location}
              </span>
              {job.type && (
                <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-100">
                  {job.type}
                </span>
              )}
              {job.remote && (
                <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full border border-green-100">
                  Remote
                </span>
              )}
              {job.salary && (
                <span className="text-xs text-green-600 font-medium flex items-center gap-0.5">
                  {job.salary}
                </span>
              )}
              {job.posted_at && (
                <span className="flex items-center gap-1 text-xs text-gray-300">
                  <Clock size={10} /> {formatDate(job.posted_at)}
                </span>
              )}
              {job.source && (
                <span className="text-xs text-gray-300">via {job.source}</span>
              )}
            </div>

            {job.tags && job.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {job.tags.slice(0, 5).map((tag, i) => (
                  <span key={i} className="text-xs bg-gray-50 border border-gray-200 text-gray-500 px-2 py-0.5 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Expanded Details */}
        {expanded && (
          <div className="mt-4 pt-4 border-t border-gray-100 animate-fade-up">
            {job.description && (
              <p className="text-sm text-gray-600 leading-relaxed mb-4">{job.description}...</p>
            )}
            <a
              href={job.url}
              target="_blank"
              rel="noreferrer"
              onClick={e => e.stopPropagation()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-dark transition-colors"
            >
              Apply Now <ExternalLink size={14} />
            </a>
          </div>
        )}
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
    acc[tab.key] = tab.key === 'all'
      ? jobs.length
      : jobs.filter(j => j.region === tab.key).length
    return acc
  }, {})

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Briefcase size={20} className="text-primary" />
            <h2 className="font-bold text-gray-800 text-lg">Live Job Recommendations</h2>
            {loaded && !loading && (
              <span className="text-xs bg-primary-light text-primary px-2 py-0.5 rounded-full font-medium">
                {jobs.length} jobs found
              </span>
            )}
          </div>
          <span className="text-xs text-gray-400">Powered by LinkedIn · Indeed · Glassdoor</span>
        </div>

        {/* Location + Search + Fetch */}
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={location}
            onChange={e => setLocation(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-primary bg-white text-gray-600"
          >
            {LOCATIONS.map(loc => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>

          <div className="flex-1 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search job title or company..."
              className="w-full text-sm border border-gray-200 rounded-lg pl-8 pr-3 py-2 focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          <button
            onClick={() => loadJobs(location)}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            {loading
              ? <><Loader2 size={14} className="animate-spin" /> Searching...</>
              : <><Search size={14} /> {loaded ? 'Refresh' : 'Find Jobs'}</>
            }
          </button>
        </div>
      </div>

      {/* Not loaded yet */}
      {!loaded && !loading && (
        <div className="card p-12 text-center">
          <Briefcase size={36} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm mb-1">Click "Find Jobs" to search real-time listings</p>
          <p className="text-gray-300 text-xs">Jobs matched to your skills from LinkedIn, Indeed & Glassdoor</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="card p-12 text-center">
          <Loader2 size={28} className="animate-spin text-primary mx-auto mb-3" />
          <p className="text-gray-500 text-sm font-medium">Searching real-time jobs matching your skills...</p>
          <p className="text-gray-300 text-xs mt-1">Checking LinkedIn · Indeed · Glassdoor</p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="card p-6 text-center border-red-100">
          <p className="text-red-500 text-sm mb-2">{error}</p>
          <button onClick={() => loadJobs()} className="text-xs text-primary underline">Try again</button>
        </div>
      )}

      {/* Results */}
      {loaded && !loading && (
        <>
          {/* Tabs */}
          <div className="flex gap-1 overflow-x-auto pb-1">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-gray-500 hover:bg-gray-100 bg-white border border-gray-200'
                }`}
              >
                {tab.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-400'
                }`}>
                  {tabCounts[tab.key]}
                </span>
              </button>
            ))}
          </div>

          {/* Job Cards */}
          {filtered.length === 0 ? (
            <div className="card p-10 text-center">
              <Briefcase size={32} className="text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">No jobs found for this filter.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((job, i) => (
                <JobCard key={`${job.id}-${i}`} job={job} index={i} />
              ))}
            </div>
          )}

          <p className="text-center text-xs text-gray-300 pt-2">
            Real-time jobs from LinkedIn · Indeed · Glassdoor via JSearch
          </p>
        </>
      )}
    </div>
  )
}