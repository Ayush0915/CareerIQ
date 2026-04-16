import React from 'react'

const variants = {
  match:    'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100',
  critical: 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100',
  important:'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100',
  optional: 'bg-indigo-50 border-indigo-200 text-indigo-600 hover:bg-indigo-100',
  neutral:  'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100',
}
const dots = {
  match:    'bg-emerald-400',
  critical: 'bg-red-400',
  important:'bg-amber-400',
  optional: 'bg-indigo-400',
  neutral:  'bg-slate-400',
}

export default function SkillBadge({ skill, variant = 'neutral' }) {
  return (
    <span className={`badge border transition-colors cursor-default ${variants[variant]}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dots[variant]}`} />
      {skill}
    </span>
  )
}
