import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function uid() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `tc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
}

const currencyFormatters = new Map<string, Intl.NumberFormat>()

function currencyFormatter(currency: string, minimumFractionDigits = 2) {
  const key = `${currency}:${minimumFractionDigits}`
  let formatter = currencyFormatters.get(key)
  if (!formatter) {
    formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits,
      maximumFractionDigits: 2,
    })
    currencyFormatters.set(key, formatter)
  }
  return formatter
}

export function formatCurrency(
  value: number,
  currency = 'USD',
  options: { decimals?: number; compact?: boolean } = {},
) {
  if (!Number.isFinite(value)) return '—'
  if (options.compact) {
    const compact = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      notation: 'compact',
      maximumFractionDigits: 1,
    })
    return compact.format(value)
  }
  return currencyFormatter(currency, options.decimals ?? 2).format(value)
}

export function formatSignedCurrency(value: number, currency = 'USD') {
  if (!Number.isFinite(value)) return '—'
  const formatted = formatCurrency(value, currency)
  return value > 0 ? `+${formatted}` : formatted
}

export function formatPercent(value: number, digits = 0) {
  if (!Number.isFinite(value)) return '—'
  return `${value.toFixed(digits)}%`
}

export function formatNumber(value: number, digits = 2) {
  if (!Number.isFinite(value)) return '—'
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)
}

export function formatR(value: number) {
  if (!Number.isFinite(value)) return '—'
  if (Math.abs(value) < 0.005) return '0.00R'
  return `${value > 0 ? '+' : ''}${value.toFixed(2)}R`
}

export function formatPrice(value: number, instrument: string) {
  const decimals = instrument === 'EURUSD' || instrument === 'GBPUSD' ? 5 : 2
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

export function formatDuration(minutes: number) {
  if (!Number.isFinite(minutes) || minutes <= 0) return '—'
  if (minutes < 60) return `${Math.round(minutes)}m`
  const hours = Math.floor(minutes / 60)
  const rest = Math.round(minutes % 60)
  return rest ? `${hours}h ${rest}m` : `${hours}h`
}

export function formatBytes(bytes: number) {
  if (!bytes) return '0 MB'
  const units = ['B', 'KB', 'MB', 'GB']
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  )
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`
}

export function parseDate(iso: string) {
  return new Date(`${iso}T00:00:00`)
}

export function todayISO() {
  const now = new Date()
  const offset = now.getTimezoneOffset()
  return new Date(now.getTime() - offset * 60_000).toISOString().slice(0, 10)
}

export function formatDate(
  iso: string,
  options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' },
) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('en-US', options).format(parseDate(iso))
}

export function formatDateLong(iso: string) {
  return formatDate(iso, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatDayShort(iso: string) {
  return formatDate(iso, { month: 'short', day: 'numeric' })
}

export function to12Hour(time?: string) {
  if (!time) return '—'
  const [rawHours = '0', minutes = '00'] = time.split(':')
  const hours = Number(rawHours)
  const suffix = hours >= 12 ? 'PM' : 'AM'
  const display = hours % 12 === 0 ? 12 : hours % 12
  return `${display}:${minutes} ${suffix}`
}

export type RangePreset = '7d' | '30d' | '90d' | 'ytd' | 'all'

export const RANGE_PRESETS: { value: RangePreset; label: string; short: string }[] = [
  { value: '7d', label: 'Last 7 days', short: '7D' },
  { value: '30d', label: 'Last 30 days', short: '30D' },
  { value: '90d', label: 'Last 90 days', short: '90D' },
  { value: 'ytd', label: 'Year to date', short: 'YTD' },
  { value: 'all', label: 'All time', short: 'ALL' },
]

export interface DateBounds {
  start?: string
  end: string
  days: number
}

function isoOf(date: Date) {
  const offset = date.getTimezoneOffset()
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 10)
}

export function getRangeBounds(
  preset: RangePreset,
  now = new Date(),
): DateBounds {
  const end = isoOf(now)
  if (preset === 'all') {
    return { end, days: 3650 }
  }
  if (preset === 'ytd') {
    const start = new Date(now.getFullYear(), 0, 1)
    const days =
      Math.round((now.getTime() - start.getTime()) / 86_400_000) + 1
    return { start: isoOf(start), end, days }
  }
  const days = preset === '7d' ? 7 : preset === '30d' ? 30 : 90
  const start = new Date(now.getTime() - (days - 1) * 86_400_000)
  return { start: isoOf(start), end, days }
}

export function getPreviousBounds(
  preset: RangePreset,
  now = new Date(),
): DateBounds | null {
  if (preset === 'all') return null
  if (preset === 'ytd') {
    const year = now.getFullYear() - 1
    return {
      start: isoOf(new Date(year, 0, 1)),
      end: isoOf(new Date(year, 11, 31)),
      days: 365,
    }
  }
  const current = getRangeBounds(preset, now)
  const start = parseDate(current.start!)
  const previousEnd = new Date(start.getTime() - 86_400_000)
  const previousStart = new Date(
    previousEnd.getTime() - (current.days - 1) * 86_400_000,
  )
  return {
    start: isoOf(previousStart),
    end: isoOf(previousEnd),
    days: current.days,
  }
}

export function isInBounds(date: string, bounds: DateBounds | null) {
  if (!bounds) return true
  if (bounds.start && date < bounds.start) return false
  return date <= bounds.end
}

export function percentChange(current: number, previous: number) {
  if (!Number.isFinite(previous) || previous === 0) {
    return current === 0 ? 0 : null
  }
  return ((current - previous) / Math.abs(previous)) * 100
}

export type PnlTone = 'positive' | 'negative' | 'neutral'

export function pnlTone(value: number): PnlTone {
  if (value > 0.004) return 'positive'
  if (value < -0.004) return 'negative'
  return 'neutral'
}

export function toneText(tone: PnlTone) {
  return tone === 'positive'
    ? 'text-positive'
    : tone === 'negative'
      ? 'text-negative'
      : 'text-muted'
}

export function toneBg(tone: PnlTone) {
  return tone === 'positive'
    ? 'bg-positive/10 text-positive border-positive/25'
    : tone === 'negative'
      ? 'bg-negative/10 text-negative border-negative/25'
      : 'bg-white/5 text-muted border-line-strong'
}

export function downloadBlob(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function roundTo(value: number, step: number) {
  if (!Number.isFinite(value) || step <= 0) return value
  const precision = Math.max(0, -Math.floor(Math.log10(step)))
  return Number((Math.round(value / step) * step).toFixed(precision))
}

export function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function holdMinutes(entryTime: string, exitTime?: string) {
  if (!exitTime) return 0
  const [entryH = 0, entryM = 0] = entryTime.split(':').map(Number)
  const [exitH = 0, exitM = 0] = exitTime.split(':').map(Number)
  let minutes = exitH * 60 + exitM - (entryH * 60 + entryM)
  if (minutes < 0) minutes += 24 * 60
  return minutes
}

export function pnlToneForStatus(status: string): PnlTone {
  if (status === 'Win') return 'positive'
  if (status === 'Loss') return 'negative'
  return 'neutral'
}
