import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  ChartNoAxesCombined,
  LayoutDashboard,
  Plus,
  Search,
  Settings,
  Table2,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/Dialog'
import { formatDayShort, formatSignedCurrency, pnlTone, cn } from '@/lib/utils'
import { useJournalStore } from '@/store/useJournalStore'
import { useUIStore } from '@/store/useUIStore'

const PAGES = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/trades', label: 'Trade log', icon: Table2 },
  { path: '/calendar', label: 'Calendar', icon: CalendarDays },
  { path: '/analytics', label: 'Analytics', icon: ChartNoAxesCombined },
  { path: '/playbook', label: 'Playbook', icon: BookOpen },
  { path: '/settings', label: 'Settings', icon: Settings },
]

interface CommandItem {
  id: string
  label: string
  hint?: string
  group: string
  icon: ReactNode
  tone?: 'positive' | 'negative' | 'neutral'
  onSelect: () => void
}

export function CommandPalette() {
  const open = useUIStore((state) => state.searchOpen)
  const setOpen = useUIStore((state) => state.setSearchOpen)
  const openTradeForm = useUIStore((state) => state.openTradeForm)
  const openTradeDetail = useUIStore((state) => state.openTradeDetail)
  const trades = useJournalStore((state) => state.trades)
  const settings = useJournalStore((state) => state.settings)
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)

  useEffect(() => {
    if (open) {
      setQuery('')
      setActive(0)
    }
  }, [open])

  useEffect(() => {
    setActive(0)
  }, [query])

  const items = useMemo<CommandItem[]>(() => {
    const normalized = query.trim().toLowerCase()

    const actions: CommandItem[] = [
      {
        id: 'action:new-trade',
        label: 'Log a new trade',
        hint: 'N',
        group: 'Quick actions',
        icon: <Plus className="h-3.5 w-3.5" />,
        onSelect: () => {
          setOpen(false)
          window.setTimeout(() => openTradeForm(), 140)
        },
      },
    ]

    const pages = PAGES.filter(
      (page) =>
        !normalized || page.label.toLowerCase().includes(normalized),
    ).map<CommandItem>((page) => ({
      id: `page:${page.path}`,
      label: page.label,
      hint: 'Page',
      group: 'Go to',
      icon: <page.icon className="h-3.5 w-3.5" />,
      onSelect: () => {
        setOpen(false)
        navigate(page.path)
      },
    }))

    const matchingTrades = trades
      .filter((trade) => {
        if (!normalized) return true
        const haystack =
          `${trade.instrument} ${trade.session} ${trade.direction} ${trade.status} ${trade.date} ${trade.setupTags.join(' ')} ${trade.notes}`.toLowerCase()
        return haystack.includes(normalized)
      })
      .slice(0, normalized ? 6 : 4)
      .map<CommandItem>((trade) => ({
        id: `trade:${trade.id}`,
        label: `${trade.instrument} · ${trade.direction} · ${formatDayShort(trade.date)}`,
        hint: formatSignedCurrency(trade.realizedPnL, settings.currency),
        group: 'Trades',
        tone: pnlTone(trade.realizedPnL),
        icon: (
          <span
            className={cn(
              'block h-1.5 w-1.5 rounded-full',
              trade.status === 'Win'
                ? 'bg-positive'
                : trade.status === 'Loss'
                  ? 'bg-negative'
                  : 'bg-faint',
            )}
          />
        ),
        onSelect: () => {
          setOpen(false)
          window.setTimeout(() => openTradeDetail(trade.id), 140)
        },
      }))

    return [...actions, ...pages, ...matchingTrades]
  }, [
    query,
    trades,
    settings.currency,
    setOpen,
    openTradeForm,
    openTradeDetail,
    navigate,
  ])

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActive((index) => (index + 1) % Math.max(items.length, 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive(
        (index) => (index - 1 + Math.max(items.length, 1)) % Math.max(items.length, 1),
      )
    } else if (event.key === 'Enter') {
      event.preventDefault()
      items[active]?.onSelect()
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        size="md"
        showClose={false}
        className="max-w-[600px] p-0"
        overlayClassName="bg-black/60"
      >
        <DialogTitle className="sr-only">Search TraderCasa</DialogTitle>
        <DialogDescription className="sr-only">
          Search trades, setups and pages. Use arrow keys and Enter to navigate.
        </DialogDescription>

        <div className="flex items-center gap-2.5 border-b border-line px-4">
          <Search className="h-4 w-4 shrink-0 text-faint" />
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search trades, instruments, setups, pages…"
            className="h-14 w-full bg-transparent text-sm text-ink outline-none placeholder:text-faint"
          />
          <span className="kbd shrink-0">ESC</span>
        </div>

        <div className="max-h-[min(430px,60vh)] overflow-y-auto p-2">
          {items.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <p className="text-sm font-medium text-ink">No results found</p>
              <p className="mt-1 text-xs text-muted">
                Try an instrument like NQ, a setup like FVG, or a page name.
              </p>
            </div>
          ) : (
            items.map((item, index) => {
              const showGroup = index === 0 || items[index - 1]!.group !== item.group
              return (
                <div key={item.id}>
                  {showGroup ? (
                    <p className="px-2.5 pb-1.5 pt-3 text-[9.5px] font-semibold uppercase tracking-[0.2em] text-faint first:pt-1.5">
                      {item.group}
                    </p>
                  ) : null}
                  <button
                    type="button"
                    onMouseEnter={() => setActive(index)}
                    onClick={item.onSelect}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left text-[12.5px] transition',
                      active === index
                        ? 'bg-white/[0.06] text-ink'
                        : 'text-muted hover:bg-white/[0.035]',
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-line bg-inset',
                        active === index ? 'text-brand' : 'text-faint',
                      )}
                    >
                      {item.icon}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                    {item.hint ? (
                      <span
                        className={cn(
                          'shrink-0 text-[10px]',
                          item.tone === 'positive'
                            ? 'text-positive'
                            : item.tone === 'negative'
                              ? 'text-negative'
                              : 'text-faint',
                        )}
                      >
                        {item.hint}
                      </span>
                    ) : null}
                    <ArrowRight
                      className={cn(
                        'h-3 w-3 shrink-0 transition',
                        active === index ? 'text-faint' : 'text-transparent',
                      )}
                    />
                  </button>
                </div>
              )
            })
          )}
        </div>

        <div className="flex items-center justify-between border-t border-line bg-white/[0.012] px-4 py-2.5 text-[10px] text-faint">
          <span className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="kbd">↑</span>
              <span className="kbd">↓</span>
              navigate
            </span>
            <span className="flex items-center gap-1">
              <span className="kbd">↵</span>
              open
            </span>
          </span>
          <span className="flex items-center gap-1">
            <span className="kbd">⌘</span>
            <span className="kbd">K</span>
            anywhere
          </span>
        </div>
      </DialogContent>
    </Dialog>
  )
}
