import { create } from 'zustand'
import type { JournalSettings, Trade } from '@/types/trade'
import { DEFAULT_SETTINGS } from '@/types/trade'
import {
  db,
  deleteTradeRecord,
  loadJournal,
  replaceAllTrades,
  resetDatabase,
  saveSettingsRecord,
  saveTradeRecord,
  seedDemoJournal,
} from '@/lib/db'
import { sortTradesNewest } from '@/lib/trade'

interface JournalState {
  trades: Trade[]
  settings: JournalSettings
  hydrated: boolean
  hydrating: boolean
  error: string | null
  hydrate: () => Promise<void>
  addTrade: (trade: Trade) => Promise<void>
  updateTrade: (trade: Trade) => Promise<void>
  deleteTrade: (id: string) => Promise<void>
  importTrades: (incoming: Trade[], mode: 'merge' | 'replace') => Promise<number>
  updateSettings: (patch: Partial<JournalSettings>) => Promise<void>
  loadDemo: () => Promise<number>
  clearAll: () => Promise<void>
}

export const useJournalStore = create<JournalState>((set, get) => ({
  trades: [],
  settings: { ...DEFAULT_SETTINGS },
  hydrated: false,
  hydrating: false,
  error: null,

  hydrate: async () => {
    if (get().hydrated || get().hydrating) return
    set({ hydrating: true })
    try {
      const { trades, settings } = await loadJournal()
      set({
        trades: sortTradesNewest(trades),
        settings,
        hydrated: true,
        hydrating: false,
        error: null,
      })
    } catch (error) {
      set({
        hydrated: true,
        hydrating: false,
        error:
          error instanceof Error
            ? error.message
            : 'Could not load your journal from this device.',
      })
    }
  },

  addTrade: async (trade) => {
    await saveTradeRecord(trade)
    set((state) => ({
      trades: sortTradesNewest([
        trade,
        ...state.trades.filter((item) => item.id !== trade.id),
      ]),
    }))
  },

  updateTrade: async (trade) => {
    await saveTradeRecord(trade)
    set((state) => ({
      trades: sortTradesNewest(
        state.trades.map((item) => (item.id === trade.id ? trade : item)),
      ),
    }))
  },

  deleteTrade: async (id) => {
    await deleteTradeRecord(id)
    set((state) => ({
      trades: state.trades.filter((trade) => trade.id !== id),
    }))
  },

  importTrades: async (incoming, mode) => {
    if (mode === 'replace') {
      await replaceAllTrades(incoming)
    } else {
      await db.trades.bulkPut(incoming)
    }
    const all = await db.trades.toArray()
    set({ trades: sortTradesNewest(all) })
    return incoming.length
  },

  updateSettings: async (patch) => {
    const next = { ...get().settings, ...patch }
    set({ settings: next })
    await saveSettingsRecord(next)
  },

  loadDemo: async () => {
    const trades = await seedDemoJournal()
    set((state) => ({
      trades: sortTradesNewest(trades),
      settings: { ...state.settings, initialized: true },
    }))
    return trades.length
  },

  clearAll: async () => {
    await resetDatabase()
    const settings: JournalSettings = {
      ...DEFAULT_SETTINGS,
      initialized: true,
      createdAt: get().settings.createdAt,
    }
    await saveSettingsRecord(settings)
    set({ trades: [], settings })
  },
}))
