import Dexie, { type Table } from 'dexie'
import type { JournalSettings, Trade } from '@/types/trade'
import { DEFAULT_SETTINGS } from '@/types/trade'
import { buildSeedTrades } from '@/lib/seed'

class JournalDatabase extends Dexie {
  trades!: Table<Trade, string>
  settings!: Table<JournalSettings, string>

  constructor() {
    super('traderscasa-journal')
    this.version(1).stores({
      trades:
        'id, date, instrument, session, status, direction, rMultiple, disciplineRating',
      settings: 'id',
    })
  }
}

export const db = new JournalDatabase()

export async function loadJournal() {
  const [trades, storedSettings] = await Promise.all([
    db.trades.toArray(),
    db.settings.get('app'),
  ])

  let settings = storedSettings

  if (!settings) {
    settings = { ...DEFAULT_SETTINGS }
    await db.settings.put(settings)
  }

  return {
    trades: trades.sort((a, b) =>
      `${b.date}${b.entryTime}`.localeCompare(`${a.date}${a.entryTime}`),
    ),
    settings,
  }
}

export async function saveTradeRecord(trade: Trade) {
  await db.trades.put(trade)
}

export async function deleteTradeRecord(id: string) {
  await db.trades.delete(id)
}

export async function saveSettingsRecord(settings: JournalSettings) {
  await db.settings.put(settings)
}

export async function replaceAllTrades(trades: Trade[]) {
  await db.transaction('rw', db.trades, async () => {
    await db.trades.clear()
    await db.trades.bulkPut(trades)
  })
}

export async function resetDatabase() {
  await db.transaction('rw', db.trades, db.settings, async () => {
    await db.trades.clear()
    await db.settings.clear()
  })
}

export async function seedDemoJournal() {
  const trades = buildSeedTrades()
  const settings = await db.settings.get('app')
  await db.transaction('rw', db.trades, db.settings, async () => {
    await db.trades.clear()
    await db.trades.bulkPut(trades)
    await db.settings.put({
      ...(settings ?? DEFAULT_SETTINGS),
      initialized: true,
    })
  })
  return trades
}

export async function storageEstimate() {
  if (typeof navigator === 'undefined' || !navigator.storage?.estimate) {
    return { usage: 0, quota: 0 }
  }
  const estimate = await navigator.storage.estimate()
  return { usage: estimate.usage ?? 0, quota: estimate.quota ?? 0 }
}
