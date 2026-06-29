import React from 'react'

const styles = {
  card: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    padding: '14px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  label: {
    fontSize: 11,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    fontWeight: 500,
  },
  value: {
    fontSize: 22,
    fontWeight: 600,
    lineHeight: 1.2,
  },
  sub: {
    fontSize: 11,
    marginTop: 2,
  },
}

const colorMap = {
  good: 'var(--green)',
  bad: 'var(--red)',
  neutral: 'var(--text-muted)',
}

export default function MetricCard({ label, value, subtext, sentiment = 'neutral' }) {
  return (
    <div style={styles.card}>
      <div style={styles.label}>{label}</div>
      <div style={{ ...styles.value, color: colorMap[sentiment] ?? 'var(--text-primary)' }}>
        {value}
      </div>
      {subtext && (
        <div style={{ ...styles.sub, color: colorMap[sentiment] ?? 'var(--text-muted)' }}>
          {subtext}
        </div>
      )}
    </div>
  )
}
