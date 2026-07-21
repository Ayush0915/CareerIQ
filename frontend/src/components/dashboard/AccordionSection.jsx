import React, { useState } from 'react'
import { ChevronDown, ChevronUp, CheckCircle2, AlertTriangle } from 'lucide-react'

const scoreBg   = v => v >= 75 ? '#F0FDF4' : v >= 50 ? '#FFFBEB' : '#FEF2F2'
const scoreText = v => v >= 75 ? '#16A34A' : v >= 50 ? '#D97706' : '#DC2626'

export default function AccordionSection({ label, pct, items, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="accordion-section">
      <button
        type="button"
        className="accordion-header w-full text-left"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-label={`${label} breakdown, ${Math.round(pct)}% score`}
      >
        <span className="accordion-label">{label}</span>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <span className="accordion-pct" style={{ background:scoreBg(pct), color:scoreText(pct) }}>{Math.round(pct)}%</span>
          {open ? <ChevronUp size={13} color="#9CA3AF" aria-hidden="true" /> : <ChevronDown size={13} color="#9CA3AF" aria-hidden="true" />}
        </div>
      </button>
      {open && (
        <div className="accordion-body animate-fade-in">
          {items.map((item, i) => {
            const statusText = item.status === 'ok' ? 'Pass' : item.status === 'warn' ? 'Warning' : 'Issue'
            return (
              <div key={i} className="accordion-item">
                {item.status === 'ok'
                  ? <CheckCircle2 size={14} color="#22C55E" className="accordion-item-icon" aria-hidden="true" />
                  : item.status === 'warn'
                  ? <AlertTriangle size={14} color="#F59E0B" className="accordion-item-icon" aria-hidden="true" />
                  : <AlertTriangle size={14} color="#EF4444" className="accordion-item-icon" aria-hidden="true" />
                }
                <span className="accordion-item-label">{item.label}</span>
                <span className={`accordion-item-tag ${item.status === 'issue' ? 'issue' : item.status === 'warn' ? 'warn' : ''}`}>
                  <span style={{ fontWeight: 700, marginRight: 4 }}>[{statusText}]</span>
                  {item.note}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
