import { useEffect, useMemo, useState } from 'react'
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  ChartLine,
  Clock,
  Crosshair,
  Image as ImageIcon,
  Pencil,
  ShieldCheck,
  Star,
  Trash,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Rating } from '@/components/ui/Rating'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '@/components/ui/Sheet'
import { SESSION_META } from '@/lib/constants'
import {
  cn,
  formatDateLong,
  formatDuration,
  formatR,
  formatSignedCurrency,
  formatPrice,
  holdMinutes,
  pnlTone,
  toneText,
  to12Hour,
} from '@/lib/utils'
import type { Trade } from '@/types/trade'
import { useJournalStore } from '@/store/useJournalStore'
import { useUIStore } from '@/store/useUIStore'

function DetailRow({
  label,
  value,
  valueClassName,
}: {
  label: string
  value: React.ReactNode
  valueClassName?: string
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-line/60 py-2.5 last:border-0">
      <span className="text-[11px] text-faint">{label}</span>
      <span className={cn('num text-right text-[12px] font-medium text-ink', valueClassName)}>
        {value}
      </span>
    </div>
  )
}

function StatBlock({
  label,
  value,
  valueClassName,
}: {
  label: string
  value: React.ReactNode
  valueClassName?: string
}) {
  return (
    <div className="rounded-xl border border-line/80 bg-white/[0.015] px-3 py-2.5">
      <p className="text-[9px] font-medium uppercase tracking-[0.14em] text-faint">
        {label}
      </p>
      <p
        className={cn(
          'num mt-1.5 font-display text-[15px] font-semibold leading-none tracking-tight text-ink',
          valueClassName,
        )}
      >
        {value}
      </p>
    </div>
  )
}

export function TradeDetailDrawer() {
  const detailTradeId = useUIStore((state) => state.detailTradeId)
  const closeTradeDetail = useUIStore((state) => state.closeTradeDetail)
  const openTradeForm = useUIStore((state) => state.openTradeForm)
  const trades = useJournalStore((state) => state.trades)
  const settings = useJournalStore((state) => state.settings)
  const deleteTrade = useJournalStore((state) => state.deleteTrade)

  const [cached, setCached] = useState<Trade | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const liveTrade = useMemo(
    () => trades.find((trade) => trade.id === detailTradeId) ?? null,
    [trades, detailTradeId],
  )

  useEffect(() => {
    if (liveTrade) setCached(liveTrade)
  }, [liveTrade])

  useEffect(() => {
    if (!detailTradeId) {
      // keep cached trade for the closing animation; clear after it finishes
      const timer = window.setTimeout(() => setCached(null), 320)
      return () => window.clearTimeout(timer)
    }
  }, [detailTradeId])

  const trade = liveTrade ?? cached
  const open = Boolean(detailTradeId) && Boolean(trade)

  function editTrade() {
    if (!trade) return
    closeTradeDetail()
    window.setTimeout(() => openTradeForm({ tradeId: trade.id }), 180)
  }

  async function handleDelete() {
    if (!trade) return
    try {
      await deleteTrade(trade.id)
      toast.success('Trade deleted', {
        description: `${trade.instrument} · ${formatDateLong(trade.date)}`,
      })
      closeTradeDetail()
    } catch (error) {
      toast.error('Could not delete that trade', {
        description: error instanceof Error ? error.message : 'Please try again.',
      })
    }
  }

  const tone = trade ? pnlTone(trade.realizedPnL) : 'neutral'
  const sessionMeta = trade ? SESSION_META[trade.session] : null
  const hold = trade ? holdMinutes(trade.entryTime, trade.exitTime) : 0
  const isLong = trade?.direction === 'Long'

  return (
    <>
      <Sheet
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) closeTradeDetail()
        }}
      >
        <SheetContent
          className="sm:max-w-[580px]"
          closeLabel="Close trade details"
        >
          {trade ? (
            <>
              <SheetTitle className="sr-only">
                {trade.instrument} trade on {formatDateLong(trade.date)}
              </SheetTitle>
              <SheetDescription className="sr-only">
                Full trade breakdown, risk, execution review and screenshots.
              </SheetDescription>

              <div className="shrink-0 border-b border-line px-5 pb-4 pt-5 pr-14 sm:px-6">
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border',
                      isLong
                        ? 'border-positive/25 bg-positive/10 text-positive'
                        : 'border-negative/25 bg-negative/10 text-negative',
                    )}
                  >
                    {isLong ? (
                      <ArrowUpRight className="h-5 w-5" />
                    ) : (
                      <ArrowDownRight className="h-5 w-5" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-display text-xl font-semibold tracking-tight text-ink">
                        {trade.instrument}
                      </h2>
                      <Badge variant="outline">{trade.direction}</Badge>
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
                    </div>
                    <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-faint">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" />
                        {formatDateLong(trade.date)}
                      </span>
                      <span className="text-line-strong">·</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {to12Hour(trade.entryTime)}
                        {trade.exitTime
                          ? ` – ${to12Hour(trade.exitTime)}`
                          : ''}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  <StatBlock
                    label="Net P&L"
                    value={formatSignedCurrency(trade.realizedPnL, settings.currency)}
                    valueClassName={toneText(tone)}
                  />
                  <StatBlock
                    label="R multiple"
                    value={formatR(trade.rMultiple)}
                    valueClassName={toneText(tone)}
                  />
                  <StatBlock
                    label="Hold time"
                    value={formatDuration(hold)}
                  />
                </div>
              </div>

              <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
                <section>
                  <h3 className="mb-2 flex items-center gap-2 font-display text-[12.5px] font-semibold text-ink">
                    <Crosshair className="h-3.5 w-3.5 text-brand" />
                    Execution
                  </h3>
                  <div className="rounded-xl border border-line/80 bg-white/[0.012] px-3.5">
                    <DetailRow
                      label="Session"
                      value={
                        <span className="flex items-center justify-end gap-1.5">
                          <span
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ background: sessionMeta?.color }}
                          />
                          {trade.session}
                          <span className="text-faint">
                            {sessionMeta?.window}
                          </span>
                        </span>
                      }
                    />
                    <DetailRow
                      label="Entry price"
                      value={formatPrice(trade.entryPrice, trade.instrument)}
                    />
                    <DetailRow
                      label="Stop loss"
                      value={formatPrice(trade.stopLoss, trade.instrument)}
                      valueClassName="text-negative"
                    />
                    {trade.takeProfit ? (
                      <DetailRow
                        label="Take profit"
                        value={formatPrice(trade.takeProfit, trade.instrument)}
                        valueClassName="text-positive"
                      />
                    ) : null}
                    <DetailRow
                      label="Exit price"
                      value={formatPrice(trade.exitPrice, trade.instrument)}
                    />
                    <DetailRow label="Size" value={`${trade.lotSize} lots`} />
                    <DetailRow
                      label="Risk amount"
                      value={formatSignedCurrency(-trade.riskAmount, settings.currency)}
                      valueClassName="text-muted"
                    />
                  </div>
                </section>

                <section>
                  <h3 className="mb-2 flex items-center gap-2 font-display text-[12.5px] font-semibold text-ink">
                    <ShieldCheck className="h-3.5 w-3.5 text-brand" />
                    Review
                  </h3>
                  <div className="space-y-3 rounded-xl border border-line/80 bg-white/[0.012] p-3.5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-medium text-muted">
                          Discipline
                        </p>
                        <p className="text-[10px] text-faint">
                          {trade.disciplineRating} / 5
                        </p>
                      </div>
                      <Rating value={trade.disciplineRating} readOnly />
                    </div>
                    <div className="flex items-center justify-between gap-3 border-t border-line/60 pt-3">
                      <div>
                        <p className="text-[11px] font-medium text-muted">
                          Followed plan
                        </p>
                        <p className="text-[10px] text-faint">
                          {trade.followedPlan
                            ? 'No rules broken'
                            : 'Plan was broken on this trade'}
                        </p>
                      </div>
                      <Badge
                        variant={trade.followedPlan ? 'positive' : 'warning'}
                        dot
                      >
                        {trade.followedPlan ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="mb-2 font-display text-[12.5px] font-semibold text-ink">
                    Setup tags
                  </h3>
                  {trade.setupTags.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {trade.setupTags.map((tag) => (
                        <Badge key={tag} variant="brand">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-faint">No setups tagged.</p>
                  )}
                </section>

                <section>
                  <h3 className="mb-2 font-display text-[12.5px] font-semibold text-ink">
                    Mistakes
                  </h3>
                  {trade.mistakes.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {trade.mistakes.map((tag) => (
                        <Badge key={tag} variant="negative">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="flex items-center gap-1.5 text-[11px] text-positive">
                      <Star className="h-3 w-3" />
                      Clean execution — no mistakes tagged.
                    </p>
                  )}
                </section>

                {trade.notes ? (
                  <section>
                    <h3 className="mb-2 font-display text-[12.5px] font-semibold text-ink">
                      Notes
                    </h3>
                    <p className="whitespace-pre-line rounded-xl border border-line/80 bg-white/[0.012] p-3.5 text-[12px] leading-relaxed text-muted">
                      {trade.notes}
                    </p>
                  </section>
                ) : null}

                {trade.preTradeImage || trade.postTradeImage ? (
                  <section>
                    <h3 className="mb-2 flex items-center gap-2 font-display text-[12.5px] font-semibold text-ink">
                      <ImageIcon className="h-3.5 w-3.5 text-brand" />
                      Screenshots
                    </h3>
                    <div className="space-y-3">
                      {trade.preTradeImage ? (
                        <figure>
                          <figcaption className="mb-1.5 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-faint">
                            <ChartLine className="h-3 w-3" />
                            Pre-trade
                          </figcaption>
                          <img
                            src={trade.preTradeImage}
                            alt={`${trade.instrument} pre-trade chart`}
                            className="w-full rounded-xl border border-line"
                          />
                        </figure>
                      ) : null}
                      {trade.postTradeImage ? (
                        <figure>
                          <figcaption className="mb-1.5 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-faint">
                            <ChartLine className="h-3 w-3" />
                            Post-trade
                          </figcaption>
                          <img
                            src={trade.postTradeImage}
                            alt={`${trade.instrument} post-trade chart`}
                            className="w-full rounded-xl border border-line"
                          />
                        </figure>
                      ) : null}
                    </div>
                  </section>
                ) : null}
              </div>

              <div className="flex shrink-0 items-center gap-2 border-t border-line bg-panel px-5 py-3.5 sm:px-6">
                <Button
                  variant="danger"
                  icon={<Trash className="h-4 w-4" />}
                  onClick={() => setConfirmOpen(true)}
                >
                  Delete
                </Button>
                <div className="ml-auto flex items-center gap-2">
                  <Button variant="ghost" onClick={closeTradeDetail}>
                    Close
                  </Button>
                  <Button
                    variant="primary"
                    icon={<Pencil className="h-4 w-4" />}
                    onClick={editTrade}
                  >
                    Edit trade
                  </Button>
                </div>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete this trade?"
        description={
          trade
            ? `This will permanently remove the ${trade.instrument} trade from ${formatDateLong(trade.date)}. This cannot be undone.`
            : 'This cannot be undone.'
        }
        confirmLabel="Delete trade"
        onConfirm={handleDelete}
      />
    </>
  )
}
