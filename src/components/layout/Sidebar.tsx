import { useMemo, type ReactNode } from 'react'
import { format } from 'date-fns'
import {
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  ChartNoAxesCombined,
  ChevronRight,
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Settings,
  Table2,
  X,
} from 'lucide-react'
import { Link, NavLink } from 'react-router-dom'
import { LogoMark, Wordmark } from '@/components/brand/Logo'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Meter } from '@/components/ui/Meter'
import { Tooltip } from '@/components/ui/Tooltip'
import { computeMetrics } from '@/lib/analytics'
import { cn, formatSignedCurrency, formatPercent, initials } from '@/lib/utils'
import { useJournalStore } from '@/store/useJournalStore'
import { useUIStore } from '@/store/useUIStore'

interface NavItem {
  to: string
  label: string
  icon: ReactNode
  end?: boolean
  badge?: 'trades'
}

const SECTIONS: { label: string; items: NavItem[] }[] = [
  {
    label: 'Workspace',
    items: [
      {
        to: '/',
        label: 'Dashboard',
        icon: <LayoutDashboard className="h-4 w-4" />,
        end: true,
      },
      {
        to: '/trades',
        label: 'Trade log',
        icon: <Table2 className="h-4 w-4" />,
        badge: 'trades',
      },
      {
        to: '/calendar',
        label: 'Calendar',
        icon: <CalendarDays className="h-4 w-4" />,
      },
    ],
  },
  {
    label: 'Insights',
    items: [
      {
        to: '/analytics',
        label: 'Analytics',
        icon: <ChartNoAxesCombined className="h-4 w-4" />,
      },
      {
        to: '/playbook',
        label: 'Playbook',
        icon: <BookOpen className="h-4 w-4" />,
      },
    ],
  },
]

interface SidebarContentProps {
  collapsed: boolean
  mobile?: boolean
  onNavigate?: () => void
  onClose?: () => void
}

export function SidebarContent({
  collapsed,
  mobile = false,
  onNavigate,
  onClose,
}: SidebarContentProps) {
  const trades = useJournalStore((state) => state.trades)
  const settings = useJournalStore((state) => state.settings)
  const openTradeForm = useUIStore((state) => state.openTradeForm)

  const monthMetrics = useMemo(() => {
    const prefix = format(new Date(), 'yyyy-MM')
    return computeMetrics(
      trades.filter((trade) => trade.date.startsWith(prefix)),
      settings.startingBalance,
    )
  }, [trades, settings.startingBalance])

  const avatar = initials(settings.displayName) || 'TC'

  function startNewTrade() {
    onNavigate?.()
    openTradeForm()
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        className={cn(
          'flex h-16 shrink-0 items-center border-b border-line/70',
          collapsed ? 'justify-center px-3' : 'gap-2.5 px-4',
          mobile && 'justify-between',
        )}
      >
        <Link
          to="/"
          onClick={onNavigate}
          className="focus-ring flex items-center gap-2.5 rounded-lg"
          aria-label="TraderCasa home"
        >
          <LogoMark className={collapsed ? 'h-9 w-9' : 'h-8 w-8'} />
          {!collapsed ? <Wordmark /> : null}
        </Link>
        {mobile ? (
          <button
            type="button"
            onClick={onClose}
            className="focus-ring flex h-8 w-8 items-center justify-center rounded-lg text-faint transition hover:bg-white/5 hover:text-ink"
            aria-label="Close navigation"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
        {collapsed ? (
          <Tooltip content={`${settings.displayName} · ${settings.accountName}`} side="right">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl border border-line-strong bg-gradient-to-br from-brand/25 via-brand/5 to-info/15 text-[11px] font-semibold text-ink">
              {avatar}
            </div>
          </Tooltip>
        ) : (
          <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-line/80 bg-panel-raised/60 p-2.5">
            <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line-strong bg-gradient-to-br from-brand/25 via-brand/5 to-info/15 text-[10px] font-semibold text-ink">
              {avatar}
              <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border-2 border-panel-raised bg-positive" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-ink">
                {settings.displayName}
              </p>
              <p className="truncate text-[10px] text-faint">
                {settings.accountName}
              </p>
            </div>
            <Badge variant="brand" className="ml-auto shrink-0 px-1.5 py-0.5 text-[8px]">
              LIVE
            </Badge>
          </div>
        )}

        <nav className="space-y-5">
          {SECTIONS.map((section) => (
            <div key={section.label}>
              {collapsed ? (
                <div className="mx-2 mb-2 h-px bg-line/80" />
              ) : (
                <p className="mb-1.5 px-2 text-[9px] font-semibold uppercase tracking-[0.24em] text-faint/80">
                  {section.label}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const link = (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        cn(
                          'group relative flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-[12.5px] font-medium transition-colors',
                          collapsed && 'justify-center px-0',
                          isActive
                            ? 'bg-brand/10 text-brand'
                            : 'text-muted hover:bg-white/[0.04] hover:text-ink',
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {isActive ? (
                            <span className="absolute -left-3 h-4 w-0.5 rounded-r-full bg-brand" />
                          ) : null}
                          <span className="shrink-0">{item.icon}</span>
                          {!collapsed ? (
                            <>
                              <span className="truncate">{item.label}</span>
                              {item.badge === 'trades' && trades.length > 0 ? (
                                <span className="ml-auto rounded-md bg-white/[0.055] px-1.5 py-0.5 text-[9px] font-medium tabular-nums text-faint">
                                  {trades.length}
                                </span>
                              ) : null}
                            </>
                          ) : null}
                        </>
                      )}
                    </NavLink>
                  )
                  return collapsed ? (
                    <Tooltip key={item.to} content={item.label} side="right">
                      {link}
                    </Tooltip>
                  ) : (
                    link
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="mt-5">
          {collapsed ? (
            <Tooltip content="New trade · N" side="right">
              <Button
                variant="primary"
                size="icon"
                className="mx-auto flex w-10"
                onClick={startNewTrade}
                aria-label="Log a new trade"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </Tooltip>
          ) : (
            <Button
              variant="primary"
              className="w-full justify-between"
              onClick={startNewTrade}
            >
              <span className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                New trade
              </span>
              <span className="kbd border-brand-ink/20 bg-brand-ink/10 text-brand-ink/70">
                N
              </span>
            </Button>
          )}
        </div>
      </div>

      <div
        className={cn(
          'shrink-0 space-y-2 border-t border-line/70 p-3',
          collapsed && 'px-2',
        )}
      >
        {!collapsed ? (
          <div className="rounded-xl border border-line/80 bg-panel-raised/50 p-3">
            <div className="flex items-center justify-between">
              <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-faint">
                This month
              </p>
              <ArrowUpRight
                className={cn(
                  'h-3.5 w-3.5',
                  monthMetrics.netPnl > 0
                    ? 'text-positive'
                    : monthMetrics.netPnl < 0
                      ? 'text-negative'
                      : 'text-faint',
                )}
              />
            </div>
            <p
              className={cn(
                'num mt-1 font-display text-lg font-semibold tracking-tight',
                monthMetrics.netPnl > 0
                  ? 'text-positive'
                  : monthMetrics.netPnl < 0
                    ? 'text-negative'
                    : 'text-ink',
              )}
            >
              {trades.length
                ? formatSignedCurrency(monthMetrics.netPnl, settings.currency)
                : '—'}
            </p>
            <div className="mt-1 flex items-center justify-between text-[9.5px] text-faint">
              <span>{monthMetrics.totalTrades} trades</span>
              <span>
                {monthMetrics.totalTrades
                  ? `${formatPercent(monthMetrics.winRate)} win`
                  : 'No trades yet'}
              </span>
            </div>
            <Meter
              className="mt-2.5"
              height="xs"
              value={monthMetrics.winRate}
              color={monthMetrics.netPnl >= 0 ? 'positive' : 'negative'}
            />
          </div>
        ) : null}

        {collapsed ? (
          <Tooltip content="Settings" side="right">
            <NavLink
              to="/settings"
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  'mx-auto flex h-9 w-9 items-center justify-center rounded-lg transition',
                  isActive
                    ? 'bg-brand/10 text-brand'
                    : 'text-muted hover:bg-white/[0.05] hover:text-ink',
                )
              }
              aria-label="Settings"
            >
              <Settings className="h-4 w-4" />
            </NavLink>
          </Tooltip>
        ) : (
          <NavLink
            to="/settings"
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-[12.5px] font-medium transition',
                isActive
                  ? 'bg-brand/10 text-brand'
                  : 'text-muted hover:bg-white/[0.04] hover:text-ink',
              )
            }
          >
            <Settings className="h-4 w-4" />
            Settings
            <ChevronRight className="ml-auto h-3.5 w-3.5 text-faint" />
          </NavLink>
        )}

        {!collapsed ? (
          <div className="flex items-center justify-between px-2 pt-1 text-[9.5px] text-faint/80">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-positive" />
              Stored locally
            </span>
            <span>v1.0</span>
          </div>
        ) : (
          <Tooltip content="Your data is stored locally on this device" side="right">
            <div className="mx-auto flex h-8 w-8 items-center justify-center">
              <span className="h-1.5 w-1.5 rounded-full bg-positive" />
            </div>
          </Tooltip>
        )}
      </div>
    </div>
  )
}

export function Sidebar() {
  const collapsed = useUIStore((state) => state.sidebarCollapsed)
  const toggleSidebar = useUIStore((state) => state.toggleSidebar)

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-line/80 bg-canvas/70 backdrop-blur-xl transition-[width] duration-300 lg:flex',
        collapsed ? 'w-[84px]' : 'w-[264px]',
      )}
    >
      <SidebarContent collapsed={collapsed} />
      <button
        type="button"
        onClick={toggleSidebar}
        className="focus-ring absolute -right-3 top-[72px] flex h-6 w-6 items-center justify-center rounded-full border border-line-strong bg-panel-raised text-faint shadow-lg transition hover:border-brand/30 hover:text-ink"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? (
          <PanelLeftOpen className="h-3 w-3" />
        ) : (
          <PanelLeftClose className="h-3 w-3" />
        )}
      </button>
    </aside>
  )
}
