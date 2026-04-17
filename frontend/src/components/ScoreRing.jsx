import React, { useEffect, useState } from 'react'

/* Full ring (used in overview) */
export default function ScoreRing({ score, label, color = '#5147E5', size = 110 }) {
  const [animated, setAnimated] = useState(0)
  const r = 42, circ = 2 * Math.PI * r
  const offset = circ - (animated / 100) * circ
  useEffect(() => { const t = setTimeout(() => setAnimated(score), 150); return () => clearTimeout(t) }, [score])
  return (
    <div className="flex flex-col items-center gap-1.5">
      <svg width={size} height={size} viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#F0F1F5" strokeWidth="7" />
        <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="7"
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
          transform="rotate(-90 50 50)"
          style={{ transition:'stroke-dashoffset 1.1s cubic-bezier(0.34,1.56,0.64,1)' }} />
        <text x="50" y="46" textAnchor="middle" fill="#1A1D2E" fontSize="20" fontWeight="700" fontFamily="Inter">{Math.round(animated)}</text>
        <text x="50" y="60" textAnchor="middle" fill="#9CA3AF" fontSize="9" fontFamily="Inter">/100</text>
      </svg>
      <span style={{ fontSize:'0.68rem', fontWeight:'600', color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'0.07em' }}>{label}</span>
    </div>
  )
}

/* Semi-circle gauge — used in loading screen */
export function SemiCircleGauge({ score, size = 200, animate = true }) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (animate) { const t = setTimeout(() => setVal(score), 80); return () => clearTimeout(t) }
    else setVal(score)
  }, [score])

  const W = size, H = size * 0.6
  const cx = W / 2, cy = H - 10
  const r  = (W - 40) / 2
  // arc from 180° to 0° (left to right)
  const toRad = deg => (deg * Math.PI) / 180
  const arcPath = (startDeg, endDeg) => {
    const s = toRad(startDeg), e = toRad(endDeg)
    const x1 = cx + r * Math.cos(s), y1 = cy + r * Math.sin(s)
    const x2 = cx + r * Math.cos(e), y2 = cy + r * Math.sin(e)
    return `M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`
  }

  // track: 180→0, fill: 180→(180 - val*1.8)
  const trackPath = arcPath(Math.PI, 0)
  const fillEnd   = Math.PI - (val / 100) * Math.PI
  const fillPath  = val > 0 ? arcPath(Math.PI, fillEnd) : ''

  const scoreColor = val >= 70 ? '#22C55E' : val >= 50 ? '#F59E0B' : '#EF4444'
  const circumference = Math.PI * r
  const fillLen = (val / 100) * circumference

  return (
    <svg width={W} height={H + 30} viewBox={`0 0 ${W} ${H + 30}`}>
      {/* Gradient def */}
      <defs>
        <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#5147E5" />
          <stop offset="100%" stopColor={scoreColor} />
        </linearGradient>
      </defs>
      {/* Track */}
      <path d={trackPath} fill="none" stroke="#F0F1F5" strokeWidth="12" strokeLinecap="round" />
      {/* Fill */}
      {fillLen > 0 && (
        <path d={trackPath} fill="none" stroke="url(#gaugeGrad)" strokeWidth="12" strokeLinecap="round"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={circumference - fillLen}
          style={{ transition: animate ? 'stroke-dashoffset 1.2s cubic-bezier(0.34,1.56,0.64,1)' : 'none', transformOrigin:'center', transform:'scaleX(-1)' }}
        />
      )}
      {/* Center score */}
      <text x={cx} y={cy + 4} textAnchor="middle" fill="#1A1D2E" fontSize="28" fontWeight="800" fontFamily="Inter">
        {Math.round(val)}
      </text>
      <text x={cx} y={cy + 22} textAnchor="middle" fill="#9CA3AF" fontSize="11" fontFamily="Inter">
        / 100
      </text>
    </svg>
  )
}
