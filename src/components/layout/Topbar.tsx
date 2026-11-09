import { useMemo } from 'react'
import {
  ChevronDown,
  ChevronRight,
  Command,
  Database,
  Download,
  Flame,
  Menu,
  Plus,
  Search,
  Settings,
} from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { LogoMark, Wordmark } from '@/components/brand/Logo'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu'
import { Tooltip } from '@/components/ui/Tooltip'
import { computeMetrics } from '@/lib/analytics'
import { downloadJournalBackup } from '@/lib/backup'
import { cn, initials } from '@/lib/utils'
import { useJournalStore } from '@/store/useJournalStore'
import { useUIStore } from '@/store/useUIStore'

const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/trades': 'Trade log',
  '/calendar': 'Calendar',
  '/analytics': 'Analytics',
  '/playbook': 'Playbook',
  '/settings': 'Settings',
}

export function Topbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const settings = useJournalStore((state) => state.settings)
  const trades = useJournalStore((state) => state.trades)
  const setMobileNavOpen = useUIStore((state) => state.setMobileNavOpen)
  const setSearchOpen = useUIStore((state) => state.setSearchOpen)
  const openTradeForm = useUIStore((state) => state.openTradeForm)

  const title = PAGE_TITLES[location.pathname] ?? 'Dashboard'
  const avatar = initials(settings.displayName) || 'TC'

  const streak = useMemo(() => {
    const metrics = computeMetrics(trades)
    if (
      metrics.currentStreak &&
      metrics.currentStreak.status === 'Win' &&
      metrics.currentStreak.count >= 2
    ) {
      return metrics.currentStreak.count
    }
    return 0
  }, [trades])

  function exportBackup() {
    downloadJournalBackup(settings, trades)
    toast.success('Backup exported', {
      description: `${trades.length} trades saved to a JSON file.`,
    })
  }

  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-canvas/80 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-2 px-4 sm:gap-3 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => setMobileNavOpen(true)}
          className="focus-ring flex h-9 w-9 items-center justify-center rounded-[10px] border border-line bg-white/[0.025] text-muted transition hover:text-ink lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="h-4 w-4" />
        </button>

        <div className="hidden items-center gap-2 text-xs lg:flex">
          <span className="text-faint">Workspace</span>
          <ChevronRight className="h-3 w-3 text-faint/60" />
          <span className="font-medium text-ink">{title}</span>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <LogoMark className="h-7 w-7" />
          <Wordmark className="hidden sm:flex" />
        </div>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          {streak > 0 ? (
            <Badge
              variant="brand"
              dot
              className="hidden h-8 gap-1.5 px-2.5 md:inline-flex"
            >
              <Flame className="h-3 w-3" />
              {streak}W streak
            </Badge>
          ) : null}

          <Tooltip content="Local-first · data stays on this device" side="bottom">
            <div className="hidden h-8 items-center gap-1.5 rounded-lg border border-line bg-white/[0.025] px-2.5 text-[10px] font-medium text-faint xl:flex">
              <Database className="h-3 w-3" />
              Local
            </div>
          </Tooltip>

          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className={cn(
              'focus-ring flex h-9 items-center gap-2 rounded-[10px] border border-line bg-white/[0.025] px-3 text-left text-xs text-faint transition hover:border-line-strong hover:text-muted',
              'w-9 justify-center sm:w-[230px] sm:justify-start xl:w-[280px]',
            )}
            aria-label="Search journal"
          >
            <Search className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden truncate sm:inline">
              Search trades, setups…
            </span>
            <span className="kbd ml-auto hidden sm:inline-flex">
              <Command className="h-2.5 w-2.5" />K
            </span>
          </button>

          <Button
            variant="primary"
            onClick={() => openTradeForm()}
            className="px-3 sm:px-4"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Log trade</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="focus-ring ml-0.5 flex items-center gap-1.5 rounded-full border border-line bg-white/[0.025] p-0.5 pr-1 transition hover:border-line-strong"
                aria-label="Account menu"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand/30 via-brand/10 to-info/20 text-[10px] font-semibold text-ink">
                  {avatar}
                </span>
                <ChevronDown className="hidden h-3 w-3 text-faint sm:block" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuLabel>Signed in as</DropdownMenuLabel>
              <div className="px-2.5 pb-2">
                <p className="text-xs font-medium text-ink">
                  {settings.displayName}
                </p>
                <p className="mt-0.5 text-[10px] text-faint">
                  {settings.accountName}
                </p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                icon={<Settings className="h-3.5 w-3.5" />}
                onSelect={() => navigate('/settings')}
              >
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem
                icon={<Download className="h-3.5 w-3.5" />}
                onSelect={exportBackup}
              >
                Export backup
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <div className="flex items-center justify-between px-2.5 py-1.5 text-[10px] text-faint">
                <span className="flex items-center gap-1.5">
                  <Database className="h-3 w-3" />
                  IndexedDB
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-positive" />
                  Healthy
                </span>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
