import React, { useEffect, useRef } from 'react'
import { Chart, registerables } from 'chart.js'
import MetricCard from '../components/MetricCard'
import Panel from '../components/Panel'
import {
  sharpeRatio, sortinoRatio, beta, alpha,
  valueAtRisk, maxDrawdown, returnsToPrices,
  annualisedReturn, annualisedVol,
  generateDemoReturns, generateDemoBenchmarkReturns,
} from '../lib/quantMath'

Chart.register(...registerables)

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function buildData() {
  const returns = generateDemoReturns(252)
  const benchReturns = generateDemoBenchmarkReturns(returns, 0.85)
  const prices = returnsToPrices(returns)
  const benchPrices = returnsToPrices(benchReturns)

  const sharpe = sharpeRatio(returns)
  const sortino = sortinoRatio(returns)
  const betaVal = beta(returns, benchReturns)
  const alphaVal = alpha(returns, benchReturns)
  const var95 = valueAtRisk(returns, 0.95)
  const { mdd } = maxDrawdown(prices)
  const annRet = annualisedReturn(returns)
  const annVol = annualisedVol(returns)

  return { returns, benchReturns, prices, benchPrices, sharpe, sortino, betaVal, alphaVal, var95, mdd, annRet, annVol }
}

export default function PortfolioPage() {
  const data = React.useMemo(() => buildData(), [])
  const returnRef = useRef(null)
  const ddRef     = useRef(null)
  const distRef   = useRef(null)
  const charts    = useRef({})

  // Monthly snapshots for line charts
  const monthlyPort  = MONTHS.map((_, i) => +((data.prices[Math.floor((i + 1) * 21)] / data.prices[0] - 1) * 100).toFixed(2))
  const monthlyBench = MONTHS.map((_, i) => +((data.benchPrices[Math.floor((i + 1) * 21)] / data.benchPrices[0] - 1) * 100).toFixed(2))

  // Drawdown series (monthly)
  const ddSeries = MONTHS.map((_, i) => {
    const slice = data.prices.slice(0, (i + 1) * 21)
    const peak = Math.max(...slice)
    return +((slice[slice.length - 1] / peak - 1) * 100).toFixed(2)
  })

  // Return distribution (histogram bins)
  const bins = Array.from({ length: 20 }, (_, i) => -5 + i * 0.5)
  const freq = bins.map(b => data.returns.filter(r => r * 100 >= b && r * 100 < b + 0.5).length)
  const varLine = data.var95 * 100

  const chartDefaults = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    animation: { duration: 600 },
  }

  useEffect(() => {
    // Return chart
    charts.current.ret = new Chart(returnRef.current, {
      type: 'line',
      data: {
        labels: MONTHS,
        datasets: [
          { label: 'Portfolio', data: monthlyPort, borderColor: '#3266ad', backgroundColor: 'rgba(50,102,173,0.08)', fill: true, tension: 0.4, borderWidth: 2, pointRadius: 0 },
          { label: 'Benchmark', data: monthlyBench, borderColor: '#888780', borderDash: [5, 4], fill: false, tension: 0.4, borderWidth: 1.5, pointRadius: 0 },
        ],
      },
      options: {
        ...chartDefaults,
        scales: {
          y: { ticks: { callback: v => v + '%', font: { size: 10 } }, grid: { color: 'rgba(128,128,128,0.1)' } },
          x: { ticks: { font: { size: 10 } }, grid: { display: false } },
        },
      },
    })

    // Drawdown chart
    charts.current.dd = new Chart(ddRef.current, {
      type: 'line',
      data: {
        labels: MONTHS,
        datasets: [{ data: ddSeries, borderColor: '#E24B4A', backgroundColor: 'rgba(226,75,74,0.15)', fill: true, tension: 0.4, borderWidth: 1.5, pointRadius: 0 }],
      },
      options: {
        ...chartDefaults,
        scales: {
          y: { ticks: { callback: v => v + '%', font: { size: 10 } }, grid: { color: 'rgba(128,128,128,0.1)' } },
          x: { ticks: { font: { size: 10 } }, grid: { display: false } },
        },
      },
    })

    // Distribution chart
    charts.current.dist = new Chart(distRef.current, {
      type: 'bar',
      data: {
        labels: bins.map(b => b.toFixed(1) + '%'),
        datasets: [{
          data: freq,
          backgroundColor: bins.map(b => b < varLine ? 'rgba(226,75,74,0.7)' : 'rgba(50,102,173,0.5)'),
          borderWidth: 0, borderRadius: 2,
        }],
      },
      options: {
        ...chartDefaults,
        scales: {
          y: { display: false },
          x: { ticks: { font: { size: 9 }, maxRotation: 0, maxTicksLimit: 11 }, grid: { display: false } },
        },
      },
    })

    return () => Object.values(charts.current).forEach(c => c.destroy())
  }, [])

  const fmt = (v, decimals = 2, suffix = '') => `${v >= 0 ? '' : ''}${v.toFixed(decimals)}${suffix}`
  const pct  = (v, decimals = 1) => `${v >= 0 ? '+' : ''}${(v * 100).toFixed(decimals)}%`

  return (
    <div>
      {/* Metric cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, marginBottom: 16 }}>
        <MetricCard label="Sharpe Ratio"   value={fmt(data.sharpe)}    subtext="↑ Target > 1.0"            sentiment={data.sharpe > 1 ? 'good' : 'bad'} />
        <MetricCard label="Sortino Ratio"  value={fmt(data.sortino)}   subtext="Downside-adjusted"         sentiment={data.sortino > 1 ? 'good' : 'bad'} />
        <MetricCard label="Beta"           value={fmt(data.betaVal)}   subtext="vs benchmark"              sentiment="neutral" />
        <MetricCard label="Alpha (ann.)"   value={pct(data.alphaVal)}  subtext="Jensen's CAPM excess"      sentiment={data.alphaVal >= 0 ? 'good' : 'bad'} />
        <MetricCard label="VaR 95%"        value={pct(data.var95)}     subtext="1-day historical"          sentiment="bad" />
        <MetricCard label="Max Drawdown"   value={pct(data.mdd)}       subtext="Peak-to-trough"            sentiment="bad" />
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        <Panel title="Cumulative Return vs Benchmark">
          <div style={{ height: 200 }}><canvas ref={returnRef} /></div>
          <div style={{ display: 'flex', gap: 16, marginTop: 10 }}>
            {[['Portfolio', '#3266ad'], ['Benchmark', '#888780']].map(([l, c]) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-secondary)' }}>
                <div style={{ width: 18, height: 2, background: c, borderRadius: 1 }} />
                {l}
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Drawdown Periods">
          <div style={{ height: 200 }}><canvas ref={ddRef} /></div>
        </Panel>
      </div>

      <Panel title="Daily Return Distribution">
        <div style={{ height: 150 }}><canvas ref={distRef} /></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', marginTop: 4, padding: '0 2px' }}>
          {['-5%','-4%','-3%','-2%','-1%','0%','+1%','+2%','+3%','+4%','+5%'].map(l => <span key={l}>{l}</span>)}
        </div>
        <div style={{ marginTop: 8, display: 'flex', gap: 16 }}>
          {[['VaR tail (95%)', '#E24B4A'], ['Normal returns', 'rgba(50,102,173,0.6)']].map(([l, c]) => (
            <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-secondary)' }}>
              <div style={{ width: 10, height: 10, background: c, borderRadius: 2 }} />
              {l}
            </div>
          ))}
        </div>
      </Panel>
    </div>
  )
}
