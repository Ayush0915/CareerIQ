import React, { useState, useEffect } from 'react'
import { History, Clock, Trash2 } from 'lucide-react'

export default function AnalysisHistory({ onSelectAnalysis }) {
  const [history, setHistory] = useState([])

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('careeriq_history') || '[]')
      setHistory(stored)
    } catch (e) {
      setHistory([])
    }
  }, [])

  function clearHistory(e) {
    e.stopPropagation()
    localStorage.removeItem('careeriq_history')
    setHistory([])
  }

  if (!history.length) return null

  return (
    <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #E8EAF0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, padding: '0 4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <History size={14} color="#5147E5" />
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#1A1D2E', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Recent Analyses
          </span>
        </div>
        <button
          onClick={clearHistory}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 2, display: 'flex', alignItems: 'center' }}
          title="Clear history"
        >
          <Trash2 size={12} />
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {history.map((item) => {
          const dateStr = new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
          const scoreColor = item.score >= 75 ? '#16A34A' : item.score >= 50 ? '#D97706' : '#DC2626'
          return (
            <button
              key={item.id}
              onClick={() => onSelectAnalysis(item.response)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 10px',
                borderRadius: 8,
                background: '#F8F9FC',
                border: '1px solid #E8EAF0',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#5147E5'
                e.currentTarget.style.background = '#EEF0FE'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#E8EAF0'
                e.currentTarget.style.background = '#F8F9FC'
              }}
            >
              <div style={{ minWidth: 0, flex: 1, marginRight: 8 }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#1A1D2E', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.jobTitle}
                </div>
                <div style={{ fontSize: '0.65rem', color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                  <Clock size={10} /> {dateStr}
                </div>
              </div>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: scoreColor, flexShrink: 0 }}>
                {Math.round(item.score)}%
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
