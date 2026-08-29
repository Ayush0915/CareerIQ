import React from 'react'

export default function ScoreBar({ label, value, color, gradient, height, showPercent = true, className = "" }) {
  const barColor = color || (value >= 75 ? '#22C55E' : value >= 50 ? '#F59E0B' : '#EF4444')
  const background = gradient || barColor

  return (
    <div className={`mb-3 ${className}`}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
        <span style={{ fontSize:'0.75rem', color:'#6B7280', fontWeight:500 }}>{label}</span>
        {showPercent && (
          <span style={{ fontSize:'0.75rem', fontWeight:700, color:'#1A1D2E', fontVariantNumeric:'tabular-nums' }}>
            {Math.round(value)}%
          </span>
        )}
      </div>
      <div className="ev-progress-track" style={height ? { height } : undefined}>
        <div className="ev-progress-fill" style={{ width: `${Math.min(100, Math.max(0, value))}%`, background }} />
      </div>
    </div>
  )
}
