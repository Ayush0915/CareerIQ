import React from 'react'

const VARIANT_STYLES = {
  match:    { background:'#F0FDF4', border:'1px solid #BBF7D0', color:'#16A34A' },
  critical: { background:'#FEF2F2', border:'1px solid #FECACA', color:'#DC2626' },
  important:{ background:'#FFFBEB', border:'1px solid #FDE68A', color:'#D97706' },
  optional: { background:'#EEF0FE', border:'1px solid #D8DCFC', color:'#5147E5' },
  neutral:  { background:'#F5F6FA', border:'1px solid #E8EAF0', color:'#6B7280' },
}

const DOT_COLORS = {
  match:    '#22C55E',
  critical: '#EF4444',
  important:'#F59E0B',
  optional: '#5147E5',
  neutral:  '#9CA3AF',
}

export default function SkillBadge({ skill, variant = 'neutral' }) {
  const s = VARIANT_STYLES[variant] || VARIANT_STYLES.neutral
  const dot = DOT_COLORS[variant] || DOT_COLORS.neutral
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:5,
      padding:'3px 10px', borderRadius:99,
      fontSize:'0.7rem', fontWeight:600,
      ...s,
    }}>
      <span style={{ width:6, height:6, borderRadius:'50%', background:dot, flexShrink:0 }} />
      {skill}
    </span>
  )
}
