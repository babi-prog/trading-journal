import type {
  JournalBackup,
  JournalSettings,
  Trade,
  TradeSession,
  TradeStatus,
} from '@/types/trade'
import {
  DEFAULT_SETTINGS,
  TRADE_DIRECTIONS,
  TRADE_SESSIONS,
  TRADE_STATUSES,
} from '@/types/trade'
import { statusFromR } from '@/lib/trade'
import { downloadBlob } from '@/lib/utils'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function asString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback
}

function asNumber(value: unknown, fallback = 0) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function asStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : []
}

function normalizeTrade(value: unknown): Trade | null {
  if (!isRecord(value)) return null
  if (typeof value.id !== 'string' || typeof value.date !== 'string') return null

  const riskAmount = asNumber(value.riskAmount)
  const realizedPnL = asNumber(value.realizedPnL)
  const rMultiple =
    typeof value.rMultiple === 'number' && Number.isFinite(value.rMultiple)
      ? value.rMultiple
      : riskAmount > 0
        ? realizedPnL / riskAmount
        : 0

  const session = TRADE_SESSIONS.includes(value.session as TradeSession)
    ? (value.session as TradeSession)
    : 'NY AM'
  const direction = TRADE_DIRECTIONS.includes(value.direction as Trade['direction'])
    ? (value.direction as Trade['direction'])
    : 'Long'
  const status = TRADE_STATUSES.includes(value.status as TradeStatus)
    ? (value.status as TradeStatus)
    : statusFromR(rMultiple)

  return {
    id: value.id,
    date: value.date,
    entryTime: asString(value.entryTime, '09:30'),
    exitTime: typeof value.exitTime === 'string' ? value.exitTime : undefined,
    session,
    instrument: asString(value.instrument, 'NQ'),
    direction,
    entryPrice: asNumber(value.entryPrice),
    stopLoss: asNumber(value.stopLoss),
    takeProfit:
      typeof value.takeProfit === 'number' && Number.isFinite(value.takeProfit)
        ? value.takeProfit
        : undefined,
    exitPrice: asNumber(value.exitPrice),
    lotSize: asNumber(value.lotSize, 1),
    riskAmount,
    realizedPnL,
    rMultiple,
    status,
    setupTags: asStringArray(value.setupTags),
    mistakes: asStringArray(value.mistakes),
    disciplineRating: asNumber(value.disciplineRating, 3),
    followedPlan: Boolean(value.followedPlan),
    preTradeImage: typeof value.preTradeImage === 'string' ? value.preTradeImage : undefined,
    postTradeImage:
      typeof value.postTradeImage === 'string' ? value.postTradeImage : undefined,
    notes: asString(value.notes),
  }
}

export function createBackup(
  settings: JournalSettings,
  trades: Trade[],
): JournalBackup {
  return {
    version: 1,
    app: 'traderscasa-journal',
    exportedAt: new Date().toISOString(),
    settings,
    trades,
  }
}

export function downloadJournalBackup(
  settings: JournalSettings,
  trades: Trade[],
) {
  const backup = createBackup(settings, trades)
  const date = new Date().toISOString().slice(0, 10)
  downloadBlob(
    JSON.stringify(backup, null, 2),
    `traderscasa-journal-${date}.json`,
    'application/json',
  )
}

export function parseJournalBackup(text: string): JournalBackup {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error('That file is not valid JSON.')
  }
  if (!isRecord(parsed) || parsed.app !== 'traderscasa-journal') {
    throw new Error('That does not look like a TraderCasa Journal backup.')
  }
  if (!Array.isArray(parsed.trades)) {
    throw new Error('The backup is missing its trade list.')
  }

  const trades = parsed.trades
    .map(normalizeTrade)
    .filter((trade): trade is Trade => trade !== null)

  if (trades.length === 0) {
    throw new Error('No valid trades were found in that backup.')
  }

  const rawSettings = isRecord(parsed.settings) ? parsed.settings : {}
  const settings: JournalSettings = {
    ...DEFAULT_SETTINGS,
    displayName: asString(rawSettings.displayName, DEFAULT_SETTINGS.displayName),
    accountName: asString(rawSettings.accountName, DEFAULT_SETTINGS.accountName),
    startingBalance: asNumber(
      rawSettings.startingBalance,
      DEFAULT_SETTINGS.startingBalance,
    ),
    currency:
      rawSettings.currency === 'EUR' || rawSettings.currency === 'GBP'
        ? rawSettings.currency
        : 'USD',
    defaultRisk: asNumber(rawSettings.defaultRisk, DEFAULT_SETTINGS.defaultRisk),
    accent:
      rawSettings.accent === 'cyan' ||
      rawSettings.accent === 'violet' ||
      rawSettings.accent === 'amber'
        ? rawSettings.accent
        : 'lime',
    weekStartsOn:
      rawSettings.weekStartsOn === 'sunday' ? 'sunday' : 'monday',
    initialized: true,
    createdAt: asString(rawSettings.createdAt, new Date().toISOString()),
  }

  return {
    version: 1,
    app: 'traderscasa-journal',
    exportedAt: asString(parsed.exportedAt, new Date().toISOString()),
    settings,
    trades,
  }
}

export function tradesToCsv(trades: Trade[]) {
  const headers = [
    'Date',
    'Entry time',
    'Exit time',
    'Session',
    'Instrument',
    'Direction',
    'Entry price',
    'Stop loss',
    'Take profit',
    'Exit price',
    'Size',
    'Risk',
    'P&L',
    'R multiple',
    'Status',
    'Setup tags',
    'Mistakes',
    'Discipline',
    'Followed plan',
    'Notes',
  ]

  const escape = (value: unknown) => {
    const text = value === undefined || value === null ? '' : String(value)
    return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
  }

  const rows = trades.map((trade) =>
    [
      trade.date,
      trade.entryTime,
      trade.exitTime ?? '',
      trade.session,
      trade.instrument,
      trade.direction,
      trade.entryPrice,
      trade.stopLoss,
      trade.takeProfit ?? '',
      trade.exitPrice,
      trade.lotSize,
      trade.riskAmount,
      trade.realizedPnL,
      trade.rMultiple,
      trade.status,
      trade.setupTags.join('; '),
      trade.mistakes.join('; '),
      trade.disciplineRating,
      trade.followedPlan ? 'Yes' : 'No',
      trade.notes,
    ]
      .map(escape)
      .join(','),
  )

  return [headers.join(','), ...rows].join('\r\n')
}

export function downloadTradesCsv(trades: Trade[]) {
  const date = new Date().toISOString().slice(0, 10)
  downloadBlob(
    `\uFEFF${tradesToCsv(trades)}`,
    `traderscasa-trades-${date}.csv`,
    'text/csv;charset=utf-8',
  )
}
