import { useMemo, useState } from 'react'
import {
  ArrowDownRight,
  ArrowUpDown,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Download,
  Funnel,
  Pencil,
  Plus,
  Search,
  SearchX,
  Trash,
} from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/shared/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { Rating } from '@/components/ui/Rating'
import { Select } from '@/components/ui/Select'
import { computeMetrics } from '@/lib/analytics'
import { downloadTradesCsv } from '@/lib/backup'
import {
  INSTRUMENTS,
  MISTAKE_SUGGESTIONS,
  SETUP_SUGGESTIONS,
} from '@/lib/constants'
import {
  cn,
  formatDateLong,
  formatPercent,
  formatPrice,
  formatR,
  formatSignedCurrency,
  getRangeBounds,
  isInBounds,
  pnlTone,
  todayISO,
  toneText,
  to12Hour,
} from '@/lib/utils'
import type { Trade } from '@/types/trade'
import { TRADE_SESSIONS } from '@/types/trade'
import { useJournalStore } from '@/store/useJournalStore'
import { useUIStore, type TradeRange } from '@/store/useUIStore'

type SortKey = 'date' | 'realizedPnL' | 'rMultiple' | 'instrument'
type SortDir = 'asc' | 'desc'

const SORTABLE: { key: SortKey; label: string; align?: 'right' }[] = [
  { key: 'date', label: 'Date' },
  { key: 'instrument', label: 'Instrument' },
  { key: 'rMultiple', label: 'R', align: 'right' },
  { key: 'realizedPnL', label: 'Net P&L', align: 'right' },
]

const RANGE_OPTIONS: { value: TradeRange; label: string }[] = [
  { value: 'all', label: 'All time' },
  { value: 'today', label: 'Today' },
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
]

const PAGE_SIZES = [
  { value: '10', label: '10 / page' },
  { value: '20', label: '20 / page' },
  { value: '50', label: '50 / page' },
]

function matchesRange(date: string, range: TradeRange) {
  if (range === 'all') return true
  if (range === 'today') return date === todayISO()
  const preset = range === '7d' ? '7d' : range === '30d' ? '30d' : '90d'
  return isInBounds(date, getRangeBounds(preset))
}

function sortValue(trade: Trade, key: SortKey) {
  if (key === 'date') return `${trade.date}T${trade.entryTime}`
  if (key === 'instrument') return trade.instrument
  return trade[key]
}

export function TradesPage() {
  const trades = useJournalStore((state) => state.trades)
  const settings = useJournalStore((state) => state.settings)
  const deleteTrade = useJournalStore((state) => state.deleteTrade)
  const filters = useUIStore((state) => state.filters)
  const setFilters = useUIStore((state) => state.setFilters)
  const resetFilters = useUIStore((state) => state.resetFilters)
  const openTradeForm = useUIStore((state) => state.openTradeForm)
  const openTradeDetail = useUIStore((state) => state.openTradeDetail)

  const [sortKey, setSortKey] = useState<SortKey>('date')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState('20')
  const [pendingDelete, setPendingDelete] = useState<Trade | null>(null)

  const instruments = useMemo(
    () => [...INSTRUMENTS].map((instrument) => instrument.symbol),
    [],
  )

  const filtered = useMemo(() => {
    const query = filters.search.trim().toLowerCase()
    return trades.filter((trade) => {
      if (!matchesRange(trade.date, filters.range)) return false
      if (filters.session !== 'all' && trade.session !== filters.session) return false
      if (filters.instrument !== 'all' && trade.instrument !== filters.instrument)
        return false
      if (filters.status !== 'all' && trade.status !== filters.status) return false
      if (filters.direction !== 'all' && trade.direction !== filters.direction)
        return false
      if (
        filters.tag !== 'all' &&
        !trade.setupTags.includes(filters.tag) &&
        !trade.mistakes.includes(filters.tag)
      )
        return false
      if (query) {
        const haystack =
          `${trade.instrument} ${trade.session} ${trade.direction} ${trade.status} ${trade.date} ${trade.setupTags.join(' ')} ${trade.mistakes.join(' ')} ${trade.notes}`.toLowerCase()
        if (!haystack.includes(query)) return false
      }
      return true
    })
  }, [trades, filters])

  const sorted = useMemo(() => {
    const copy = [...filtered]
    copy.sort((a, b) => {
      const left = sortValue(a, sortKey)
      const right = sortValue(b, sortKey)
      if (typeof left === 'number' && typeof right === 'number') {
        return sortDir === 'asc' ? left - right : right - left
      }
      return sortDir === 'asc'
        ? String(left).localeCompare(String(right))
        : String(right).localeCompare(String(left))
    })
    return copy
  }, [filtered, sortKey, sortDir])

  const metrics = useMemo(() => computeMetrics(filtered), [filtered])
  const pageCount = Math.max(1, Math.ceil(sorted.length / Number(pageSize)))
  const currentPage = Math.min(page, pageCount)
  const visible = sorted.slice(
    (currentPage - 1) * Number(pageSize),
    currentPage * Number(pageSize),
  )

  const activeFilterCount = [
    filters.session !== 'all',
    filters.instrument !== 'all',
    filters.status !== 'all',
    filters.direction !== 'all',
    filters.tag !== 'all',
    filters.range !== 'all',
    Boolean(filters.search),
  ].filter(Boolean).length

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((dir) => (dir === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir(key === 'date' ? 'desc' : 'desc')
    }
    setPage(1)
  }

  function updateFilter(patch: Parameters<typeof setFilters>[0]) {
    setFilters(patch)
    setPage(1)
  }

  function editTrade(trade: Trade) {
    openTradeForm({ tradeId: trade.id })
  }

  async function confirmDelete() {
    if (!pendingDelete) return
    try {
      await deleteTrade(pendingDelete.id)
      toast.success('Trade deleted', {
        description: `${pendingDelete.instrument} · ${formatDateLong(pendingDelete.date)}`,
      })
      setPendingDelete(null)
    } catch (error) {
      toast.error('Could not delete that trade', {
        description: error instanceof Error ? error.message : 'Please try again.',
      })
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Trade log"
        title="Every trade, documented."
        description="Filter, sort and review the full record. Each entry keeps its screenshots, tags and lessons."
        actions={
          <>
            <Button
              variant="secondary"
              icon={<Download className="h-4 w-4" />}
              onClick={() => {
                if (filtered.length === 0) {
                  toast.error('Nothing to export', {
                    description: 'Adjust your filters and try again.',
                  })
                  return
                }
                downloadTradesCsv(sorted)
                toast.success('CSV exported', {
                  description: `${sorted.length} trades written to your downloads folder.`,
                })
              }}
            >
              Export
            </Button>
            <Button
              variant="primary"
              icon={<Plus className="h-4 w-4" />}
              onClick={() => openTradeForm()}
            >
              Log trade
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="card-surface px-3.5 py-3">
          <p className="text-[9.5px] uppercase tracking-[0.14em] text-faint">Net P&L</p>
          <p className={cn('num mt-1.5 font-display text-[17px] font-semibold', toneText(pnlTone(metrics.netPnl)))}>
            {formatSignedCurrency(metrics.netPnl, settings.currency)}
          </p>
        </div>
        <div className="card-surface px-3.5 py-3">
          <p className="text-[9.5px] uppercase tracking-[0.14em] text-faint">Win rate</p>
          <p className="num mt-1.5 font-display text-[17px] font-semibold text-ink">
            {formatPercent(metrics.winRate, 1)}
          </p>
        </div>
        <div className="card-surface px-3.5 py-3">
          <p className="text-[9.5px] uppercase tracking-[0.14em] text-faint">Avg R</p>
          <p className={cn('num mt-1.5 font-display text-[17px] font-semibold', toneText(pnlTone(metrics.avgR)))}>
            {formatR(metrics.avgR)}
          </p>
        </div>
        <div className="card-surface px-3.5 py-3">
          <p className="text-[9.5px] uppercase tracking-[0.14em] text-faint">Trades</p>
          <p className="num mt-1.5 font-display text-[17px] font-semibold text-ink">
            {filtered.length}
          </p>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="border-b border-line px-3.5 py-3.5 sm:px-4">
          <div className="flex flex-col gap-2.5 xl:flex-row xl:items-center">
            <Input
              value={filters.search}
              onChange={(event) => updateFilter({ search: event.target.value })}
              placeholder="Search instrument, setup, note…"
              prefix={<Search className="h-3.5 w-3.5" />}
              containerClassName="xl:w-72"
              aria-label="Search trades"
            />
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:flex xl:flex-1">
              <Select
                size="sm"
                value={filters.range}
                onValueChange={(value) => updateFilter({ range: value as TradeRange })}
                options={RANGE_OPTIONS}
                ariaLabel="Date range"
                icon={<Funnel className="h-3 w-3" />}
                className="xl:w-[130px]"
              />
              <Select
                size="sm"
                value={filters.session}
                onValueChange={(value) =>
                  updateFilter({ session: value as typeof filters.session })
                }
                options={[
                  { value: 'all', label: 'All sessions' },
                  ...TRADE_SESSIONS.map((session) => ({
                    value: session,
                    label: session,
                  })),
                ]}
                ariaLabel="Session filter"
                className="xl:w-[132px]"
              />
              <Select
                size="sm"
                value={filters.instrument}
                onValueChange={(value) => updateFilter({ instrument: value })}
                options={[
                  { value: 'all', label: 'All instruments' },
                  ...instruments.map((symbol) => ({
                    value: symbol,
                    label: symbol,
                  })),
                ]}
                ariaLabel="Instrument filter"
                className="xl:w-[140px]"
              />
              <Select
                size="sm"
                value={filters.status}
                onValueChange={(value) =>
                  updateFilter({ status: value as typeof filters.status })
                }
                options={[
                  { value: 'all', label: 'All outcomes' },
                  { value: 'Win', label: 'Wins' },
                  { value: 'Loss', label: 'Losses' },
                  { value: 'BE', label: 'Break-even' },
                ]}
                ariaLabel="Outcome filter"
                className="xl:w-[126px]"
              />
              <Select
                size="sm"
                value={filters.direction}
                onValueChange={(value) =>
                  updateFilter({ direction: value as typeof filters.direction })
                }
                options={[
                  { value: 'all', label: 'Both sides' },
                  { value: 'Long', label: 'Long' },
                  { value: 'Short', label: 'Short' },
                ]}
                ariaLabel="Direction filter"
                className="xl:w-[120px]"
              />
              <Select
                size="sm"
                value={filters.tag}
                onValueChange={(value) => updateFilter({ tag: value })}
                options={[
                  { value: 'all', label: 'All tags' },
                  ...SETUP_SUGGESTIONS.map((tag) => ({ value: tag, label: tag })),
                  ...MISTAKE_SUGGESTIONS.map((tag) => ({
                    value: tag,
                    label: `⚠ ${tag}`,
                  })),
                ]}
                ariaLabel="Tag filter"
                className="xl:w-[136px]"
              />
            </div>
            {activeFilterCount > 0 ? (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  resetFilters()
                  setPage(1)
                }}
              >
                Clear ({activeFilterCount})
              </Button>
            ) : null}
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<SearchX className="h-5 w-5" />}
            title="No trades match"
            description="Try widening the range, clearing filters, or log a new trade."
            action={
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    resetFilters()
                    setPage(1)
                  }}
                >
                  Clear filters
                </Button>
                <Button
                  variant="primary"
                  icon={<Plus className="h-4 w-4" />}
                  onClick={() => openTradeForm()}
                >
                  Log trade
                </Button>
              </div>
            }
          />
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[900px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-line bg-white/[0.012]">
                    {SORTABLE.map((column) => (
                      <th
                        key={column.key}
                        className={cn(
                          'whitespace-nowrap px-3.5 py-2.5 text-[9.5px] font-semibold uppercase tracking-[0.13em] text-faint',
                          column.align === 'right' && 'text-right',
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => toggleSort(column.key)}
                          className={cn(
                            'focus-ring inline-flex items-center gap-1 rounded-sm transition hover:text-muted',
                            column.align === 'right' && 'ml-auto',
                            sortKey === column.key && 'text-brand',
                          )}
                        >
                          {column.label}
                          <ArrowUpDown className="h-2.5 w-2.5 opacity-60" />
                        </button>
                      </th>
                    ))}
                    <th className="px-3.5 py-2.5 text-[9.5px] font-semibold uppercase tracking-[0.13em] text-faint">
                      Session
                    </th>
                    <th className="px-3.5 py-2.5 text-[9.5px] font-semibold uppercase tracking-[0.13em] text-faint">
                      Setup
                    </th>
                    <th className="px-3.5 py-2.5 text-[9.5px] font-semibold uppercase tracking-[0.13em] text-faint">
                      Discipline
                    </th>
                    <th className="px-3.5 py-2.5 text-[9.5px] font-semibold uppercase tracking-[0.13em] text-faint">
                      Status
                    </th>
                    <th className="px-3.5 py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {visible.map((trade) => (
                    <tr
                      key={trade.id}
                      onClick={() => openTradeDetail(trade.id)}
                      className="group cursor-pointer border-b border-line/60 transition hover:bg-white/[0.025]"
                    >
                      <td className="whitespace-nowrap px-3.5 py-2.5">
                        <p className="text-[12px] font-medium text-ink">
                          {formatDateLong(trade.date).split(',').slice(0, 2).join(',')}
                        </p>
                        <p className="num mt-0.5 text-[10px] text-faint">
                          {to12Hour(trade.entryTime)}
                          {trade.exitTime ? ` – ${to12Hour(trade.exitTime)}` : ''}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-3.5 py-2.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              'flex h-6 w-6 items-center justify-center rounded-md border',
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
                          <div>
                            <p className="text-[12px] font-medium text-ink">
                              {trade.instrument}
                            </p>
                            <p className="num text-[10px] text-faint">
                              {formatPrice(trade.entryPrice, trade.instrument)} →{' '}
                              {formatPrice(trade.exitPrice, trade.instrument)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td
                        className={cn(
                          'num whitespace-nowrap px-3.5 py-2.5 text-right text-[12px] font-semibold',
                          toneText(pnlTone(trade.rMultiple)),
                        )}
                      >
                        {formatR(trade.rMultiple)}
                      </td>
                      <td
                        className={cn(
                          'num whitespace-nowrap px-3.5 py-2.5 text-right text-[12px] font-semibold',
                          toneText(pnlTone(trade.realizedPnL)),
                        )}
                      >
                        {formatSignedCurrency(trade.realizedPnL, settings.currency)}
                      </td>
                      <td className="whitespace-nowrap px-3.5 py-2.5 text-[11px] text-muted">
                        {trade.session}
                      </td>
                      <td className="px-3.5 py-2.5">
                        <div className="flex max-w-[170px] flex-wrap gap-1">
                          {trade.setupTags.slice(0, 2).map((tag) => (
                            <Badge key={tag} variant="brand">
                              {tag}
                            </Badge>
                          ))}
                          {trade.setupTags.length > 2 ? (
                            <Badge variant="outline">
                              +{trade.setupTags.length - 2}
                            </Badge>
                          ) : null}
                          {trade.setupTags.length === 0 ? (
                            <span className="text-[10px] text-faint">—</span>
                          ) : null}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3.5 py-2.5">
                        <Rating value={trade.disciplineRating} readOnly size="sm" />
                      </td>
                      <td className="whitespace-nowrap px-3.5 py-2.5">
                        <Badge
                          variant={
                            trade.status === 'Win'
                              ? 'positive'
                              : trade.status === 'Loss'
                                ? 'negative'
                                : 'neutral'
                          }
                          dot
                        >
                          {trade.status}
                        </Badge>
                      </td>
                      <td className="whitespace-nowrap px-2 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 transition group-hover:opacity-100">
                          <button
                            type="button"
                            aria-label="Edit trade"
                            onClick={(event) => {
                              event.stopPropagation()
                              editTrade(trade)
                            }}
                            className="focus-ring flex h-7 w-7 items-center justify-center rounded-md text-faint transition hover:bg-white/[0.06] hover:text-ink"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            aria-label="Delete trade"
                            onClick={(event) => {
                              event.stopPropagation()
                              setPendingDelete(trade)
                            }}
                            className="focus-ring flex h-7 w-7 items-center justify-center rounded-md text-faint transition hover:bg-negative/10 hover:text-negative"
                          >
                            <Trash className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-line/60 md:hidden">
              {visible.map((trade) => (
                <div key={trade.id} className="p-3.5">
                  <button
                    type="button"
                    onClick={() => openTradeDetail(trade.id)}
                    className="focus-ring w-full rounded-lg text-left"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            'flex h-8 w-8 items-center justify-center rounded-lg border',
                            trade.direction === 'Long'
                              ? 'border-positive/20 bg-positive/10 text-positive'
                              : 'border-negative/20 bg-negative/10 text-negative',
                          )}
                        >
                          {trade.direction === 'Long' ? (
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          ) : (
                            <ArrowDownRight className="h-3.5 w-3.5" />
                          )}
                        </span>
                        <div>
                          <p className="text-[12.5px] font-medium text-ink">
                            {trade.instrument}
                          </p>
                          <p className="text-[10px] text-faint">
                            {formatDateLong(trade.date)} · {trade.session}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={cn(
                            'num text-[13px] font-semibold',
                            toneText(pnlTone(trade.realizedPnL)),
                          )}
                        >
                          {formatSignedCurrency(trade.realizedPnL, settings.currency)}
                        </p>
                        <p className="num text-[10px] text-faint">
                          {formatR(trade.rMultiple)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                      <Badge
                        variant={
                          trade.status === 'Win'
                            ? 'positive'
                            : trade.status === 'Loss'
                              ? 'negative'
                              : 'neutral'
                        }
                        dot
                      >
                        {trade.status}
                      </Badge>
                      {trade.setupTags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                      <span className="ml-auto">
                        <Rating value={trade.disciplineRating} readOnly size="sm" />
                      </span>
                    </div>
                  </button>
                  <div className="mt-2 flex items-center justify-end gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={<Pencil className="h-3 w-3" />}
                      onClick={() => editTrade(trade)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-negative hover:bg-negative/10 hover:text-negative"
                      icon={<Trash className="h-3 w-3" />}
                      onClick={() => setPendingDelete(trade)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col items-center justify-between gap-3 border-t border-line px-3.5 py-3 sm:flex-row sm:px-4">
              <p className="text-[10.5px] text-faint">
                Showing{' '}
                <span className="text-muted">
                  {(currentPage - 1) * Number(pageSize) + 1}–
                  {Math.min(currentPage * Number(pageSize), sorted.length)}
                </span>{' '}
                of {sorted.length} trades
              </p>
              <div className="flex items-center gap-2">
                <Select
                  size="sm"
                  value={pageSize}
                  onValueChange={(value) => {
                    setPageSize(value)
                    setPage(1)
                  }}
                  options={PAGE_SIZES}
                  ariaLabel="Rows per page"
                  className="w-[108px]"
                />
                <div className="flex items-center gap-1">
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    disabled={currentPage <= 1}
                    onClick={() => setPage((value) => Math.max(1, value - 1))}
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="num px-1 text-[11px] text-muted">
                    {currentPage} / {pageCount}
                  </span>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    disabled={currentPage >= pageCount}
                    onClick={() =>
                      setPage((value) => Math.min(pageCount, value + 1))
                    }
                    aria-label="Next page"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </Card>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null)
        }}
        title="Delete this trade?"
        description={
          pendingDelete
            ? `This removes the ${pendingDelete.instrument} trade from ${formatDateLong(pendingDelete.date)}. This cannot be undone.`
            : 'This cannot be undone.'
        }
        confirmLabel="Delete trade"
        onConfirm={confirmDelete}
      />
    </div>
  )
}
