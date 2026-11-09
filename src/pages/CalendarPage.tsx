import { useMemo, useState } from 'react'
import {
  addMonths,
  format,
  isSameMonth,
  isToday as isTodayDate,
  subMonths,
} from 'date-fns'
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  Target,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Meter } from '@/components/ui/Meter'
import {
  computeMetrics,
  dailyStats,
  isoDay,
  monthGrid,
  monthlyTrades,
  tradesOnDay,
} from '@/lib/analytics'
import { WEEKDAY_LABELS } from '@/lib/constants'
import {
  cn,
  formatPercent,
  formatR,
  formatSignedCurrency,
  pnlTone,
  todayISO,
  toneText,
  to12Hour,
} from '@/lib/utils'
import { useJournalStore } from '@/store/useJournalStore'
import { useUIStore } from '@/store/useUIStore'

export function CalendarPage() {
  const trades = useJournalStore((state) => state.trades)
  const settings = useJournalStore((state) => state.settings)
  const openTradeForm = useUIStore((state) => state.openTradeForm)
  const openTradeDetail = useUIStore((state) => state.openTradeDetail)

  const [month, setMonth] = useState(() => new Date())
  const [selected, setSelected] = useState<string>(() => todayISO())

  const weekStartsOn = settings.weekStartsOn === 'sunday' ? 0 : 1
  const weeks = useMemo(
    () => monthGrid(month, weekStartsOn),
    [month, weekStartsOn],
  )
  const stats = useMemo(() => dailyStats(trades), [trades])
  const monthTrades = useMemo(() => monthlyTrades(trades, month), [trades, month])
  const monthMetrics = useMemo(
    () => computeMetrics(monthTrades, settings.startingBalance),
    [monthTrades, settings.startingBalance],
  )
  const dayTrades = useMemo(() => tradesOnDay(trades, selected), [trades, selected])

  const labels =
    weekStartsOn === 1
      ? WEEKDAY_LABELS
      : [WEEKDAY_LABELS[6]!, ...WEEKDAY_LABELS.slice(0, 6)]

  const monthPnl = monthMetrics.netPnl
  const bestDay = useMemo(() => {
    const entries = [...stats.values()].filter((entry) =>
      entry.date.startsWith(format(month, 'yyyy-MM')),
    )
    if (entries.length === 0) return null
    return entries.sort((a, b) => b.pnl - a.pnl)[0]!
  }, [stats, month])

  const tradedDays = useMemo(
    () =>
      [...stats.values()].filter((entry) =>
        entry.date.startsWith(format(month, 'yyyy-MM')),
      ).length,
    [stats, month],
  )

  function goToMonth(next: Date) {
    setMonth(next)
    const prefix = format(next, 'yyyy-MM')
    if (!selected.startsWith(prefix)) {
      setSelected(`${prefix}-01`)
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Calendar"
        title="See the month at a glance."
        description="Daily P&L heat map, trade counts and consistency — one cell at a time."
        actions={
          <>
            <div className="inline-flex items-center gap-1 rounded-[10px] border border-line bg-inset p-1">
              <Button
                size="icon-sm"
                variant="ghost"
                onClick={() => goToMonth(subMonths(month, 1))}
                aria-label="Previous month"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  const now = new Date()
                  setMonth(now)
                  setSelected(todayISO())
                }}
              >
                Today
              </Button>
              <Button
                size="icon-sm"
                variant="ghost"
                onClick={() => goToMonth(addMonths(month, 1))}
                aria-label="Next month"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Button
              variant="primary"
              icon={<Plus className="h-4 w-4" />}
              onClick={() => openTradeForm({ prefillDate: selected })}
            >
              Log trade
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <div className="card-surface px-3.5 py-3">
          <p className="text-[9.5px] uppercase tracking-[0.14em] text-faint">Month P&L</p>
          <p className={cn('num mt-1.5 font-display text-[17px] font-semibold', toneText(pnlTone(monthPnl)))}>
            {formatSignedCurrency(monthPnl, settings.currency)}
          </p>
        </div>
        <div className="card-surface px-3.5 py-3">
          <p className="text-[9.5px] uppercase tracking-[0.14em] text-faint">Trades</p>
          <p className="num mt-1.5 font-display text-[17px] font-semibold text-ink">
            {monthMetrics.totalTrades}
          </p>
        </div>
        <div className="card-surface px-3.5 py-3">
          <p className="text-[9.5px] uppercase tracking-[0.14em] text-faint">Win rate</p>
          <p className="num mt-1.5 font-display text-[17px] font-semibold text-ink">
            {formatPercent(monthMetrics.winRate, 1)}
          </p>
        </div>
        <div className="card-surface px-3.5 py-3">
          <p className="text-[9.5px] uppercase tracking-[0.14em] text-faint">Active days</p>
          <p className="num mt-1.5 font-display text-[17px] font-semibold text-ink">
            {tradedDays}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="overflow-hidden xl:col-span-2">
          <CardHeader
            title={format(month, 'MMMM yyyy')}
            subtitle={`${tradedDays} active trading days · ${monthMetrics.totalTrades} trades`}
            icon={<CalendarDays className="h-4 w-4" />}
            action={
              bestDay ? (
                <Badge variant={bestDay.pnl >= 0 ? 'positive' : 'negative'} dot>
                  Best day {formatSignedCurrency(bestDay.pnl, settings.currency)}
                </Badge>
              ) : null
            }
          />
          <div className="p-3 pt-4 sm:p-4">
            <div className="grid grid-cols-7 gap-1 pb-1.5">
              {labels.map((label) => (
                <div
                  key={label}
                  className="py-1 text-center text-[9.5px] font-semibold uppercase tracking-[0.13em] text-faint"
                >
                  {label}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {weeks.flat().map((day) => {
                const iso = isoDay(day)
                const inMonth = isSameMonth(day, month)
                const dayStats = stats.get(iso)
                const isSelected = selected === iso
                const today = isTodayDate(day)
                const pnl = dayStats?.pnl ?? 0
                const tone = pnlTone(pnl)
                return (
                  <button
                    key={iso}
                    type="button"
                    onClick={() => setSelected(iso)}
                    className={cn(
                      'focus-ring group relative flex min-h-[70px] flex-col rounded-lg border p-1.5 text-left transition sm:min-h-[86px] sm:p-2',
                      inMonth
                        ? 'border-line/70 bg-white/[0.012] hover:border-line-strong hover:bg-white/[0.03]'
                        : 'border-transparent bg-transparent opacity-35 hover:opacity-60',
                      isSelected && 'border-brand/45 bg-brand/[0.055]',
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={cn(
                          'num flex h-5 min-w-5 items-center justify-center rounded-md px-1 text-[10.5px] font-medium',
                          today
                            ? 'bg-brand text-brand-ink'
                            : isSelected
                              ? 'text-brand'
                              : 'text-muted',
                        )}
                      >
                        {format(day, 'd')}
                      </span>
                      {dayStats ? (
                        <span className="text-[8.5px] font-medium text-faint">
                          {dayStats.trades}
                        </span>
                      ) : null}
                    </div>
                    {dayStats ? (
                      <div className="mt-auto">
                        <p
                          className={cn(
                            'num truncate text-[10px] font-semibold sm:text-[11px]',
                            toneText(tone),
                          )}
                        >
                          {formatSignedCurrency(pnl, settings.currency)}
                        </p>
                        <div className="mt-1 hidden items-center gap-1 sm:flex">
                          {dayStats.wins > 0 ? (
                            <span className="h-1 flex-1 rounded-full bg-positive/40" style={{ flexGrow: dayStats.wins }} />
                          ) : null}
                          {dayStats.losses > 0 ? (
                            <span className="h-1 flex-1 rounded-full bg-negative/40" style={{ flexGrow: dayStats.losses }} />
                          ) : null}
                          {dayStats.wins + dayStats.losses === 0 ? (
                            <span className="h-1 flex-1 rounded-full bg-white/10" />
                          ) : null}
                        </div>
                      </div>
                    ) : null}
                  </button>
                )
              })}
            </div>
            <div className="mt-3 flex items-center justify-end gap-3 border-t border-line/60 pt-2.5 text-[9.5px] text-faint">
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-positive" />
                Win day
              </span>
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-negative" />
                Loss day
              </span>
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-white/15" />
                No trades
              </span>
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader
            title={format(new Date(`${selected}T00:00:00`), 'EEEE, MMM d')}
            subtitle={
              dayTrades.length > 0
                ? `${dayTrades.length} trade${dayTrades.length === 1 ? '' : 's'} logged`
                : 'No trades logged'
            }
            icon={<Target className="h-4 w-4" />}
            action={
              <Button
                size="sm"
                variant="brand-soft"
                icon={<Plus className="h-3 w-3" />}
                onClick={() => openTradeForm({ prefillDate: selected })}
              >
                Add
              </Button>
            }
          />

          {dayTrades.length === 0 ? (
            <EmptyState
              icon={<CalendarDays className="h-5 w-5" />}
              title="Nothing logged"
              description="Use this day to review, or log a trade to fill in the record."
              className="py-10"
              action={
                <Button
                  size="sm"
                  variant="secondary"
                  icon={<Plus className="h-3.5 w-3.5" />}
                  onClick={() => openTradeForm({ prefillDate: selected })}
                >
                  Log this day
                </Button>
              }
            />
          ) : (
            <div className="px-3.5 pb-4">
              <div className="mb-2 flex items-center justify-between rounded-lg border border-line/70 bg-white/[0.012] px-3 py-2">
                <span className="text-[10px] uppercase tracking-[0.12em] text-faint">
                  Day net
                </span>
                <span
                  className={cn(
                    'num text-[12px] font-semibold',
                    toneText(
                      pnlTone(
                        dayTrades.reduce((sum, trade) => sum + trade.realizedPnL, 0),
                      ),
                    ),
                  )}
                >
                  {formatSignedCurrency(
                    dayTrades.reduce((sum, trade) => sum + trade.realizedPnL, 0),
                    settings.currency,
                  )}
                </span>
              </div>
              <div className="space-y-2">
                {dayTrades.map((trade) => (
                  <button
                    key={trade.id}
                    type="button"
                    onClick={() => openTradeDetail(trade.id)}
                    className="focus-ring card-hover flex w-full items-center gap-2.5 rounded-xl border border-line/70 bg-white/[0.012] p-2.5 text-left"
                  >
                    <span
                      className={cn(
                        'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border',
                        trade.direction === 'Long'
                          ? 'border-positive/20 bg-positive/10 text-positive'
                          : 'border-negative/20 bg-negative/10 text-negative',
                      )}
                    >
                      {trade.direction === 'Long' ? (
                        <ArrowUpRight className="h-3 w-3" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1.5 text-[11.5px] font-medium text-ink">
                        {trade.instrument}
                        <span className="text-[9.5px] font-normal text-faint">
                          {trade.session}
                        </span>
                      </p>
                      <p className="num text-[9.5px] text-faint">
                        {to12Hour(trade.entryTime)} · {trade.setupTags[0] ?? 'No setup'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={cn(
                          'num text-[11px] font-semibold',
                          toneText(pnlTone(trade.realizedPnL)),
                        )}
                      >
                        {formatSignedCurrency(trade.realizedPnL, settings.currency)}
                      </p>
                      <p className="num text-[9.5px] text-faint">
                        {formatR(trade.rMultiple)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
              <div className="mt-3 rounded-lg border border-line/70 bg-white/[0.012] px-3 py-2">
                <div className="flex items-center justify-between text-[9.5px] text-faint">
                  <span>Discipline</span>
                  <span className="num text-muted">
                    {(
                      dayTrades.reduce(
                        (sum, trade) => sum + trade.disciplineRating,
                        0,
                      ) / dayTrades.length
                    ).toFixed(1)}{' '}
                    / 5
                  </span>
                </div>
                <Meter
                  className="mt-1.5"
                  height="xs"
                  value={
                    (dayTrades.reduce(
                      (sum, trade) => sum + trade.disciplineRating,
                      0,
                    ) /
                      dayTrades.length /
                      5) *
                    100
                  }
                  color="brand"
                />
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
