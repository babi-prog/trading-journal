import { create } from 'zustand'
import type { TradeDirection, TradeSession, TradeStatus } from '@/types/trade'
import type { RangePreset } from '@/lib/utils'

export type TradeRange = 'all' | 'today' | '7d' | '30d' | '90d'

export interface TradeFilters {
  search: string
  session: 'all' | TradeSession
  instrument: 'all' | string
  status: 'all' | TradeStatus
  direction: 'all' | TradeDirection
  tag: 'all' | string
  range: TradeRange
}

export const DEFAULT_TRADE_FILTERS: TradeFilters = {
  search: '',
  session: 'all',
  instrument: 'all',
  status: 'all',
  direction: 'all',
  tag: 'all',
  range: 'all',
}

function initialSidebarState() {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem('tc:sidebar-collapsed') === '1'
  } catch {
    return false
  }
}

interface UIState {
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  mobileNavOpen: boolean
  setMobileNavOpen: (open: boolean) => void
  searchOpen: boolean
  setSearchOpen: (open: boolean) => void
  tradeFormOpen: boolean
  tradeFormTradeId: string | null
  tradeFormPrefillDate: string | null
  openTradeForm: (options?: { tradeId?: string; prefillDate?: string }) => void
  closeTradeForm: () => void
  detailTradeId: string | null
  openTradeDetail: (id: string) => void
  closeTradeDetail: () => void
  range: RangePreset
  setRange: (range: RangePreset) => void
  filters: TradeFilters
  setFilters: (patch: Partial<TradeFilters>) => void
  resetFilters: () => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: initialSidebarState(),
  toggleSidebar: () =>
    set((state) => {
      const next = !state.sidebarCollapsed
      try {
        window.localStorage.setItem('tc:sidebar-collapsed', next ? '1' : '0')
      } catch {
        // local storage can be unavailable in private browsing
      }
      return { sidebarCollapsed: next }
    }),

  mobileNavOpen: false,
  setMobileNavOpen: (open) => set({ mobileNavOpen: open }),

  searchOpen: false,
  setSearchOpen: (open) => set({ searchOpen: open }),

  tradeFormOpen: false,
  tradeFormTradeId: null,
  tradeFormPrefillDate: null,
  openTradeForm: (options) =>
    set({
      tradeFormOpen: true,
      tradeFormTradeId: options?.tradeId ?? null,
      tradeFormPrefillDate: options?.prefillDate ?? null,
    }),
  closeTradeForm: () =>
    set({
      tradeFormOpen: false,
      tradeFormTradeId: null,
      tradeFormPrefillDate: null,
    }),

  detailTradeId: null,
  openTradeDetail: (id) => set({ detailTradeId: id }),
  closeTradeDetail: () => set({ detailTradeId: null }),

  range: '30d',
  setRange: (range) => set({ range }),

  filters: { ...DEFAULT_TRADE_FILTERS },
  setFilters: (patch) =>
    set((state) => ({ filters: { ...state.filters, ...patch } })),
  resetFilters: () => set({ filters: { ...DEFAULT_TRADE_FILTERS } }),
}))
