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
      className={`ev-card ${onClick ? 'cursor-pointer' : ''} ${className}`}
      style={customStyle}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  )
}
