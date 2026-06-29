import React, { useState } from 'react'
import PortfolioPage   from './pages/PortfolioPage'
import MonteCarloPage  from './pages/MonteCarloPage'
import ScenariosPage   from './pages/ScenariosPage'

const TABS = [
  { id: 'portfolio', label: '📊  Portfolio' },
  { id: 'monte',     label: '🎲  Monte Carlo' },
  { id: 'scenarios', label: '🌐  Scenarios' },
]

export default function App() {
  const [tab, setTab] = useState('portfolio')

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-tertiary)' }}>
      {/* Top bar */}
      <div style={{
        background: 'var(--bg-card)',
        borderBottom: '1px solid var(--border)',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 52,
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 18 }}>⚡</span>
          <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>QuantCore</span>
          <span style={{
            fontSize: 10, padding: '2px 7px', borderRadius: 4,
            background: 'var(--accent-bg)', color: 'var(--accent)', fontWeight: 600, letterSpacing: '0.05em',
          }}>ANALYTICS</span>
        </div>
        <nav style={{ display: 'flex', gap: 4 }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                fontSize: 12, padding: '5px 14px',
                borderRadius: 6,
                border: '1px solid ' + (tab === t.id ? 'var(--border-md)' : 'transparent'),
                background: tab === t.id ? 'var(--bg-secondary)' : 'transparent',
                color: tab === t.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: tab === t.id ? 600 : 400,
                transition: 'all .15s',
              }}
            >
              {t.label}
            </button>
          ))}
        </nav>
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          Demo data · Replace with live feed
        </div>
      </div>

      {/* Page content */}
      <div style={{ padding: '20px 24px', maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ marginBottom: 16 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 2 }}>
            {tab === 'portfolio'  && 'Portfolio Analytics'}
            {tab === 'monte'     && 'Monte Carlo Simulation'}
            {tab === 'scenarios' && 'Stress-Test Scenarios'}
          </h1>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {tab === 'portfolio'  && 'Risk-adjusted return metrics, drawdown analysis, and P&L distribution'}
            {tab === 'monte'     && 'GBM-based forward simulation with configurable parameters'}
            {tab === 'scenarios' && 'Historical crisis scenario overlays on base portfolio metrics'}
          </p>
        </div>

        {tab === 'portfolio'  && <PortfolioPage />}
        {tab === 'monte'      && <MonteCarloPage />}
        {tab === 'scenarios'  && <ScenariosPage />}
      </div>
    </div>
  )
}
