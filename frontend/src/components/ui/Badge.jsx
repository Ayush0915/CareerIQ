import React from 'react'

export default function Badge({ children, variant = 'default', color, bg, border, style, className = "", ...props }) {
  const variantStyles = {
    default:   { background:'#EEF0FE', border:'1px solid #D8DCFC', color:'#5147E5' },
    accent:    { background:'#EEF0FE', border:'1px solid #D8DCFC', color:'#5147E5' },
    success:   { background:'#F0FDF4', border:'1px solid #BBF7D0', color:'#16A34A' },
    match:     { background:'#F0FDF4', border:'1px solid #BBF7D0', color:'#16A34A' },
    warn:      { background:'#FFFBEB', border:'1px solid #FDE68A', color:'#D97706' },
    important: { background:'#FFFBEB', border:'1px solid #FDE68A', color:'#D97706' },
    danger:    { background:'#FEF2F2', border:'1px solid #FECACA', color:'#DC2626' },
    critical:  { background:'#FEF2F2', border:'1px solid #FECACA', color:'#DC2626' },
    optional:  { background:'#EEF0FE', border:'1px solid #D8DCFC', color:'#5147E5' },
  }

  const defaultStyle = variantStyles[variant] || variantStyles.default
  const computedStyle = {
    fontSize: '0.68rem',
    fontWeight: 600,
    padding: '3px 9px',
    borderRadius: 99,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    ...defaultStyle,
    ...(color ? { color } : {}),
    ...(bg ? { background: bg } : {}),
    ...(border ? { border: `1px solid ${border}` } : {}),
    ...style,
  }

  return (
    <span className={`ev-badge ${className}`} style={computedStyle} {...props}>
      {children}
    </span>
  )
}
