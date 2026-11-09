import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { MobileSidebar } from '@/components/layout/MobileSidebar'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import { CommandPalette } from '@/components/layout/CommandPalette'
import { TradeFormDialog } from '@/components/trades/TradeFormDialog'
import { TradeDetailDrawer } from '@/components/trades/TradeDetailDrawer'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/store/useUIStore'

export function AppShell() {
  const collapsed = useUIStore((state) => state.sidebarCollapsed)
  const location = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const state = useUIStore.getState()
      const target = event.target as HTMLElement | null
      const isTyping =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.tagName === 'SELECT' ||
        Boolean(target?.isContentEditable)

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        if (state.tradeFormOpen) return
        event.preventDefault()
        state.setSearchOpen(!state.searchOpen)
        return
      }

      const hasDialog =
        state.tradeFormOpen ||
        state.searchOpen ||
        state.mobileNavOpen ||
        Boolean(state.detailTradeId)

      if (!isTyping && !hasDialog && !event.metaKey && !event.ctrlKey && !event.altKey) {
        if (event.key.toLowerCase() === 'n') {
          event.preventDefault()
          state.openTradeForm()
        } else if (event.key === '/' || event.key === '?') {
          event.preventDefault()
          state.setSearchOpen(true)
        }
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <div className="min-h-svh">
      <Sidebar />
      <MobileSidebar />
      <div
        className={cn(
          'flex min-h-svh flex-col transition-[padding] duration-300',
          collapsed ? 'lg:pl-[84px]' : 'lg:pl-[264px]',
        )}
      >
        <Topbar />
        <main className="flex-1 px-4 pb-16 pt-5 sm:px-6 sm:pt-6 lg:px-8">
          <div
            key={location.pathname}
            className="animate-fade-up mx-auto w-full max-w-[1500px]"
          >
            <Outlet />
          </div>
        </main>
        <footer className="px-4 pb-6 sm:px-6 lg:px-8">
          <div className="mx-auto flex w-full max-w-[1500px] flex-col items-center justify-between gap-2 border-t border-line/60 pt-4 text-[10px] text-faint sm:flex-row">
            <span>TraderCasa Journal · Built for deliberate traders</span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-positive" />
              All data stored locally on this device
            </span>
          </div>
        </footer>
      </div>

      <TradeFormDialog />
      <TradeDetailDrawer />
      <CommandPalette />
    </div>
  )
}
