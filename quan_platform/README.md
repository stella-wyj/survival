# QuantCore Analytics — Setup Guide

A self-contained React + Vite quant analytics platform.
No paid APIs required to run. Swap demo data for real feeds when ready.

---

## Prerequisites

| Tool       | Version  | Install                          |
|------------|----------|----------------------------------|
| Node.js    | 18 +     | https://nodejs.org               |
| npm        | 9 +      | bundled with Node                |
| VS Code    | any      | https://code.visualstudio.com    |

---


## Dependencies (all free, no API keys needed)

| Package           | Purpose                          |
|-------------------|----------------------------------|
| react 18          | UI framework                     |
| react-dom 18      | DOM renderer                     |
| chart.js 4        | Canvas charting                  |
| react-chartjs-2 5 | React wrapper for Chart.js       |
| lucide-react      | Icon set (optional, unused hook) |
| vite 5            | Dev server + bundler             |

---

## Replacing Demo Data with Real Data

All calculations live in `src/lib/quantMath.js`.
The demo generators are at the bottom of that file:

```js
// src/lib/quantMath.js  (lines ~110-115)
export function generateDemoReturns(days = 252, mu = 0.0004, sigma = 0.013) { ... }
export function generateDemoBenchmarkReturns(portfolioReturns, betaTarget = 0.85) { ... }
```

### Option A — CSV file

```bash
npm install papaparse
```

```js
import Papa from 'papaparse'

async function loadReturns(csvPath) {
  const text = await fetch(csvPath).then(r => r.text())
  const { data } = Papa.parse(text, { header: true, dynamicTyping: true })
  // CSV columns: date, close
  const closes = data.map(row => row.close)
  return closes.slice(1).map((c, i) => (c - closes[i]) / closes[i])
}
```

### Option B — Free market data APIs (no key required)

```
Yahoo Finance (unofficial)
  GET https://query1.finance.yahoo.com/v8/finance/chart/AAPL?interval=1d&range=1y

Alpha Vantage (free tier, key needed)
  https://www.alphavantage.co/support/#api-key   ← free key

Polygon.io (free tier)
  https://polygon.io                              ← free key
```

### Option C — Broker API (real portfolio)

Most brokers expose OAuth APIs. Plug the daily P&L series directly into
the calculation functions in `quantMath.js`.

---

## Build for Production

```bash
npm run build       # outputs to /dist
npm run preview     # preview the production build locally
```

To deploy: drag the `/dist` folder to Netlify, Vercel, or any static host.

---

## Optional: Desktop App (Electron)

To wrap this as a desktop `.exe` / `.app`:

```bash
npm install --save-dev electron electron-builder concurrently wait-on

# Add to package.json scripts:
"electron:dev":   "concurrently \"npm run dev\" \"wait-on http://localhost:3000 && electron .\"",
"electron:build": "npm run build && electron-builder"
```

Create `electron/main.js`:

```js
const { app, BrowserWindow } = require('electron')
const path = require('path')

app.whenReady().then(() => {
  const win = new BrowserWindow({ width: 1280, height: 800 })
  win.loadURL('http://localhost:3000')   // dev
  // win.loadFile(path.join(__dirname, '../dist/index.html'))  // prod
})
```

Add to `package.json`:
```json
"main": "electron/main.js",
"build": { "appId": "com.quantcore.app", "files": ["dist/**", "electron/**"] }
```

---

## VS Code Extensions (recommended)

- **ES7+ React/Redux/React-Native snippets** — `dsznajder.es7-react-js-snippets`
- **Vite**                                  — `antfu.vite`
- **Prettier**                              — `esbenp.prettier-vscode`
- **ESLint**                                — `dbaeumer.vscode-eslint`

---

## Troubleshooting

| Problem                         | Fix                                              |
|---------------------------------|--------------------------------------------------|
| `npm install` fails             | Ensure Node 18+: `node -v`                       |
| Port 3000 in use                | Change port in `vite.config.js`                  |
| Charts not rendering            | Refresh — Chart.js needs canvas mount            |
| Dark mode not applying          | Depends on OS preference, or add a toggle button |
