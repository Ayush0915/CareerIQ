import React from 'react'
import Badge from './ui/Badge'

const DOT_COLORS = {
  match:    '#22C55E',
  critical: '#EF4444',
  important:'#F59E0B',
  optional: '#5147E5',
  neutral:  '#9CA3AF',
}

export default function SkillBadge({ skill, variant = 'neutral' }) {
  const dot = DOT_COLORS[variant] || DOT_COLORS.neutral
  return (
    <Badge variant={variant}>
      <span style={{ width:6, height:6, borderRadius:'50%', background:dot, flexShrink:0 }} />
      {skill}
    </Badge>
  )
}
