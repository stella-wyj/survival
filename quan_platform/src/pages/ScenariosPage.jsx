import React, { useState, useRef, useEffect } from 'react'
import { Chart, registerables } from 'chart.js'
import Panel from '../components/Panel'
import {
  SCENARIOS, applyScenario,
  generateDemoReturns, generateDemoBenchmarkReturns,
  sharpeRatio, sortinoRatio, beta, alpha,
  valueAtRisk, maxDrawdown, returnsToPrices,
  annualisedReturn,
} from '../lib/quantMath'

Chart.register(...registerables)

function buildBaseMetrics() {
  const returns = generateDemoReturns()
  const benchReturns = generateDemoBenchmarkReturns(returns)
  const prices = returnsToPrices(returns)
  return {
    sharpe:   sharpeRatio(returns),
    sortino:  sortinoRatio(returns),
    betaVal:  beta(returns, benchReturns),
    alphaVal: alpha(returns, benchReturns),
    var95:    valueAtRisk(returns, 0.95),
    mdd:      maxDrawdown(prices).mdd,
    annReturn: annualisedReturn(returns),
  }
}

export default function ScenariosPage() {
  const [selected, setSelected] = useState(0)
  const [base] = useState(() => buildBaseMetrics())
  const chartRef = useRef(null)
  const chartInst = useRef(null)

  const stressed = applyScenario(base, SCENARIOS[selected])

  useEffect(() => {
    if (!chartRef.current) return
    const sc = SCENARIOS[selected]

    const labels  = ['Ann. Return', 'Sharpe', 'Sortino', 'VaR 95%', 'Max DD']
    const baseVals    = [+(base.annReturn * 100).toFixed(1), +base.sharpe.toFixed(2), +base.sortino.toFixed(2), +(base.var95 * 100).toFixed(1), +(base.mdd * 100).toFixed(1)]
    const stressVals  = [+(stressed.annReturn * 100).toFixed(1), stressed.sharpe, stressed.sortino, +(stressed.var95 * 100).toFixed(1), +(stressed.mdd * 100).toFixed(1)]

    if (chartInst.current) chartInst.current.destroy()
    chartInst.current = new Chart(chartRef.current, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label: 'Base', data: baseVals, backgroundColor: 'rgba(50,102,173,0.6)', borderRadius: 3, borderWidth: 0 },
          { label: 'Stressed', data: stressVals, backgroundColor: sc.color + 'aa', borderRadius: 3, borderWidth: 0 },
        ],
      },
      options: {
        indexAxis: 'y',
        responsive: true, maintainAspectRatio: false,
        animation: { duration: 350 },
        plugins: {
          legend: {
            display: true,
            labels: { font: { size: 11 }, color: 'var(--text-secondary)', boxWidth: 10 }
          }
        },
        scales: {
          x: { ticks: { font: { size: 10 } }, grid: { color: 'rgba(128,128,128,0.1)' } },
          y: { ticks: { font: { size: 11 } }, grid: { display: false } },
        },
      },
    })
  }, [selected, base])

  useEffect(() => () => chartInst.current?.destroy(), [])

  const MetricDiff = ({ label, base, stressed, unit = '' }) => {
    const diff = stressed - base
    const isGood = label === 'Ann. Return' || label === 'Sharpe' || label === 'Sortino' || label === 'Alpha'
    const sign = diff >= 0 ? '+' : ''
    const sentiment = diff === 0 ? 'neutral' : (isGood ? (diff > 0 ? 'good' : 'bad') : (diff < 0 ? 'good' : 'bad'))
    const colors = { good: 'var(--green)', bad: 'var(--red)', neutral: 'var(--text-muted)' }
    return (
      <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: '10px 14px' }}>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontSize: 16, fontWeight: 600 }}>{stressed.toFixed(2)}{unit}</span>
          <span style={{ fontSize: 11, color: colors[sentiment] }}>{sign}{diff.toFixed(2)}{unit}</span>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Scenario selector grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 14 }}>
        {SCENARIOS.map((sc, i) => (
          <div
            key={sc.id}
            onClick={() => setSelected(i)}
            style={{
              border: `1px solid ${i === selected ? sc.color : 'var(--border)'}`,
              background: i === selected ? sc.color + '11' : 'var(--bg-card)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 14px',
              cursor: 'pointer',
              transition: 'all .15s',
              position: 'relative',
            }}
          >
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: sc.color, position: 'absolute', top: 10, right: 10 }} />
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 2 }}>{sc.name}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: sc.annReturn < 0 ? 'var(--red)' : 'var(--green)', marginBottom: 2 }}>
              {sc.annReturn >= 0 ? '+' : ''}{(sc.annReturn * 100).toFixed(1)}%
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{sc.desc}</div>
          </div>
        ))}
      </div>

      {/* Impact chart */}
      <Panel title={`Impact: ${SCENARIOS[selected].name}`} style={{ marginBottom: 14 }}>
        <div style={{ height: 200 }}><canvas ref={chartRef} /></div>
      </Panel>

      {/* Metric diffs */}
      <Panel title="Stressed Metric Values vs Base">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10 }}>
          <MetricDiff label="Ann. Return" base={base.annReturn * 100}    stressed={stressed.annReturn * 100} unit="%" />
          <MetricDiff label="Sharpe"      base={base.sharpe}             stressed={stressed.sharpe} />
          <MetricDiff label="Sortino"     base={base.sortino}            stressed={stressed.sortino} />
          <MetricDiff label="Beta"        base={base.betaVal}            stressed={stressed.betaVal} />
          <MetricDiff label="VaR 95%"     base={base.var95 * 100}        stressed={stressed.var95 * 100} unit="%" />
          <MetricDiff label="Max DD"      base={base.mdd * 100}          stressed={stressed.mdd * 100} unit="%" />
        </div>
      </Panel>
    </div>
  )
}
