import React from 'react'

export default function Card({ children, className = '', style, onClick, borderTop, borderLeft, padding, ...props }) {
  const customStyle = {
    ...(borderTop ? { borderTop } : {}),
    ...(borderLeft ? { borderLeft } : {}),
    ...(padding !== undefined ? { padding } : {}),
    ...style,
  }

  return (
    <div
      className={`ev-card bg-white border border-[#E8EAF0] rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.05),0_4px_16px_rgba(81,71,229,0.08)] transition-all duration-200 ${onClick ? 'cursor-pointer ev-card-hover' : ''} ${className}`}
      style={customStyle}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  )
}
