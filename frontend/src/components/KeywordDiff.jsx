import React, { useState, useMemo } from 'react'
import { Search, CheckCircle2, AlertTriangle, XCircle, ArrowRight, Filter } from 'lucide-react'
import Card from './ui/Card'
import Badge from './ui/Badge'

function getMatchStatus(jdKeyword, resumeSkills = [], matchingSkills = [], resumeText = '') {
  const normJD = jdKeyword.toLowerCase().trim()
  
  // 1. Exact match in matchingSkills or resumeText
  if (matchingSkills.some(s => s.toLowerCase() === normJD)) {
    return { type: 'exact', matchText: jdKeyword, note: 'Exact match found in resume skills' }
  }

  const exactInText = resumeText && resumeText.toLowerCase().includes(normJD)
  if (exactInText) {
    return { type: 'exact', matchText: jdKeyword, note: 'Exact phrase found in resume text' }
  }

  // 2. Partial / paraphrased match
  const partialInSkills = resumeSkills.find(s => {
    const normS = s.toLowerCase()
    return normS.includes(normJD) || normJD.includes(normS) ||
           (normJD.length > 3 && normS.slice(0, 4) === normJD.slice(0, 4))
  })

  if (partialInSkills) {
    return { type: 'partial', matchText: partialInSkills, note: `Paraphrased as "${partialInSkills}"` }
  }

  const normWords = normJD.split(/[\s\-_]+/).filter(w => w.length > 3)
  if (normWords.length > 0 && resumeText) {
    const textLower = resumeText.toLowerCase()
    const wordFound = normWords.find(w => textLower.includes(w))
    if (wordFound) {
      return { type: 'partial', matchText: wordFound, note: `Partial keyword match "${wordFound}"` }
    }
  }

  // 3. Missing
  return { type: 'missing', matchText: null, note: 'Not detected in resume' }
}

export default function KeywordDiff({ data }) {
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('all')

  const {
    jd_skills = [],
    resume_skills = [],
    matching_skills = [],
    missing_skills = [],
    resume_text = ''
  } = data || {}

  // Process all JD keywords with match status
  const analyzedKeywords = useMemo(() => {
    // Combine jd_skills and missing_skills uniquely
    const allJDKeys = Array.from(new Set([...jd_skills, ...missing_skills]))
    return allJDKeys.map(key => {
      const match = getMatchStatus(key, resume_skills, matching_skills, resume_text)
      return { keyword: key, ...match }
    })
  }, [jd_skills, resume_skills, matching_skills, missing_skills, resume_text])

  const counts = useMemo(() => {
    const exact = analyzedKeywords.filter(k => k.type === 'exact').length
    const partial = analyzedKeywords.filter(k => k.type === 'partial').length
    const missing = analyzedKeywords.filter(k => k.type === 'missing').length
    return { exact, partial, missing, total: analyzedKeywords.length }
  }, [analyzedKeywords])

  const filtered = useMemo(() => {
    return analyzedKeywords.filter(item => {
      const matchesSearch = item.keyword.toLowerCase().includes(search.toLowerCase()) ||
                            (item.matchText && item.matchText.toLowerCase().includes(search.toLowerCase()))
      if (!matchesSearch) return false
      if (filterType === 'exact') return item.type === 'exact'
      if (filterType === 'partial') return item.type === 'partial'
      if (filterType === 'missing') return item.type === 'missing'
      return true
    })
  }, [analyzedKeywords, search, filterType])

  return (
    <div className="flex flex-col gap-5 animate-fade-up">

      {/* Summary Header */}
      <Card padding={20}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="font-bold text-[1rem] text-navy m-0">JD vs. Resume Keyword Diff</h3>
            <p className="text-[0.75rem] text-subtle mt-0.5 m-0">
              Side-by-side comparison of job description phrases against your resume
            </p>
          </div>

          {/* Stat Pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="match">
              <CheckCircle2 size={12} /> {counts.exact} Matched
            </Badge>
            <Badge variant="warn">
              <AlertTriangle size={12} /> {counts.partial} Partial
            </Badge>
            <Badge variant="critical">
              <XCircle size={12} /> {counts.missing} Missing
            </Badge>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-[#F0F1F5]">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle" />
            <input
              type="text"
              placeholder="Filter keywords..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.75 text-[0.8rem] rounded-lg border border-border bg-bg text-navy focus:outline-none focus:border-accent"
            />
          </div>

          <div className="flex items-center gap-1 bg-bg p-1 rounded-lg border border-border">
            {[
              { id: 'all',     label: `All (${counts.total})` },
              { id: 'exact',   label: `Exact (${counts.exact})` },
              { id: 'partial', label: `Partial (${counts.partial})` },
              { id: 'missing', label: `Missing (${counts.missing})` },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilterType(f.id)}
                className={`text-[0.72rem] font-semibold px-2.75 py-1 rounded-md transition-colors ${
                  filterType === f.id ? 'bg-white text-navy shadow-sm' : 'text-subtle hover:text-navy'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Side-by-Side Keyword Comparison Grid */}
      <Card padding={0} className="overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 px-5 py-3 bg-[#FAFBFF] border-b border-[#F0F1F5] text-[0.7rem] font-bold text-subtle uppercase tracking-[0.05em]">
          <div className="col-span-5">Job Description Phrase</div>
          <div className="col-span-2 text-center">Status</div>
          <div className="col-span-5">Resume Match / Evidence</div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-[#F0F1F5] max-h-[440px] overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-subtle text-[0.82rem]">
              No keywords match your current search/filter criteria.
            </div>
          ) : (
            filtered.map((item, idx) => {
              const isExact = item.type === 'exact'
              const isPartial = item.type === 'partial'
              const isMissing = item.type === 'missing'

              return (
                <div
                  key={idx}
                  className={`grid grid-cols-12 px-5 py-3 items-center text-[0.8rem] transition-colors ${
                    isExact ? 'bg-white hover:bg-[#F0FDF4]/40' :
                    isPartial ? 'bg-white hover:bg-[#FFFBEB]/40' :
                    'bg-[#FEF2F2]/20 hover:bg-[#FEF2F2]/40'
                  }`}
                >
                  {/* JD Keyword */}
                  <div className="col-span-5 flex items-center gap-2 pr-3">
                    <span className="font-semibold text-navy">{item.keyword}</span>
                  </div>

                  {/* Status Badge */}
                  <div className="col-span-2 text-center">
                    {isExact && (
                      <Badge variant="match">
                        <CheckCircle2 size={11} /> Exact
                      </Badge>
                    )}
                    {isPartial && (
                      <Badge variant="warn">
                        <AlertTriangle size={11} /> Partial
                      </Badge>
                    )}
                    {isMissing && (
                      <Badge variant="critical">
                        <XCircle size={11} /> Missing
                      </Badge>
                    )}
                  </div>

                  {/* Resume Evidence */}
                  <div className="col-span-5 flex items-center gap-2 pl-3">
                    <ArrowRight size={12} className="text-subtle shrink-0" />
                    {isExact && (
                      <span className="text-success font-medium text-[0.78rem]">
                        {item.matchText} <span className="text-subtle font-normal">({item.note})</span>
                      </span>
                    )}
                    {isPartial && (
                      <span className="text-warn font-medium text-[0.78rem]">
                        {item.matchText} <span className="text-subtle font-normal">({item.note})</span>
                      </span>
                    )}
                    {isMissing && (
                      <span className="text-danger font-medium text-[0.78rem]">
                        Not found <span className="text-subtle font-normal">(Add to Experience/Skills)</span>
                      </span>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </Card>
    </div>
  )
}
