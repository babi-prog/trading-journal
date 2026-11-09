import type { Trade, TradeStatus } from '@/types/trade'

export function statusFromR(r: number): TradeStatus {
  if (!Number.isFinite(r)) return 'BE'
  if (r > 0.05) return 'Win'
  if (r < -0.05) return 'Loss'
  return 'BE'
}

export function computeR(pnl: number, risk: number) {
  if (!Number.isFinite(pnl) || !Number.isFinite(risk) || risk <= 0) return 0
  return pnl / risk
}

export function sortTradesNewest(trades: Trade[]) {
  return [...trades].sort((a, b) =>
    `${b.date}T${b.entryTime}`.localeCompare(`${a.date}T${a.entryTime}`),
  )
}

export function sortTradesOldest(trades: Trade[]) {
  return [...trades].sort((a, b) =>
    `${a.date}T${a.entryTime}`.localeCompare(`${b.date}T${b.entryTime}`),
  )
}

export function directionSign(direction: Trade['direction']) {
  return direction === 'Long' ? 1 : -1
}

export function impliedRMultiple(trade: Pick<Trade, 'direction' | 'entryPrice' | 'stopLoss' | 'exitPrice'>) {
  const risk = Math.abs(trade.entryPrice - trade.stopLoss)
  if (!risk) return 0
  return ((trade.exitPrice - trade.entryPrice) * directionSign(trade.direction)) / risk
}
