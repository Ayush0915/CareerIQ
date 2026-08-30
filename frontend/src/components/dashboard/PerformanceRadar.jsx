import React from 'react'

/* A five-axis radar, drawn directly as SVG.
 *
 * This used to be recharts, which cost ~97KB gzipped — for one chart, in a
 * build whose entire remaining JS is ~112KB gzipped. The chart needs a grid,
 * a polygon and five labels; that is arithmetic, not a charting library.
 *
 * Props are unchanged: data is [{ subject, A }] with A in 0..100.
 */

const SIZE = 300
const HEIGHT = 200
const CX = SIZE / 2
const CY = HEIGHT / 2
const R = 66
const RINGS = [0.25, 0.5, 0.75, 1]

const ACCENT = '#5147E5'
const GRID = '#F0F1F5'
const LABEL = '#9CA3AF'

/* Start at 12 o'clock and go clockwise, matching the previous chart. */
function point(index, total, radius) {
  const angle = (Math.PI * 2 * index) / total - Math.PI / 2
  return [CX + radius * Math.cos(angle), CY + radius * Math.sin(angle)]
}

function polygon(points) {
  return points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
}

export default function PerformanceRadar({ data }) {
  const axes = data ?? []
  const n = axes.length
  if (n < 3) return null

  const ringShapes = RINGS.map(scale =>
    polygon(Array.from({ length: n }, (_, i) => point(i, n, R * scale))),
  )

  const valuePoints = axes.map((d, i) => {
    const value = Math.max(0, Math.min(100, Number(d.A) || 0))
    return point(i, n, (R * value) / 100)
  })

  const summary = axes.map(d => `${d.subject} ${Math.round(Number(d.A) || 0)}`).join(', ')

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${HEIGHT}`}
      width="100%"
      height={HEIGHT}
      role="img"
      aria-label={`Performance radar: ${summary}`}
      style={{ display: 'block', overflow: 'visible' }}
    >
      {ringShapes.map((pts, i) => (
        <polygon key={i} points={pts} fill="none" stroke={GRID} strokeWidth="1" />
      ))}

      {Array.from({ length: n }, (_, i) => {
        const [x, y] = point(i, n, R)
        return <line key={i} x1={CX} y1={CY} x2={x} y2={y} stroke={GRID} strokeWidth="1" />
      })}

      <polygon
        points={polygon(valuePoints)}
        fill={ACCENT}
        fillOpacity="0.1"
        stroke={ACCENT}
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {valuePoints.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="3" fill={ACCENT} />
      ))}

      {axes.map((d, i) => {
        const [x, y] = point(i, n, R + 16)
        /* Nudge anchoring so labels sit beside their spoke rather than over it. */
        const anchor = x > CX + 2 ? 'start' : x < CX - 2 ? 'end' : 'middle'
        return (
          <text
            key={i}
            x={x}
            y={y}
            textAnchor={anchor}
            dominantBaseline="middle"
            fill={LABEL}
            fontSize="11"
            fontFamily="Inter, sans-serif"
          >
            {d.subject}
          </text>
        )
      })}
    </svg>
  )
}
