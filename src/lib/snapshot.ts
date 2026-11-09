import type {
  TradeDirection,
  TradeSession,
  TradeStatus,
} from '@/types/trade'
import { formatPrice } from '@/lib/utils'

export interface SnapshotOptions {
  seed: number
  instrument: string
  session: TradeSession
  direction: TradeDirection
  phase: 'pre' | 'post'
  entry: number
  stop: number
  target?: number
  exit?: number
  outcome?: TradeStatus
  date: string
}

function mulberry32(seed: number) {
  let value = seed >>> 0
  return () => {
    value = (value + 0x6d2b79f5) >>> 0
    let t = value
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hashString(input: string) {
  let hash = 2166136261
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function escapeXml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function shortDate(date: string) {
  const parsed = new Date(`${date}T00:00:00`)
  return parsed
    .toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    .toUpperCase()
}

export function snapshotSeed(id: string, phase: string) {
  return hashString(`${id}:${phase}`)
}

export function makeTradeSnapshot(options: SnapshotOptions) {
  const rand = mulberry32(options.seed)
  const width = 960
  const height = 560
  const padLeft = 30
  const padRight = 150
  const padTop = 92
  const padBottom = 42
  const chartWidth = width - padLeft - padRight
  const chartHeight = height - padTop - padBottom
  const count = 58
  const sign = options.direction === 'Long' ? 1 : -1
  const stopDistance = Math.abs(options.entry - options.stop) || options.entry * 0.002

  const levels = [options.entry, options.stop, options.exit, options.target].filter(
    (value): value is number => typeof value === 'number' && Number.isFinite(value),
  )
  let min = Math.min(...levels)
  let max = Math.max(...levels)
  const spanPad = (max - min || options.entry * 0.004) * 0.22
  min -= spanPad
  max += spanPad

  const xAt = (index: number) => padLeft + (index / (count - 1)) * chartWidth
  const yAt = (price: number) =>
    padTop + ((max - price) / (max - min)) * chartHeight

  const start =
    options.phase === 'pre'
      ? options.entry - sign * stopDistance * 0.9
      : options.entry - sign * stopDistance * 0.35
  const end = options.phase === 'pre' ? options.entry : (options.exit ?? options.entry)

  const closes: number[] = []
  for (let index = 0; index < count; index += 1) {
    const t = index / (count - 1)
    const trend = start + (end - start) * t
    const wave =
      Math.sin(t * Math.PI * 3.1 + (options.seed % 11)) *
      stopDistance *
      0.18 *
      (1 - t * 0.35)
    const noise = (rand() - 0.5) * stopDistance * 0.14
    const adverseSpike =
      options.phase === 'post' && options.outcome === 'Loss' && t > 0.72
        ? -sign *
          stopDistance *
          0.65 *
          Math.sin(((t - 0.72) / 0.28) * Math.PI)
        : 0
    closes.push(trend + wave + noise + adverseSpike)
  }

  const candles: string[] = []
  let previousClose = closes[0] ?? options.entry
  for (let index = 0; index < count; index += 1) {
    const close = closes[index] ?? previousClose
    const open =
      index === 0
        ? close - (rand() - 0.5) * stopDistance * 0.2
        : previousClose
    const high = Math.max(open, close) + rand() * stopDistance * 0.11
    const low = Math.min(open, close) - rand() * stopDistance * 0.11
    previousClose = close
    const up = close >= open
    const color = up ? '#3ddc97' : '#fb7185'
    const bodyTop = yAt(Math.max(open, close))
    const bodyHeight = Math.max(1.5, Math.abs(yAt(open) - yAt(close)))
    const candleWidth = Math.max(3, (chartWidth / count) * 0.56)
    const x = xAt(index) - candleWidth / 2
    candles.push(
      `<line x1="${xAt(index).toFixed(1)}" y1="${yAt(high).toFixed(1)}" x2="${xAt(index).toFixed(1)}" y2="${yAt(low).toFixed(1)}" stroke="${color}" stroke-width="1.2" opacity=".95"/>`,
      `<rect x="${x.toFixed(1)}" y="${bodyTop.toFixed(1)}" width="${candleWidth.toFixed(1)}" height="${bodyHeight.toFixed(1)}" rx="0.8" fill="${color}" opacity="${up ? 0.92 : 0.85}"/>`,
    )
  }

  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((fraction) => {
    const price = max - fraction * (max - min)
    const y = padTop + fraction * chartHeight
    return `<line x1="${padLeft}" y1="${y.toFixed(1)}" x2="${width - padRight + 16}" y2="${y.toFixed(1)}" stroke="#1a2230" stroke-width="1" stroke-dasharray="2 6" opacity=".8"/>
    <text x="${width - padRight + 22}" y="${(y + 3.5).toFixed(1)}" fill="#647084" font-size="10.5" font-family="Inter, system-ui, sans-serif">${formatPrice(price, options.instrument)}</text>`
  })

  const verticalGrid = [0.2, 0.4, 0.6, 0.8].map((fraction) => {
    const x = padLeft + fraction * chartWidth
    return `<line x1="${x.toFixed(1)}" y1="${padTop}" x2="${x.toFixed(1)}" y2="${height - padBottom}" stroke="#151c28" stroke-width="1" stroke-dasharray="3 7"/>`
  })

  const levelRow = (
    price: number | undefined,
    label: string,
    color: string,
    dash: string,
  ) => {
    if (!Number.isFinite(price)) return ''
    const y = yAt(price as number)
    return `<line x1="${padLeft}" y1="${y.toFixed(1)}" x2="${width - padRight + 14}" y2="${y.toFixed(1)}" stroke="${color}" stroke-width="1.2" stroke-dasharray="${dash}" opacity=".9"/>
    <rect x="${width - padRight + 20}" y="${(y - 9).toFixed(1)}" width="112" height="18" rx="4" fill="${color}" fill-opacity=".12" stroke="${color}" stroke-opacity=".35"/>
    <text x="${width - padRight + 26}" y="${(y + 3.5).toFixed(1)}" fill="${color}" font-size="9.5" font-weight="600" font-family="Inter, system-ui, sans-serif">${label} ${formatPrice(price as number, options.instrument)}</text>`
  }

  const outcomeColor =
    options.outcome === 'Win'
      ? '#3ddc97'
      : options.outcome === 'Loss'
        ? '#fb7185'
        : '#98a2b3'
  const phaseLabel = options.phase === 'pre' ? 'PRE-TRADE' : 'POST-TRADE'

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#0d121b"/>
        <stop offset="1" stop-color="#080c12"/>
      </linearGradient>
      <radialGradient id="glow" cx="0.2" cy="0" r="0.9">
        <stop offset="0" stop-color="#c9f45c" stop-opacity=".07"/>
        <stop offset="1" stop-color="#c9f45c" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="${width}" height="${height}" fill="url(#bg)"/>
    <rect width="${width}" height="${height}" fill="url(#glow)"/>
    <line x1="0" y1="1" x2="${width}" y2="1" stroke="#c9f45c" stroke-opacity=".3"/>
    ${gridLines.join('')}
    ${verticalGrid.join('')}
    ${candles.join('')}
    ${levelRow(options.entry, 'ENTRY', '#c9f45c', '6 5')}
    ${levelRow(options.stop, 'STOP', '#fb7185', '5 5')}
    ${levelRow(options.target, 'TARGET', '#3ddc97', '3 6')}
    ${options.phase === 'post' ? levelRow(options.exit, 'EXIT', '#e2e8f0', '2 5') : ''}
    <text x="${padLeft}" y="42" fill="#edf0f6" font-size="19" font-weight="600" font-family="Inter, system-ui, sans-serif">${escapeXml(options.instrument)} <tspan fill="#647084" font-weight="500">· 5M · ${phaseLabel}</tspan></text>
    <text x="${padLeft}" y="63" fill="#647084" font-size="10.5" letter-spacing="1.4" font-family="Inter, system-ui, sans-serif">${escapeXml(shortDate(options.date))}  ·  ${escapeXml(options.session.toUpperCase())}  ·  ${options.direction.toUpperCase()}</text>
    <g transform="translate(${width - padRight - 100}, 28)">
      <rect width="100" height="26" rx="13" fill="#101722" stroke="#273245"/>
      <circle cx="14" cy="13" r="3" fill="${outcomeColor}"/>
      <text x="24" y="17" fill="${outcomeColor}" font-size="10" font-weight="600" letter-spacing="0.6" font-family="Inter, system-ui, sans-serif">${options.phase === 'pre' ? 'PLANNED' : escapeXml((options.outcome ?? 'CLOSED').toUpperCase())}</text>
    </g>
    <text x="${width - 30}" y="${height - 16}" text-anchor="end" fill="#364152" font-size="10" letter-spacing="2.2" font-family="Inter, system-ui, sans-serif">TRADERCASA JOURNAL</text>
  </svg>`

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}
