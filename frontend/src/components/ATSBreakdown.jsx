import React, { useState } from 'react'
import {
  ShieldCheck, ShieldAlert, ShieldX,
  User, List, Search, Calendar, GraduationCap,
  LayoutTemplate, AlignLeft, TrendingUp, ChevronDown, ChevronUp
} from 'lucide-react'

const CHECK_META = {
  contact_info:     { label:'Contact Info',       icon:User,           weight:'8%'  },
  section_headers:  { label:'Section Headers',    icon:List,           weight:'12%' },
  keyword_density:  { label:'Keyword Density',    icon:Search,         weight:'25%' },
  date_consistency: { label:'Date Consistency',   icon:Calendar,       weight:'8%'  },
  education:        { label:'Education',          icon:GraduationCap,  weight:'7%'  },
  formatting:       { label:'ATS Formatting',     icon:LayoutTemplate, weight:'15%' },
  length:           { label:'Resume Length',      icon:AlignLeft,      weight:'10%' },
  quantification:   { label:'Quantified Impact',  icon:TrendingUp,     weight:'15%' },
}

function statusFromScore(score) {
  if (score >= 75) return 'pass'
  if (score >= 45) return 'warn'
  return 'fail'
}

const STATUS_STYLE = {
  pass: { color:'#16A34A', bg:'#F0FDF4', border:'#BBF7D0', barColor:'#22C55E' },
  warn: { color:'#D97706', bg:'#FFFBEB', border:'#FDE68A', barColor:'#F59E0B' },
  fail: { color:'#DC2626', bg:'#FEF2F2', border:'#FECACA', barColor:'#EF4444' },
}

const VERDICT_STYLE = {
  'ATS-Ready':        { color:'#16A34A', bg:'#F0FDF4', border:'#BBF7D0', icon:ShieldCheck },
  'Needs Improvement':{ color:'#D97706', bg:'#FFFBEB', border:'#FDE68A', icon:ShieldAlert },
  'High ATS Risk':    { color:'#DC2626', bg:'#FEF2F2', border:'#FECACA', icon:ShieldX     },
}

function CheckRow({ checkKey, data }) {
  const [open, setOpen] = useState(false)
  const meta   = CHECK_META[checkKey] || { label: checkKey, icon: Search, weight:'—' }
  const Icon   = meta.icon
  const status = statusFromScore(data.score)
  const ss     = STATUS_STYLE[status]

  // Build extra detail items from check-specific fields
  const details = []
  if (data.found?.length)           details.push(`Found: ${data.found.join(', ')}`)
  if (data.missing?.length)         details.push(`Missing: ${data.missing.join(', ')}`)
  if (data.headers_found?.length)   details.push(`Headers: ${data.headers_found.join(', ')}`)
  if (data.critical_missing?.length)details.push(`Critical missing: ${data.critical_missing.join(', ')}`)
  if (data.matched_count != null)   details.push(`${data.matched_count} of ${data.jd_total_keywords} JD keywords matched`)
  if (data.top_missing?.length)     details.push(`Top missing keywords: ${data.top_missing.slice(0,6).join(', ')}`)
  if (data.gap_detected)            details.push('Possible employment gap detected')
  if (data.degrees_found?.length)   details.push(`Degrees: ${data.degrees_found.join(', ')}`)
  if (data.word_count != null)      details.push(`~${data.word_count} words (~${data.estimated_pages} pages)`)
  if (data.issues?.length)          data.issues.forEach(i => details.push(i))
  if (data.bullet_lines != null)    details.push(`${data.bullet_lines} bullet-point lines found`)
  if (data.count != null)           details.push(`${data.count} quantified achievement(s) detected`)
  if (data.samples?.length)         details.push(`Examples: ${data.samples.slice(0,3).join(' · ')}`)

  return (
    <div
      style={{ borderBottom:'1px solid #F0F1F5', overflow:'hidden' }}
    >
      <button
        onClick={() => setOpen(!open)}
        style={{ width:'100%', display:'flex', alignItems:'center', gap:12, padding:'13px 18px', background:'none', border:'none', cursor:'pointer', textAlign:'left' }}
        onMouseEnter={e => e.currentTarget.style.background='#FAFBFF'}
        onMouseLeave={e => e.currentTarget.style.background='none'}
      >
        {/* Icon */}
        <div style={{ width:30, height:30, borderRadius:8, background:ss.bg, border:`1px solid ${ss.border}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <Icon size={13} color={ss.color} />
        </div>

        {/* Label + bar */}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:5 }}>
            <span style={{ fontSize:'0.82rem', fontWeight:600, color:'#1A1D2E' }}>{meta.label}</span>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ fontSize:'0.65rem', color:'#9CA3AF', fontWeight:500 }}>weight {meta.weight}</span>
              <span style={{ fontSize:'0.75rem', fontWeight:700, color:ss.color }}>{data.score}%</span>
            </div>
          </div>
          <div className="ev-progress-track" style={{ height:5 }}>
            <div style={{ height:'100%', borderRadius:99, width:`${data.score}%`, background:ss.barColor, transition:'width 1s cubic-bezier(0.16,1,0.3,1)' }} />
          </div>
        </div>

        {/* Chevron */}
        {open ? <ChevronUp size={13} color="#9CA3AF" style={{ flexShrink:0 }} />
               : <ChevronDown size={13} color="#9CA3AF" style={{ flexShrink:0 }} />}
      </button>

      {open && (
        <div style={{ padding:'0 18px 14px 60px' }} className="animate-fade-in">
          <p style={{ fontSize:'0.78rem', color:'#6B7280', marginBottom: details.length ? 8 : 0, lineHeight:1.55 }}>{data.note}</p>
          {details.length > 0 && (
            <ul style={{ margin:0, padding:0, listStyle:'none', display:'flex', flexDirection:'column', gap:4 }}>
              {details.map((d, i) => (
                <li key={i} style={{ fontSize:'0.72rem', color:'#9CA3AF', display:'flex', gap:6, alignItems:'flex-start' }}>
                  <span style={{ color: ss.barColor, marginTop:1 }}>›</span> {d}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

export default function ATSBreakdown({ atsData }) {
  if (!atsData) return (
    <div className="ev-card" style={{ padding:40, textAlign:'center' }}>
      <ShieldAlert size={32} color="#E8EAF0" style={{ margin:'0 auto 12px', display:'block' }} />
      <p style={{ color:'#9CA3AF', fontSize:'0.875rem' }}>ATS simulation data not available.</p>
    </div>
  )

  const { overall_ats_score, checks, top_issues, verdict } = atsData
  const vs = VERDICT_STYLE[verdict] || VERDICT_STYLE['Needs Improvement']
  const VIcon = vs.icon

  const passCount = Object.values(checks).filter(c => c.score >= 75).length
  const warnCount = Object.values(checks).filter(c => c.score >= 45 && c.score < 75).length
  const failCount = Object.values(checks).filter(c => c.score < 45).length

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

      {/* Hero score card */}
      <div className="ev-card" style={{ padding:22 }}>
        <div style={{ display:'flex', alignItems:'center', gap:20 }}>
          {/* Big score */}
          <div style={{ textAlign:'center', flexShrink:0 }}>
            <div style={{
              width:88, height:88, borderRadius:'50%',
              background:`conic-gradient(${vs.barColor || '#22C55E'} ${overall_ats_score * 3.6}deg, #F0F1F5 0deg)`,
              display:'flex', alignItems:'center', justifyContent:'center',
            }}>
              <div style={{ width:68, height:68, borderRadius:'50%', background:'#fff', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
                <span style={{ fontSize:'1.5rem', fontWeight:800, color:vs.color, lineHeight:1 }}>{Math.round(overall_ats_score)}</span>
                <span style={{ fontSize:'0.6rem', color:'#9CA3AF', marginTop:1 }}>/ 100</span>
              </div>
            </div>
          </div>

          {/* Verdict + stats */}
          <div style={{ flex:1 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
              <VIcon size={16} color={vs.color} />
              <span style={{ fontWeight:700, fontSize:'1rem', color:'#1A1D2E' }}>ATS Simulation</span>
              <span style={{ fontSize:'0.72rem', fontWeight:700, padding:'3px 10px', borderRadius:99, background:vs.bg, border:`1px solid ${vs.border}`, color:vs.color }}>
                {verdict}
              </span>
            </div>

            <div style={{ display:'flex', gap:16, marginBottom:12 }}>
              <span style={{ fontSize:'0.75rem', color:'#16A34A', fontWeight:600 }}>✓ {passCount} passed</span>
              <span style={{ fontSize:'0.75rem', color:'#D97706', fontWeight:600 }}>⚠ {warnCount} warnings</span>
              <span style={{ fontSize:'0.75rem', color:'#DC2626', fontWeight:600 }}>✗ {failCount} failed</span>
            </div>

            <div className="ev-progress-track">
              <div className="ev-progress-fill" style={{ width:`${overall_ats_score}%`, background:`linear-gradient(90deg, ${vs.color}, ${vs.barColor || vs.color})` }} />
            </div>
          </div>
        </div>

        {/* Top issues strip */}
        {top_issues.length > 0 && (
          <div style={{ marginTop:16, padding:'12px 14px', background:'#FFFBEB', border:'1px solid #FDE68A', borderRadius:10 }}>
            <p style={{ fontSize:'0.7rem', fontWeight:700, color:'#D97706', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>Top Issues to Fix</p>
            <ul style={{ margin:0, padding:0, listStyle:'none', display:'flex', flexDirection:'column', gap:4 }}>
              {top_issues.map((issue, i) => (
                <li key={i} style={{ fontSize:'0.78rem', color:'#92400E', display:'flex', gap:6 }}>
                  <span style={{ color:'#F59E0B' }}>•</span> {issue}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* 8 Check rows */}
      <div className="ev-card" style={{ padding:0, overflow:'hidden' }}>
        <div style={{ padding:'14px 18px', borderBottom:'1px solid #F0F1F5', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span style={{ fontWeight:700, fontSize:'0.875rem', color:'#1A1D2E' }}>8-Point ATS Checklist</span>
          <span style={{ fontSize:'0.68rem', color:'#9CA3AF' }}>Click any row to expand</span>
        </div>
        {Object.entries(checks).map(([key, data]) => (
          <CheckRow key={key} checkKey={key} data={data} />
        ))}
      </div>
    </div>
  )
}
