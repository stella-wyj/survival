import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Chart, registerables } from 'chart.js'
import Panel from '../components/Panel'
import { monteCarlo } from '../lib/quantMath'

Chart.register(...registerables)

const fmtK = v => '$' + (v / 1000).toFixed(1) + 'k'

export default function MonteCarloPage() {
  const [sims,   setSims]   = useState(1000)
  const [days,   setDays]   = useState(252)
  const [init,   setInit]   = useState(100000)
  const [mu,     setMu]     = useState(0.03)
  const [sigma,  setSigma]  = useState(0.012)
  const [result, setResult] = useState(null)
  const [running, setRunning] = useState(false)
  const chartRef  = useRef(null)
  const chartInst = useRef(null)

  const run = useCallback(() => {
    setRunning(true)
    setTimeout(() => {
      const res = monteCarlo({ simulations: Math.min(sims, 5000), days, initialValue: init, dailyMu: mu / 252, dailySigma: sigma })
      setResult(res)
      setRunning(false)
    }, 10)
  }, [sims, days, init, mu, sigma])

  useEffect(() => { run() }, [])

  useEffect(() => {
    if (!result || !chartRef.current) return
    const labels = Array.from({ length: result.p50.length }, (_, i) => i)

    if (chartInst.current) chartInst.current.destroy()
    chartInst.current = new Chart(chartRef.current, {
      type: 'line',
      data: {
        labels,
        datasets: [
          { label: '90th pct', data: result.p90, borderColor: '#1D9E75', backgroundColor: 'rgba(29,158,117,0.06)', fill: '+1', tension: 0.3, borderWidth: 1.5, pointRadius: 0 },
          { label: 'Median',   data: result.p50, borderColor: '#3266ad', backgroundColor: 'rgba(50,102,173,0.10)', fill: '+1', tension: 0.3, borderWidth: 2,   pointRadius: 0 },
          { label: '10th pct', data: result.p10, borderColor: '#E24B4A', backgroundColor: 'rgba(226,75,74,0.05)',  fill: false, tension: 0.3, borderWidth: 1.5, pointRadius: 0 },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        animation: { duration: 400 },
        plugins: { legend: { display: false } },
        scales: {
          y: { ticks: { callback: v => fmtK(v), font: { size: 10 } }, grid: { color: 'rgba(128,128,128,0.1)' } },
          x: { ticks: { display: false }, grid: { display: false } },
        },
      },
    })
  }, [result])

  useEffect(() => () => chartInst.current?.destroy(), [])

  const Slider = ({ label, value, min, max, step, onChange, display }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-secondary)' }}>
        <span>{label}</span>
        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{display ?? value}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))} />
    </div>
  )

  return (
    <div>
      <Panel title="Simulation Parameters" style={{ marginBottom: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 20, marginBottom: 20 }}>
          <Slider label="Simulations"     value={sims}  min={100}  max={5000}  step={100}   onChange={setSims}  display={sims.toLocaleString()} />
          <Slider label="Horizon (days)"  value={days}  min={30}   max={1260}  step={30}    onChange={setDays}  />
          <Slider label="Initial value"   value={init}  min={10000} max={1000000} step={10000} onChange={setInit} display={'$'+(init/1000).toFixed(0)+'k'} />
          <Slider label="Ann. return (%)" value={mu}    min={-0.20} max={0.40}  step={0.01}  onChange={setMu}   display={(mu * 100).toFixed(0) + '%'} />
          <Slider label="Daily vol (σ)"   value={sigma} min={0.005} max={0.04}  step={0.001} onChange={setSigma} display={(sigma * 100).toFixed(1) + '%'} />
        </div>
        <button onClick={run} disabled={running} style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          fontSize: 13, padding: '7px 18px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-md)',
          background: running ? 'var(--bg-secondary)' : 'var(--accent)',
          color: running ? 'var(--text-secondary)' : '#fff',
          transition: 'all .15s',
        }}>
          {running ? '⟳  Running…' : '▶  Run Simulation'}
        </button>
      </Panel>

      <Panel title="Simulation Fan Chart — Percentile Bands" style={{ marginBottom: 14 }}>
        <div style={{ height: 240, marginBottom: 12 }}>
          <canvas ref={chartRef} />
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          {[['90th pct', '#1D9E75'], ['Median', '#3266ad'], ['10th pct', '#E24B4A']].map(([l, c]) => (
            <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-secondary)' }}>
              <div style={{ width: 18, height: 2, background: c }} />
              {l}
            </div>
          ))}
        </div>
      </Panel>

      {result && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
          {[
            { label: '10th pct', value: fmtK(result.percentiles.p10), color: 'var(--red)' },
            { label: '25th pct', value: fmtK(result.percentiles.p25), color: 'var(--text-secondary)' },
            { label: 'Median',   value: fmtK(result.percentiles.p50), color: 'var(--accent)' },
            { label: '90th pct', value: fmtK(result.percentiles.p90), color: 'var(--green)' },
            { label: 'P(Loss)',  value: (result.probLoss * 100).toFixed(1) + '%', color: result.probLoss > 0.25 ? 'var(--red)' : 'var(--text-primary)' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: '12px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 600, color }}>{value}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
