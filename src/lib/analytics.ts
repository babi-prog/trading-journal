import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import type { Trade, TradeStatus } from '@/types/trade'
import { TRADE_SESSIONS } from '@/types/trade'
import { WEEKDAY_LABELS } from '@/lib/constants'
import { sortTradesNewest, sortTradesOldest } from '@/lib/trade'
import {
  formatDayShort,
  getRangeBounds,
  holdMinutes,
  isInBounds,
  parseDate,
  type DateBounds,
  type RangePreset,
} from '@/lib/utils'

export interface CoreMetrics {
  totalTrades: number
  tradingDays: number
  wins: number
  losses: number
  breakEven: number
  winRate: number
  netPnl: number
  grossProfit: number
  grossLoss: number
  profitFactor: number
  avgWin: number
  avgLoss: number
  avgR: number
  expectancy: number
  largestWin: number
  largestLoss: number
  maxDrawdown: number
  maxDrawdownPct: number
  currentStreak: { status: TradeStatus; count: number } | null
  bestWinStreak: number
  worstLossStreak: number
  planFollowedRate: number
  avgDiscipline: number
  avgHoldMinutes: number
  totalRisk: number
}

export function computeMetrics(
  trades: Trade[],
  startingBalance = 0,
): CoreMetrics {
  const winsTrades = trades.filter((trade) => trade.status === 'Win')
  const lossTrades = trades.filter((trade) => trade.status === 'Loss')
  const beTrades = trades.filter((trade) => trade.status === 'BE')
  const netPnl = trades.reduce((sum, trade) => sum + trade.realizedPnL, 0)
  const grossProfit = trades.reduce(
    (sum, trade) => (trade.realizedPnL > 0 ? sum + trade.realizedPnL : sum),
    0,
  )
  const grossLoss = trades.reduce(
    (sum, trade) => (trade.realizedPnL < 0 ? sum + trade.realizedPnL : sum),
    0,
  )
  const winRate =
    winsTrades.length + lossTrades.length > 0
      ? (winsTrades.length / (winsTrades.length + lossTrades.length)) * 100
      : 0

  const sorted = sortTradesOldest(trades)
  let equity = startingBalance
  let peak = startingBalance
  let maxDrawdown = 0
  let maxDrawdownPct = 0
  let winStreak = 0
  let lossStreak = 0
  let bestWinStreak = 0
  let worstLossStreak = 0

  for (const trade of sorted) {
    equity += trade.realizedPnL
    peak = Math.max(peak, equity)
    const drawdown = peak - equity
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown
      maxDrawdownPct = peak > 0 ? (drawdown / peak) * 100 : 0
    }

    if (trade.status === 'Win') {
      winStreak += 1
      lossStreak = 0
      bestWinStreak = Math.max(bestWinStreak, winStreak)
    } else if (trade.status === 'Loss') {
      lossStreak += 1
      winStreak = 0
      worstLossStreak = Math.max(worstLossStreak, lossStreak)
    } else {
      winStreak = 0
      lossStreak = 0
    }
  }

  const newest = sortTradesNewest(trades)
  let currentStreak: CoreMetrics['currentStreak'] = null
  if (newest.length > 0) {
    const status = newest[0]!.status
    let count = 0
    for (const trade of newest) {
      if (trade.status !== status) break
      count += 1
    }
    currentStreak = { status, count }
  }

  const holdTotal = trades.reduce(
    (sum, trade) => sum + holdMinutes(trade.entryTime, trade.exitTime),
    0,
  )
  const holds = trades.filter((trade) => trade.exitTime).length

  return {
    totalTrades: trades.length,
    tradingDays: new Set(trades.map((trade) => trade.date)).size,
    wins: winsTrades.length,
    losses: lossTrades.length,
    breakEven: beTrades.length,
    winRate,
    netPnl,
    grossProfit,
    grossLoss,
    profitFactor:
      Math.abs(grossLoss) > 0
        ? grossProfit / Math.abs(grossLoss)
        : grossProfit > 0
          ? Number.POSITIVE_INFINITY
          : 0,
    avgWin: winsTrades.length ? grossProfit / winsTrades.length : 0,
    avgLoss: lossTrades.length ? grossLoss / lossTrades.length : 0,
    avgR:
      trades.length > 0
        ? trades.reduce((sum, trade) => sum + trade.rMultiple, 0) / trades.length
        : 0,
    expectancy: trades.length ? netPnl / trades.length : 0,
    largestWin: trades.length
      ? Math.max(...trades.map((trade) => trade.realizedPnL))
      : 0,
    largestLoss: trades.length
      ? Math.min(...trades.map((trade) => trade.realizedPnL))
      : 0,
    maxDrawdown,
    maxDrawdownPct,
    currentStreak,
    bestWinStreak,
    worstLossStreak,
    planFollowedRate: trades.length
      ? (trades.filter((trade) => trade.followedPlan).length / trades.length) * 100
      : 0,
    avgDiscipline: trades.length
      ? trades.reduce((sum, trade) => sum + trade.disciplineRating, 0) /
        trades.length
      : 0,
    avgHoldMinutes: holds ? holdTotal / holds : 0,
    totalRisk: trades.reduce((sum, trade) => sum + trade.riskAmount, 0),
  }
}

export interface EquityPoint {
  date: string
  label: string
  equity: number
  pnl: number
  drawdown: number
  trades: number
}

export function buildEquitySeries(trades: Trade[], startingBalance: number) {
  const byDay = new Map<string, { pnl: number; trades: number }>()
  for (const trade of sortTradesOldest(trades)) {
    const entry = byDay.get(trade.date) ?? { pnl: 0, trades: 0 }
    entry.pnl += trade.realizedPnL
    entry.trades += 1
    byDay.set(trade.date, entry)
  }

  const days = [...byDay.keys()].sort()
  const points: EquityPoint[] = []
  let equity = startingBalance
  let peak = startingBalance

  if (days.length > 0) {
    points.push({
      date: days[0]!,
      label: 'Start',
      equity: startingBalance,
      pnl: 0,
      drawdown: 0,
      trades: 0,
    })
  }

  for (const date of days) {
    const day = byDay.get(date)!
    equity += day.pnl
    peak = Math.max(peak, equity)
    points.push({
      date,
      label: formatDayShort(date),
      equity,
      pnl: day.pnl,
      drawdown: peak - equity,
      trades: day.trades,
    })
  }

  return points
}

export interface GroupPerformance {
  key: string
  totalTrades: number
  wins: number
  losses: number
  breakEven: number
  winRate: number
  netPnl: number
  avgR: number
  profitFactor: number
  expectancy: number
}

export function summarizeGroup(key: string, trades: Trade[]): GroupPerformance {
  const metrics = computeMetrics(trades)
  return {
    key,
    totalTrades: metrics.totalTrades,
    wins: metrics.wins,
    losses: metrics.losses,
    breakEven: metrics.breakEven,
    winRate: metrics.winRate,
    netPnl: metrics.netPnl,
    avgR: metrics.avgR,
    profitFactor: metrics.profitFactor,
    expectancy: metrics.expectancy,
  }
}

export function performanceBySession(trades: Trade[]) {
  return TRADE_SESSIONS.map((session) =>
    summarizeGroup(
      session,
      trades.filter((trade) => trade.session === session),
    ),
  )
}

export function performanceByInstrument(trades: Trade[]) {
  const groups = new Map<string, Trade[]>()
  for (const trade of trades) {
    const group = groups.get(trade.instrument) ?? []
    group.push(trade)
    groups.set(trade.instrument, group)
  }
  return [...groups.entries()]
    .map(([key, group]) => summarizeGroup(key, group))
    .sort((a, b) => b.netPnl - a.netPnl)
}

export function tagPerformance(
  trades: Trade[],
  field: 'setupTags' | 'mistakes',
) {
  const groups = new Map<string, Trade[]>()
  for (const trade of trades) {
    for (const tag of trade[field]) {
      const group = groups.get(tag) ?? []
      group.push(trade)
      groups.set(tag, group)
    }
  }
  return [...groups.entries()]
    .map(([key, group]) => summarizeGroup(key, group))
    .sort((a, b) => b.netPnl - a.netPnl)
}

export function performanceByWeekday(trades: Trade[]) {
  const groups: Trade[][] = Array.from({ length: 7 }, () => [])
  for (const trade of trades) {
    const day = parseDate(trade.date).getDay()
    const mondayFirst = (day + 6) % 7
    groups[mondayFirst]!.push(trade)
  }
  return groups.map((group, index) =>
    summarizeGroup(WEEKDAY_LABELS[index]!, group),
  )
}

export function planFollowedSplit(trades: Trade[]) {
  return {
    followed: summarizeGroup(
      'Followed plan',
      trades.filter((trade) => trade.followedPlan),
    ),
    broken: summarizeGroup(
      'Broke plan',
      trades.filter((trade) => !trade.followedPlan),
    ),
  }
}

export interface RDistributionBucket {
  label: string
  count: number
  pnl: number
}

export function rDistribution(trades: Trade[]): RDistributionBucket[] {
  const buckets: RDistributionBucket[] = [
    { label: '≤ -2R', count: 0, pnl: 0 },
    { label: '-2R', count: 0, pnl: 0 },
    { label: '-1R', count: 0, pnl: 0 },
    { label: 'BE', count: 0, pnl: 0 },
    { label: '+1R', count: 0, pnl: 0 },
    { label: '+2R', count: 0, pnl: 0 },
    { label: '+3R', count: 0, pnl: 0 },
    { label: '4R +', count: 0, pnl: 0 },
  ]

  for (const trade of trades) {
    const r = trade.rMultiple
    let index = 0
    if (r <= -2) index = 0
    else if (r <= -1) index = 1
    else if (r <= -0.2) index = 2
    else if (r < 0.2) index = 3
    else if (r < 1) index = 4
    else if (r < 2) index = 5
    else if (r < 3) index = 6
    else index = 7
    const bucket = buckets[index]!
    bucket.count += 1
    bucket.pnl += trade.realizedPnL
  }

  return buckets
}

export function disciplineDistribution(trades: Trade[]) {
  return [1, 2, 3, 4, 5].map((rating) => ({
    rating,
    count: trades.filter((trade) => trade.disciplineRating === rating).length,
  }))
}

export interface DayStats {
  date: string
  pnl: number
  trades: number
  wins: number
  losses: number
  be: number
  rTotal: number
}

export function dailyStats(trades: Trade[]) {
  const map = new Map<string, DayStats>()
  for (const trade of trades) {
    const day = map.get(trade.date) ?? {
      date: trade.date,
      pnl: 0,
      trades: 0,
      wins: 0,
      losses: 0,
      be: 0,
      rTotal: 0,
    }
    day.pnl += trade.realizedPnL
    day.trades += 1
    day.rTotal += trade.rMultiple
    if (trade.status === 'Win') day.wins += 1
    else if (trade.status === 'Loss') day.losses += 1
    else day.be += 1
    map.set(trade.date, day)
  }
  return map
}

export function tradesOnDay(trades: Trade[], date: string) {
  return sortTradesNewest(
    trades.filter((trade) => trade.date === date),
  )
}

export function monthGrid(month: Date, weekStartsOn: 0 | 1) {
  const start = startOfMonth(month)
  const end = endOfMonth(month)
  const gridStart = startOfWeek(start, { weekStartsOn })
  const gridEnd = endOfWeek(end, { weekStartsOn })
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd })
  const weeks: Date[][] = []
  for (let index = 0; index < days.length; index += 7) {
    weeks.push(days.slice(index, index + 7))
  }
  return weeks
}

export function isoDay(date: Date) {
  return format(date, 'yyyy-MM-dd')
}

export function filterByRange(trades: Trade[], preset: RangePreset) {
  const bounds = getRangeBounds(preset)
  return trades.filter((trade) => isInBounds(trade.date, bounds))
}

export function filterByBounds(trades: Trade[], bounds: DateBounds | null) {
  return trades.filter((trade) => isInBounds(trade.date, bounds))
}

export function bestAndWorstDays(trades: Trade[]) {
  const stats = [...dailyStats(trades).values()]
  if (stats.length === 0) return { best: null, worst: null }
  const sorted = [...stats].sort((a, b) => b.pnl - a.pnl)
  return { best: sorted[0]!, worst: sorted[sorted.length - 1]! }
}

export function monthlyTrades(trades: Trade[], monthDate: Date) {
  const prefix = format(monthDate, 'yyyy-MM')
  return trades.filter((trade) => trade.date.startsWith(prefix))
}
