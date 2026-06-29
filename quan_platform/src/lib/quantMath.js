// ─── quantMath.js ─────────────────────────────────────────────────────────────
// Pure calculation functions. No React, no side-effects.
// Swap generateDemoReturns() for real broker data in production.
// ──────────────────────────────────────────────────────────────────────────────

export const TRADING_DAYS = 252

// ── Utilities ─────────────────────────────────────────────────────────────────

export function mean(arr) {
  return arr.reduce((s, v) => s + v, 0) / arr.length
}

export function stdDev(arr) {
  const m = mean(arr)
  const variance = arr.reduce((s, v) => s + (v - m) ** 2, 0) / (arr.length - 1)
  return Math.sqrt(variance)
}

export function boxMuller() {
  let u = 0, v = 0
  while (u === 0) u = Math.random()
  while (v === 0) v = Math.random()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

// ── Core Ratios ────────────────────────────────────────────────────────────────

/** Sharpe Ratio (annualised) */
export function sharpeRatio(dailyReturns, riskFreeRate = 0.05) {
  const rfDaily = riskFreeRate / TRADING_DAYS
  const excess = dailyReturns.map(r => r - rfDaily)
  const annReturn = mean(excess) * TRADING_DAYS
  const annVol = stdDev(excess) * Math.sqrt(TRADING_DAYS)
  return annVol === 0 ? 0 : annReturn / annVol
}

/** Sortino Ratio — penalises downside deviation only */
export function sortinoRatio(dailyReturns, riskFreeRate = 0.05) {
  const rfDaily = riskFreeRate / TRADING_DAYS
  const excess = dailyReturns.map(r => r - rfDaily)
  const annReturn = mean(excess) * TRADING_DAYS
  const downside = excess.filter(r => r < 0)
  if (downside.length === 0) return Infinity
  const downsideDev = Math.sqrt(downside.reduce((s, r) => s + r ** 2, 0) / downside.length) * Math.sqrt(TRADING_DAYS)
  return downsideDev === 0 ? 0 : annReturn / downsideDev
}

/** Beta — portfolio sensitivity vs market */
export function beta(portfolioReturns, marketReturns) {
  const mp = mean(portfolioReturns), mm = mean(marketReturns)
  const cov = portfolioReturns.reduce((s, r, i) => s + (r - mp) * (marketReturns[i] - mm), 0) / (portfolioReturns.length - 1)
  const varM = marketReturns.reduce((s, r) => s + (r - mm) ** 2, 0) / (marketReturns.length - 1)
  return varM === 0 ? 0 : cov / varM
}

/** Alpha (Jensen's) — annualised excess return over CAPM prediction */
export function alpha(portfolioReturns, marketReturns, riskFreeRate = 0.05) {
  const b = beta(portfolioReturns, marketReturns)
  const annPort = mean(portfolioReturns) * TRADING_DAYS
  const annMarket = mean(marketReturns) * TRADING_DAYS
  return annPort - (riskFreeRate + b * (annMarket - riskFreeRate))
}

/** Value at Risk — historical simulation at given confidence */
export function valueAtRisk(dailyReturns, confidence = 0.95) {
  const sorted = [...dailyReturns].sort((a, b) => a - b)
  const idx = Math.floor((1 - confidence) * sorted.length)
  return sorted[idx]
}

/** Maximum Drawdown from a price/value series */
export function maxDrawdown(prices) {
  let peak = prices[0], peakIdx = 0, mdd = 0, troughIdx = 0
  for (let i = 1; i < prices.length; i++) {
    if (prices[i] > peak) { peak = prices[i]; peakIdx = i }
    const dd = (prices[i] - peak) / peak
    if (dd < mdd) { mdd = dd; troughIdx = i }
  }
  return { mdd, peak: prices[peakIdx], trough: prices[troughIdx], peakIdx, troughIdx }
}

/** Convert daily returns to a cumulative price series */
export function returnsToPrices(returns, start = 100) {
  const prices = [start]
  for (const r of returns) prices.push(prices[prices.length - 1] * (1 + r))
  return prices
}

export function annualisedReturn(dailyReturns) {
  return mean(dailyReturns) * TRADING_DAYS
}

export function annualisedVol(dailyReturns) {
  return stdDev(dailyReturns) * Math.sqrt(TRADING_DAYS)
}

// ── Monte Carlo (GBM) ──────────────────────────────────────────────────────────

/**
 * @param {object} opts
 * @param {number} opts.simulations
 * @param {number} opts.days
 * @param {number} opts.initialValue
 * @param {number} opts.dailyMu
 * @param {number} opts.dailySigma
 */
export function monteCarlo({ simulations = 1000, days = 252, initialValue = 100000, dailyMu = 0.0003, dailySigma = 0.012 }) {
  const paths = []
  for (let s = 0; s < simulations; s++) {
    let v = initialValue
    const path = [v]
    for (let d = 0; d < days; d++) {
      v = v * Math.exp((dailyMu - 0.5 * dailySigma ** 2) + dailySigma * boxMuller())
      path.push(v)
    }
    paths.push(path)
  }

  const byDay = (pct) =>
    Array.from({ length: days + 1 }, (_, d) => {
      const vals = paths.map(p => p[d]).sort((a, b) => a - b)
      return Math.round(vals[Math.floor(pct * vals.length)])
    })

  const finals = paths.map(p => p[days])
  const probLoss = finals.filter(v => v < initialValue).length / simulations
  const sortedFinals = [...finals].sort((a, b) => a - b)
  const pct = (p) => sortedFinals[Math.floor(p * sortedFinals.length)]

  return {
    p10: byDay(0.10), p25: byDay(0.25),
    p50: byDay(0.50), p75: byDay(0.75), p90: byDay(0.90),
    probLoss, allFinal: finals,
    percentiles: { p10: pct(0.10), p25: pct(0.25), p50: pct(0.50), p75: pct(0.75), p90: pct(0.90) }
  }
}

// ── Demo Data ──────────────────────────────────────────────────────────────────
// Replace with real CSV/API data for production use

export function generateDemoReturns(days = 252, mu = 0.0004, sigma = 0.013) {
  return Array.from({ length: days }, () => mu + sigma * boxMuller())
}

export function generateDemoBenchmarkReturns(portfolioReturns, betaTarget = 0.85) {
  return portfolioReturns.map(r => (r / betaTarget) + (Math.random() - 0.5) * 0.003)
}

// ── Scenarios ──────────────────────────────────────────────────────────────────

export const SCENARIOS = [
  { id: 'gfc',    name: '2008 GFC',           annReturn: -0.385, volMult: 3.2, color: '#E24B4A', desc: 'Lehman collapse, credit freeze' },
  { id: 'covid',  name: 'COVID Crash (2020)', annReturn: -0.339, volMult: 2.8, color: '#D85A30', desc: 'Pandemic shock, fastest bear market' },
  { id: 'dotcom', name: 'Dot-com Bust',       annReturn: -0.221, volMult: 2.1, color: '#BA7517', desc: 'Tech bubble unwinding 2000–02' },
  { id: 'rates',  name: 'Rate Shock +300bps', annReturn: -0.142, volMult: 1.6, color: '#185FA5', desc: 'Rapid Fed tightening cycle' },
  { id: 'mild',   name: 'Mild Recession',     annReturn: -0.085, volMult: 1.3, color: '#5F5E5A', desc: 'Soft landing, gradual contraction' },
  { id: 'bull',   name: 'Bull Market +20%',   annReturn:  0.183, volMult: 0.7, color: '#1D9E75', desc: 'Risk-on, low volatility rally' },
]

export function applyScenario(baseMetrics, scenario) {
  const { sharpe, sortino, betaVal, alphaVal, var95, mdd } = baseMetrics
  return {
    sharpe:    +(sharpe   / scenario.volMult + scenario.annReturn * 2).toFixed(2),
    sortino:   +(sortino  / scenario.volMult + scenario.annReturn * 1.5).toFixed(2),
    betaVal:   +(betaVal  * (1 + (scenario.volMult - 1) * 0.3)).toFixed(2),
    alphaVal:  +(alphaVal + scenario.annReturn * 0.4).toFixed(4),
    var95:     +(var95    * scenario.volMult).toFixed(4),
    mdd:       +(mdd      * scenario.volMult - Math.abs(scenario.annReturn) * 0.3).toFixed(4),
    annReturn: scenario.annReturn,
  }
}
