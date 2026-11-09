import type {
  Trade,
  TradeDirection,
  TradeSession,
  TradeStatus,
} from '@/types/trade'
import { INSTRUMENT_MAP, SETUP_SUGGESTIONS } from '@/lib/constants'
import { makeTradeSnapshot, snapshotSeed } from '@/lib/snapshot'
import { statusFromR } from '@/lib/trade'
import { clamp, roundTo, uid } from '@/lib/utils'

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

type Random = () => number

function randomBetween(rand: Random, min: number, max: number) {
  return min + rand() * (max - min)
}

function randomInt(rand: Random, min: number, max: number) {
  return Math.floor(randomBetween(rand, min, max + 1))
}

function chance(rand: Random, probability: number) {
  return rand() < probability
}

function pick<T>(rand: Random, values: readonly T[]): T {
  return values[Math.floor(rand() * values.length)] as T
}

interface Weighted<T> {
  value: T
  weight: number
}

function weightedPick<T>(rand: Random, items: readonly Weighted<T>[]): T {
  const total = items.reduce((sum, item) => sum + item.weight, 0)
  let roll = rand() * total
  for (const item of items) {
    roll -= item.weight
    if (roll <= 0) return item.value
  }
  return items[items.length - 1]!.value
}

function pickMany<T>(rand: Random, values: readonly T[], count: number) {
  const copy = [...values]
  const picked: T[] = []
  for (let index = 0; index < count && copy.length > 0; index += 1) {
    const position = Math.floor(rand() * copy.length)
    picked.push(copy[position] as T)
    copy.splice(position, 1)
  }
  return picked
}

function localISO(date: Date) {
  const offset = date.getTimezoneOffset()
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 10)
}

function minutesToTime(totalMinutes: number) {
  const minutes = ((totalMinutes % 1440) + 1440) % 1440
  const hours = Math.floor(minutes / 60)
  const rest = Math.round(minutes % 60)
  return `${String(hours).padStart(2, '0')}:${String(rest).padStart(2, '0')}`
}

const SESSION_WINDOWS: Record<TradeSession, [number, number]> = {
  Asia: [18, 330],
  London: [420, 675],
  'NY AM': [570, 705],
  'NY PM': [810, 1005],
}

const SESSION_WEIGHTS: Weighted<TradeSession>[] = [
  { value: 'NY AM', weight: 36 },
  { value: 'London', weight: 27 },
  { value: 'NY PM', weight: 21 },
  { value: 'Asia', weight: 16 },
]

const INSTRUMENT_WEIGHTS: Weighted<string>[] = [
  { value: 'NQ', weight: 30 },
  { value: 'ES', weight: 18 },
  { value: 'USTEC', weight: 14 },
  { value: 'EURUSD', weight: 14 },
  { value: 'XAUUSD', weight: 11 },
  { value: 'BTCUSD', weight: 6 },
  { value: 'GBPUSD', weight: 5 },
  { value: 'CL', weight: 2 },
]

const SETUP_QUALITY: Record<string, number> = {
  '4H Wick': 0.24,
  '5m MSS': 0.18,
  FVG: 0.14,
  'PDH Sweep': 0.17,
  'Order Block': 0.06,
  'Liquidity Grab': 0.02,
  'Trend Continuation': -0.03,
  'Range Reversal': -0.09,
}

const PRIMARY_SETUPS: Weighted<string>[] = [
  { value: '4H Wick', weight: 17 },
  { value: '5m MSS', weight: 17 },
  { value: 'FVG', weight: 17 },
  { value: 'PDH Sweep', weight: 14 },
  { value: 'Order Block', weight: 13 },
  { value: 'Liquidity Grab', weight: 10 },
  { value: 'Trend Continuation', weight: 7 },
  { value: 'Range Reversal', weight: 5 },
]

const WIN_MISTAKES = ['Early Exit', 'Moved Stop', 'Chased Entry', 'Over-traded']
const LOSS_MISTAKES = [
  'Chased Entry',
  'Moved Stop',
  'FOMO',
  'Oversized',
  'Revenge Trade',
  'Late Entry',
  'No Plan',
  'Ignored News',
  'Early Exit',
]

const WIN_NOTES = [
  'Clean A+ setup. Waited for the sweep, took the MSS confirmation and entered on the retest. Scaled at 2R and left a runner.',
  'Patience paid off. Price tapped the 4H wick, displaced through the level and gave a clean FVG entry. Executed the plan exactly.',
  'Textbook continuation. Higher-timeframe bias was clear, waited for the pullback into the order block and let the position breathe.',
  'No hesitation on this one. Entry came from the plan, stop was protected and I trailed behind the 5m structure.',
  'Best execution of the week. Sized correctly, accepted the risk before entry and did not touch the position until target.',
  'Loved the confluence here — PDH swept, 5m MSS, and the FVG was sitting right at the level. Held to the full target.',
  'Took the retest instead of chasing the breakout. That single decision added almost a full R.',
  'Managed this one well. Took partials into the prior high, moved to BE only after structure confirmed.',
]

const LOSS_NOTES = [
  'Entry was early. I anticipated the sweep instead of waiting for the displacement and got stopped on the second push.',
  'The idea was valid but the entry was chased. I paid for a worse price and the stop was too tight for the volatility.',
  'Broke my own rule here — moved the stop when price came back into the level. It would have worked if I had left it alone.',
  'Traded during a news window without checking the calendar. Spread widened and I got taken out before the real move.',
  'Size was too large for the setup grade. Even a normal pullback felt uncomfortable and I cut it before the plan played out.',
  'No clear setup. I forced a trade because the first hour was quiet. That is exactly the behaviour I am trying to remove.',
  'The thesis was fine but I exited early and then re-entered late. Two decisions, one loss, and a lesson about patience.',
  'Took this after a loss to get it back. Revenge trade, plain and simple. Risk was outside the plan and the result followed.',
]

const BE_NOTES = [
  'Managed to BE after price stalled at the mid-range. Nothing wrong with a scratch when the context changes.',
  'Entry was decent but momentum died. I cut it at breakeven instead of hoping for a runner.',
  'News came out mid-trade and I protected capital. No edge left, so no reason to stay in.',
]

function generateR(rand: Random, isWin: boolean, quality: number) {
  if (isWin) {
    const roll = rand()
    let base: number
    if (roll < 0.55) base = randomBetween(rand, 0.5, 1.35)
    else if (roll < 0.82) base = randomBetween(rand, 1.35, 2.25)
    else if (roll < 0.95) base = randomBetween(rand, 2.25, 3.2)
    else base = randomBetween(rand, 3.2, 4.3)
    return Math.max(0.1, roundTo(base + quality * 0.5, 2))
  }

  const roll = rand()
  let magnitude: number
  if (roll < 0.62) magnitude = randomBetween(rand, 0.45, 1.05)
  else if (roll < 0.88) magnitude = randomBetween(rand, 1.05, 1.65)
  else magnitude = randomBetween(rand, 1.65, 2.3)
  return -Math.max(0.1, roundTo(magnitude - quality * 0.35, 2))
}

export function buildSeedTrades(seed = 0x7c4a5b): Trade[] {
  const rand = mulberry32(seed)
  const trades: Trade[] = []
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  for (let daysAgo = 113; daysAgo >= 0; daysAgo -= 1) {
    const date = new Date(today.getTime() - daysAgo * 86_400_000)
    const weekday = date.getDay()
    if (weekday === 0 || weekday === 6) continue
    if (!chance(rand, 0.71)) continue

    const countRoll = rand()
    const tradeCount = countRoll < 0.54 ? 1 : countRoll < 0.86 ? 2 : 3

    for (let index = 0; index < tradeCount; index += 1) {
      const session = weightedPick(rand, SESSION_WEIGHTS)
      const [windowStart, windowEnd] = SESSION_WINDOWS[session]
      const entryMinutes = randomInt(rand, windowStart, windowEnd)
      const hold = randomInt(rand, 8, session === 'Asia' ? 110 : 165)
      const exitMinutes = entryMinutes + hold

      const instrument = weightedPick(rand, INSTRUMENT_WEIGHTS)
      const config = INSTRUMENT_MAP.get(instrument)
      if (!config) continue

      const direction: TradeDirection = chance(rand, 0.57) ? 'Long' : 'Short'
      const sign = direction === 'Long' ? 1 : -1
      const primarySetup = weightedPick(rand, PRIMARY_SETUPS)
      const quality = SETUP_QUALITY[primarySetup] ?? 0

      const beRoll = rand()
      const isBreakEven = beRoll < 0.035
      const isWin = !isBreakEven && chance(rand, clamp(0.485 + quality, 0.34, 0.64))
      const rMultiple = isBreakEven
        ? roundTo(randomBetween(rand, -0.06, 0.06), 2)
        : generateR(rand, isWin, quality)
      const status: TradeStatus = statusFromR(rMultiple)

      const entryPrice = roundTo(
        config.basePrice * (1 + randomBetween(rand, -0.028, 0.028)),
        config.priceStep,
      )
      const stopDistance = Math.max(
        config.priceStep,
        roundTo(
          randomBetween(rand, config.stopRange[0], config.stopRange[1]),
          config.priceStep,
        ),
      )
      const targetRisk = randomBetween(rand, 170, 760)
      const rawLot = targetRisk / (stopDistance * config.pointValue)
      const lotCap =
        config.category === 'Forex'
          ? 1.5
          : config.category === 'Metals'
            ? 1
            : config.category === 'Crypto'
              ? 0.2
              : 12
      const lot = Math.max(
        config.lotMin,
        Math.min(lotCap, roundTo(Math.max(rawLot, config.lotMin), config.lotStep)),
      )
      const riskAmount = roundTo(stopDistance * config.pointValue * lot, 2)
      const stopLoss = roundTo(entryPrice - sign * stopDistance, config.priceStep)
      const rr = pick(rand, [1.5, 2, 2, 2.5, 3])
      const takeProfit = roundTo(
        entryPrice + sign * stopDistance * rr,
        config.priceStep,
      )
      const exitPrice = roundTo(
        entryPrice + sign * stopDistance * rMultiple,
        config.priceStep,
      )
      const realizedPnL = roundTo(riskAmount * rMultiple, 2)

      const secondaryCount = chance(rand, 0.32) ? 1 : 0
      const secondary = pickMany(
        rand,
        SETUP_SUGGESTIONS.filter((tag) => tag !== primarySetup),
        secondaryCount,
      )
      const setupTags = [primarySetup, ...secondary]

      const mistakePool = isWin ? WIN_MISTAKES : LOSS_MISTAKES
      const mistakeCount = isBreakEven
        ? 0
        : isWin
          ? chance(rand, 0.45)
            ? 1
            : 0
          : chance(rand, 0.72)
            ? chance(rand, 0.62)
              ? 1
              : 2
            : 0
      const mistakes = pickMany(rand, mistakePool, mistakeCount)
      const followedPlan =
        mistakes.length === 0
          ? chance(rand, 0.92)
          : mistakes.length === 1
            ? chance(rand, 0.55)
            : chance(rand, 0.16)
      const disciplineRating = clamp(
        Math.round(
          4.9 -
            mistakes.length * 0.9 -
            (followedPlan ? 0 : 1.15) +
            randomBetween(rand, -0.6, 0.4),
        ),
        1,
        5,
      )

      const notes =
        status === 'Win'
          ? pick(rand, WIN_NOTES)
          : status === 'Loss'
            ? pick(rand, LOSS_NOTES)
            : pick(rand, BE_NOTES)

      const id = uid()
      const preTradeImage = chance(rand, 0.34)
        ? makeTradeSnapshot({
            seed: snapshotSeed(id, 'pre'),
            instrument,
            session,
            direction,
            phase: 'pre',
            entry: entryPrice,
            stop: stopLoss,
            target: takeProfit,
            date: localISO(date),
          })
        : undefined
      const postTradeImage = chance(rand, 0.27)
        ? makeTradeSnapshot({
            seed: snapshotSeed(id, 'post'),
            instrument,
            session,
            direction,
            phase: 'post',
            entry: entryPrice,
            stop: stopLoss,
            target: takeProfit,
            exit: exitPrice,
            outcome: status,
            date: localISO(date),
          })
        : undefined

      trades.push({
        id,
        date: localISO(date),
        entryTime: minutesToTime(entryMinutes),
        exitTime: minutesToTime(exitMinutes),
        session,
        instrument,
        direction,
        entryPrice,
        stopLoss,
        takeProfit,
        exitPrice,
        lotSize: lot,
        riskAmount,
        realizedPnL,
        rMultiple,
        status,
        setupTags,
        mistakes,
        disciplineRating,
        followedPlan,
        preTradeImage,
        postTradeImage,
        notes,
      })
    }
  }

  return trades
}
