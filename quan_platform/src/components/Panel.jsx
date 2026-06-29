import React from 'react'

export default function Panel({ title, icon, children, style = {} }) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: '18px 20px',
      ...style,
    }}>
      {title && (
        <div style={{
          fontSize: 11,
          fontWeight: 600,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 7,
        }}>
          {icon && <span style={{ fontSize: 14 }}>{icon}</span>}
          {title}
        </div>
      )}
      {children}
    </div>
  )
}
