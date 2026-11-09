export const TRADE_SESSIONS = ['Asia', 'London', 'NY AM', 'NY PM'] as const
export type TradeSession = (typeof TRADE_SESSIONS)[number]

export const TRADE_DIRECTIONS = ['Long', 'Short'] as const
export type TradeDirection = (typeof TRADE_DIRECTIONS)[number]

export const TRADE_STATUSES = ['Win', 'Loss', 'BE'] as const
export type TradeStatus = (typeof TRADE_STATUSES)[number]

export interface Trade {
  id: string
  /** ISO date — YYYY-MM-DD */
  date: string
  /** HH:mm */
  entryTime: string
  /** HH:mm */
  exitTime?: string
  session: TradeSession
  instrument: string
  direction: TradeDirection
  entryPrice: number
  stopLoss: number
  takeProfit?: number
  exitPrice: number
  lotSize: number
  /** Absolute $ risked */
  riskAmount: number
  /** Net $ profit/loss */
  realizedPnL: number
  /** Realized R */
  rMultiple: number
  status: TradeStatus

  setupTags: string[]
  mistakes: string[]
  disciplineRating: number
  followedPlan: boolean

  preTradeImage?: string
  postTradeImage?: string
  notes: string
}

export type TradeDraft = Omit<Trade, 'id' | 'rMultiple' | 'status'>

export type AccentTheme = 'lime' | 'cyan' | 'violet' | 'amber'

export interface JournalSettings {
  id: 'app'
  displayName: string
  accountName: string
  startingBalance: number
  currency: 'USD' | 'EUR' | 'GBP'
  defaultRisk: number
  accent: AccentTheme
  weekStartsOn: 'monday' | 'sunday'
  initialized: boolean
  createdAt: string
}

export interface JournalBackup {
  version: 1
  app: 'traderscasa-journal'
  exportedAt: string
  settings: JournalSettings
  trades: Trade[]
}

export const DEFAULT_SETTINGS: JournalSettings = {
  id: 'app',
  displayName: 'Trader',
  accountName: 'Main Account',
  startingBalance: 50000,
  currency: 'USD',
  defaultRisk: 250,
  accent: 'lime',
  weekStartsOn: 'monday',
  initialized: false,
  createdAt: new Date().toISOString(),
}
