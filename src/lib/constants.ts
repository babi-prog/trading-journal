import type { AccentTheme, TradeSession } from '@/types/trade'

export interface InstrumentConfig {
  symbol: string
  name: string
  category: 'Futures' | 'Forex' | 'Metals' | 'Crypto'
  basePrice: number
  pointValue: number
  stopRange: [number, number]
  lotStep: number
  lotMin: number
  priceStep: number
}

export const INSTRUMENTS: InstrumentConfig[] = [
  {
    symbol: 'NQ',
    name: 'Nasdaq 100 E-mini',
    category: 'Futures',
    basePrice: 21850,
    pointValue: 20,
    stopRange: [9, 26],
    lotStep: 1,
    lotMin: 1,
    priceStep: 0.25,
  },
  {
    symbol: 'ES',
    name: 'S&P 500 E-mini',
    category: 'Futures',
    basePrice: 5985,
    pointValue: 50,
    stopRange: [3.5, 9],
    lotStep: 1,
    lotMin: 1,
    priceStep: 0.25,
  },
  {
    symbol: 'USTEC',
    name: 'US Tech 100 CFD',
    category: 'Futures',
    basePrice: 21790,
    pointValue: 1,
    stopRange: [28, 75],
    lotStep: 0.5,
    lotMin: 0.5,
    priceStep: 0.1,
  },
  {
    symbol: 'EURUSD',
    name: 'Euro / US Dollar',
    category: 'Forex',
    basePrice: 1.0874,
    pointValue: 100_000,
    stopRange: [0.0018, 0.0052],
    lotStep: 0.01,
    lotMin: 0.01,
    priceStep: 0.00001,
  },
  {
    symbol: 'GBPUSD',
    name: 'British Pound / US Dollar',
    category: 'Forex',
    basePrice: 1.2712,
    pointValue: 100_000,
    stopRange: [0.002, 0.0058],
    lotStep: 0.01,
    lotMin: 0.01,
    priceStep: 0.00001,
  },
  {
    symbol: 'XAUUSD',
    name: 'Gold / US Dollar',
    category: 'Metals',
    basePrice: 2648.5,
    pointValue: 100,
    stopRange: [2.5, 7.5],
    lotStep: 0.01,
    lotMin: 0.01,
    priceStep: 0.01,
  },
  {
    symbol: 'BTCUSD',
    name: 'Bitcoin / US Dollar',
    category: 'Crypto',
    basePrice: 96850,
    pointValue: 1,
    stopRange: [320, 980],
    lotStep: 0.001,
    lotMin: 0.001,
    priceStep: 0.1,
  },
  {
    symbol: 'CL',
    name: 'Crude Oil WTI',
    category: 'Futures',
    basePrice: 71.4,
    pointValue: 1000,
    stopRange: [0.25, 0.75],
    lotStep: 0.01,
    lotMin: 0.01,
    priceStep: 0.01,
  },
]

export const INSTRUMENT_MAP = new Map(
  INSTRUMENTS.map((instrument) => [instrument.symbol, instrument]),
)

export const INSTRUMENT_SYMBOLS = INSTRUMENTS.map(
  (instrument) => instrument.symbol,
)

export const SESSION_META: Record<
  TradeSession,
  { label: string; window: string; color: string }
> = {
  Asia: { label: 'Asia', window: '00:00 – 06:00', color: '#7dd3fc' },
  London: { label: 'London', window: '07:00 – 11:30', color: '#c9f45c' },
  'NY AM': { label: 'New York AM', window: '09:30 – 12:00', color: '#3ddc97' },
  'NY PM': { label: 'New York PM', window: '13:30 – 17:00', color: '#fbbf24' },
}

export const SETUP_SUGGESTIONS = [
  '4H Wick',
  '5m MSS',
  'FVG',
  'PDH Sweep',
  'Order Block',
  'Liquidity Grab',
  'Trend Continuation',
  'Range Reversal',
  'Opening Drive',
  'VWAP Reclaim',
]

export const MISTAKE_SUGGESTIONS = [
  'Chased Entry',
  'Moved Stop',
  'FOMO',
  'Oversized',
  'Revenge Trade',
  'Early Exit',
  'Late Entry',
  'No Plan',
  'Ignored News',
  'Over-traded',
]

export const ACCENT_OPTIONS: {
  value: AccentTheme
  label: string
  swatch: string
}[] = [
  { value: 'lime', label: 'Casa Lime', swatch: '#c9f45c' },
  { value: 'cyan', label: 'Ice', swatch: '#67e8f9' },
  { value: 'violet', label: 'Iris', swatch: '#c4b5fd' },
  { value: 'amber', label: 'Ember', swatch: '#fcd34d' },
]

export const CURRENCIES = [
  { value: 'USD', label: 'USD — US Dollar' },
  { value: 'EUR', label: 'EUR — Euro' },
  { value: 'GBP', label: 'GBP — Pound Sterling' },
]

export const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
