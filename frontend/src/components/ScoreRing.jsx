import React, { useEffect, useState } from 'react'

export default function ScoreRing({ score, label, color = '#2563eb', size = 110 }) {
  const [animated, setAnimated] = useState(0)
  const radius = 42
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (animated / 100) * circumference

  useEffect(() => {
    const t = setTimeout(() => setAnimated(score), 150)
    return () => clearTimeout(t)
  }, [score])

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="7" />
        <circle
          cx="50" cy="50" r={radius}
          fill="none" stroke={color} strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 50 50)"
          style={{ transition: 'stroke-dashoffset 1.1s cubic-bezier(0.34,1.56,0.64,1)' }}
        />
        <text x="50" y="46" textAnchor="middle" fill="#0f172a" fontSize="19" fontWeight="700" fontFamily="Plus Jakarta Sans">
          {Math.round(animated)}
        </text>
        <text x="50" y="60" textAnchor="middle" fill="#94a3b8" fontSize="9" fontFamily="Plus Jakarta Sans">
          / 100
        </text>
      </svg>
      <span className="text-xs font-semibold text-muted uppercase tracking-wider">{label}</span>
    </div>
  )
}