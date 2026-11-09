import { useEffect, useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import {
  ArrowDownRight,
  ArrowUpRight,
  ChartLine,
  Check,
  Crosshair,
  Image as ImageIcon,
  ShieldCheck,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/Dialog'
import { Field, Input, Textarea } from '@/components/ui/Input'
import { Rating } from '@/components/ui/Rating'
import { Select } from '@/components/ui/Select'
import { Switch } from '@/components/ui/Switch'
import { ImageField } from '@/components/trades/ImageField'
import { TagInput } from '@/components/trades/TagInput'
import {
  INSTRUMENTS,
  MISTAKE_SUGGESTIONS,
  SESSION_META,
  SETUP_SUGGESTIONS,
} from '@/lib/constants'
import { computeR, statusFromR } from '@/lib/trade'
import {
  cn,
  formatR,
  formatSignedCurrency,
  todayISO,
} from '@/lib/utils'
import { TRADE_SESSIONS, type Trade, type TradeStatus } from '@/types/trade'
import { useJournalStore } from '@/store/useJournalStore'
import { useUIStore } from '@/store/useUIStore'

const numberField = z
  .number()
  .refine((value) => Number.isFinite(value), 'Enter a number')

const positiveField = z
  .number()
  .refine((value) => Number.isFinite(value) && value > 0, 'Must be greater than 0')

const tradeSchema = z.object({
  date: z.string().min(1, 'Pick a date'),
  entryTime: z.string().min(1, 'Required'),
  exitTime: z.string(),
  session: z.enum(['Asia', 'London', 'NY AM', 'NY PM']),
  instrument: z.string().min(1, 'Select an instrument'),
  direction: z.enum(['Long', 'Short']),
  entryPrice: positiveField,
  stopLoss: positiveField,
  takeProfit: numberField,
  exitPrice: positiveField,
  lotSize: positiveField,
  riskAmount: positiveField,
  realizedPnL: numberField,
  notes: z.string(),
})

type FormValues = z.infer<typeof tradeSchema>

const instrumentOptions = INSTRUMENTS.map((instrument) => ({
  value: instrument.symbol,
  label: `${instrument.symbol} — ${instrument.name}`,
}))

const sessionOptions = TRADE_SESSIONS.map((session) => ({
  value: session,
  label: `${session} · ${SESSION_META[session].window}`,
}))

const statusVariant: Record<
  TradeStatus,
  'positive' | 'negative' | 'neutral'
> = {
  Win: 'positive',
  Loss: 'negative',
  BE: 'neutral',
}

function makeDefaults(
  trade: Trade | null,
  prefillDate: string | null,
  defaultRisk: number,
): FormValues {
  if (trade) {
    return {
      date: trade.date,
      entryTime: trade.entryTime,
      exitTime: trade.exitTime ?? '',
      session: trade.session,
      instrument: trade.instrument,
      direction: trade.direction,
      entryPrice: trade.entryPrice,
      stopLoss: trade.stopLoss,
      takeProfit: trade.takeProfit ?? 0,
      exitPrice: trade.exitPrice,
      lotSize: trade.lotSize,
      riskAmount: trade.riskAmount,
      realizedPnL: trade.realizedPnL,
      notes: trade.notes,
    }
  }

  return {
    date: prefillDate ?? todayISO(),
    entryTime: '09:30',
    exitTime: '',
    session: 'NY AM',
    instrument: 'NQ',
    direction: 'Long',
    entryPrice: 0,
    stopLoss: 0,
    takeProfit: 0,
    exitPrice: 0,
    lotSize: 1,
    riskAmount: defaultRisk,
    realizedPnL: 0,
    notes: '',
  }
}

function FormSection({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-md border border-line bg-white/[0.025] text-faint">
          {icon}
        </span>
        <h3 className="font-display text-[12.5px] font-semibold text-ink">
          {title}
        </h3>
        {description ? (
          <span className="hidden text-[10px] text-faint sm:inline">
            {description}
          </span>
        ) : null}
        <div className="ml-auto h-px w-10 bg-line sm:w-20" />
      </div>
      {children}
    </section>
  )
}

export function TradeFormDialog() {
  const open = useUIStore((state) => state.tradeFormOpen)
  const tradeId = useUIStore((state) => state.tradeFormTradeId)
  const prefillDate = useUIStore((state) => state.tradeFormPrefillDate)
  const closeTradeForm = useUIStore((state) => state.closeTradeForm)
  const settings = useJournalStore((state) => state.settings)
  const addTrade = useJournalStore((state) => state.addTrade)
  const updateTrade = useJournalStore((state) => state.updateTrade)

  const [setupTags, setSetupTags] = useState<string[]>([])
  const [mistakes, setMistakes] = useState<string[]>([])
  const [discipline, setDiscipline] = useState(4)
  const [followedPlan, setFollowedPlan] = useState(true)
  const [preImage, setPreImage] = useState<string | undefined>()
  const [postImage, setPostImage] = useState<string | undefined>()

  const form = useForm<FormValues>({
    resolver: zodResolver(tradeSchema),
    defaultValues: makeDefaults(null, null, settings.defaultRisk),
  })

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = form

  const session = watch('session')
  const instrument = watch('instrument')
  const direction = watch('direction')
  const realizedPnL = watch('realizedPnL')
  const riskAmount = watch('riskAmount')
  const previewR = computeR(Number(realizedPnL) || 0, Number(riskAmount) || 0)
  const previewStatus = statusFromR(previewR)

  const editingTrade = useMemo(
    () => (tradeId ? useJournalStore.getState().trades.find((trade) => trade.id === tradeId) : null),
    [tradeId],
  )

  useEffect(() => {
    if (!open) return
    const trade = tradeId
      ? useJournalStore.getState().trades.find((item) => item.id === tradeId) ??
        null
      : null
    reset(makeDefaults(trade, prefillDate, settings.defaultRisk))
    setSetupTags(trade?.setupTags ?? [])
    setMistakes(trade?.mistakes ?? [])
    setDiscipline(trade?.disciplineRating ?? 4)
    setFollowedPlan(trade?.followedPlan ?? true)
    setPreImage(trade?.preTradeImage)
    setPostImage(trade?.postTradeImage)
  }, [open, tradeId, prefillDate, settings.defaultRisk, reset])

  async function onSubmit(values: FormValues) {
    try {
      const rMultiple = computeR(values.realizedPnL, values.riskAmount)
      const trade: Trade = {
        id: tradeId ?? crypto.randomUUID(),
        date: values.date,
        entryTime: values.entryTime,
        exitTime: values.exitTime || undefined,
        session: values.session,
        instrument: values.instrument,
        direction: values.direction,
        entryPrice: values.entryPrice,
        stopLoss: values.stopLoss,
        takeProfit: values.takeProfit > 0 ? values.takeProfit : undefined,
        exitPrice: values.exitPrice,
        lotSize: values.lotSize,
        riskAmount: values.riskAmount,
        realizedPnL: values.realizedPnL,
        rMultiple: Number(rMultiple.toFixed(2)),
        status: statusFromR(rMultiple),
        setupTags,
        mistakes,
        disciplineRating: discipline,
        followedPlan,
        preTradeImage: preImage,
        postTradeImage: postImage,
        notes: values.notes.trim(),
      }

      if (tradeId) {
        await updateTrade(trade)
      } else {
        await addTrade(trade)
      }

      toast.success(tradeId ? 'Trade updated' : 'Trade logged', {
        description: `${trade.instrument} · ${trade.direction} · ${formatR(trade.rMultiple)} · ${formatSignedCurrency(trade.realizedPnL, settings.currency)}`,
      })
      closeTradeForm()
    } catch (error) {
      toast.error('Could not save this trade', {
        description:
          error instanceof Error ? error.message : 'Please try again.',
      })
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) closeTradeForm()
      }}
    >
      <DialogContent
        size="lg"
        className="max-w-[900px]"
        closeLabel="Close trade form"
      >
        <div className="shrink-0 border-b border-line px-5 py-4 pr-14 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-brand/20 bg-brand/10 text-brand">
              <Crosshair className="h-4 w-4" />
            </span>
            <div>
              <DialogTitle className="font-display text-base font-semibold text-ink">
                {editingTrade ? 'Edit trade' : 'Log a trade'}
              </DialogTitle>
              <DialogDescription className="text-[11px] text-muted">
                {editingTrade
                  ? 'Refine the execution details and review notes.'
                  : 'Capture the setup, execution and the lesson it left behind.'}
              </DialogDescription>
            </div>
            <Badge
              variant={editingTrade ? 'warning' : 'brand'}
              className="ml-auto hidden sm:inline-flex"
            >
              {editingTrade ? 'Editing' : 'New entry'}
            </Badge>
          </div>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="min-h-0 flex-1 space-y-7 overflow-y-auto px-5 py-5 sm:px-6">
            <FormSection
              icon={<Crosshair className="h-3 w-3" />}
              title="Setup & timing"
              description="Context for the trade"
            >
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Field
                  label="Date"
                  htmlFor="trade-date"
                  required
                  error={errors.date?.message}
                  className="col-span-2 lg:col-span-1"
                >
                  <Input
                    id="trade-date"
                    type="date"
                    {...register('date')}
                    aria-invalid={Boolean(errors.date)}
                  />
                </Field>
                <Field
                  label="Session"
                  htmlFor="trade-session"
                  required
                  error={errors.session?.message}
                  className="col-span-2 lg:col-span-1"
                >
                  <Select
                    id="trade-session"
                    ariaLabel="Trading session"
                    value={session}
                    onValueChange={(value) =>
                      setValue('session', value as FormValues['session'], {
                        shouldValidate: true,
                      })
                    }
                    options={sessionOptions}
                  />
                </Field>
                <Field
                  label="Instrument"
                  htmlFor="trade-instrument"
                  required
                  error={errors.instrument?.message}
                  className="col-span-2"
                >
                  <Select
                    id="trade-instrument"
                    ariaLabel="Instrument"
                    value={instrument}
                    onValueChange={(value) =>
                      setValue('instrument', value, { shouldValidate: true })
                    }
                    options={instrumentOptions}
                  />
                </Field>
                <Field
                  label="Direction"
                  required
                  error={errors.direction?.message}
                  className="col-span-2"
                >
                  <div className="flex h-10 rounded-[10px] border border-line bg-inset p-1">
                    {(['Long', 'Short'] as const).map((value) => {
                      const active = direction === value
                      const isLong = value === 'Long'
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() =>
                            setValue('direction', value, {
                              shouldValidate: true,
                            })
                          }
                          className={cn(
                            'flex flex-1 items-center justify-center gap-1.5 rounded-md border text-[11px] font-semibold transition',
                            active
                              ? isLong
                                ? 'border-positive/25 bg-positive/10 text-positive'
                                : 'border-negative/25 bg-negative/10 text-negative'
                              : 'border-transparent text-faint hover:text-muted',
                          )}
                        >
                          {isLong ? (
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          ) : (
                            <ArrowDownRight className="h-3.5 w-3.5" />
                          )}
                          {value}
                        </button>
                      )
                    })}
                  </div>
                </Field>
                <Field
                  label="Entry time"
                  htmlFor="trade-entry-time"
                  required
                  error={errors.entryTime?.message}
                >
                  <Input
                    id="trade-entry-time"
                    type="time"
                    {...register('entryTime')}
                    aria-invalid={Boolean(errors.entryTime)}
                  />
                </Field>
                <Field
                  label="Exit time"
                  htmlFor="trade-exit-time"
                  hint="Optional"
                  error={errors.exitTime?.message}
                >
                  <Input
                    id="trade-exit-time"
                    type="time"
                    {...register('exitTime')}
                  />
                </Field>
              </div>
            </FormSection>

            <FormSection
              icon={<ChartLine className="h-3 w-3" />}
              title="Execution & risk"
              description="R and outcome are calculated automatically"
            >
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Field
                  label="Entry price"
                  htmlFor="trade-entry-price"
                  required
                  error={errors.entryPrice?.message}
                >
                  <Input
                    id="trade-entry-price"
                    type="number"
                    step="any"
                    inputMode="decimal"
                    placeholder="21850.25"
                    {...register('entryPrice', { valueAsNumber: true })}
                    aria-invalid={Boolean(errors.entryPrice)}
                  />
                </Field>
                <Field
                  label="Stop loss"
                  htmlFor="trade-stop"
                  required
                  error={errors.stopLoss?.message}
                >
                  <Input
                    id="trade-stop"
                    type="number"
                    step="any"
                    inputMode="decimal"
                    placeholder="21825.00"
                    {...register('stopLoss', { valueAsNumber: true })}
                    aria-invalid={Boolean(errors.stopLoss)}
                  />
                </Field>
                <Field
                  label="Take profit"
                  htmlFor="trade-target"
                  hint="Optional"
                  error={errors.takeProfit?.message}
                >
                  <Input
                    id="trade-target"
                    type="number"
                    step="any"
                    inputMode="decimal"
                    placeholder="21900.00"
                    {...register('takeProfit', { valueAsNumber: true })}
                    aria-invalid={Boolean(errors.takeProfit)}
                  />
                </Field>
                <Field
                  label="Exit price"
                  htmlFor="trade-exit-price"
                  required
                  error={errors.exitPrice?.message}
                >
                  <Input
                    id="trade-exit-price"
                    type="number"
                    step="any"
                    inputMode="decimal"
                    placeholder="21892.00"
                    {...register('exitPrice', { valueAsNumber: true })}
                    aria-invalid={Boolean(errors.exitPrice)}
                  />
                </Field>
                <Field
                  label="Size"
                  htmlFor="trade-size"
                  required
                  error={errors.lotSize?.message}
                >
                  <Input
                    id="trade-size"
                    type="number"
                    step="any"
                    inputMode="decimal"
                    suffix="lots"
                    {...register('lotSize', { valueAsNumber: true })}
                    aria-invalid={Boolean(errors.lotSize)}
                  />
                </Field>
                <Field
                  label="Risk amount"
                  htmlFor="trade-risk"
                  required
                  error={errors.riskAmount?.message}
                >
                  <Input
                    id="trade-risk"
                    type="number"
                    step="any"
                    inputMode="decimal"
                    prefix="$"
                    {...register('riskAmount', { valueAsNumber: true })}
                    aria-invalid={Boolean(errors.riskAmount)}
                  />
                </Field>
                <Field
                  label="Net P&L"
                  htmlFor="trade-pnl"
                  required
                  error={errors.realizedPnL?.message}
                  className="col-span-2"
                >
                  <Input
                    id="trade-pnl"
                    type="number"
                    step="any"
                    inputMode="decimal"
                    prefix="$"
                    placeholder="320.00 or -180.00"
                    className={cn(
                      Number(realizedPnL) > 0 && 'border-positive/30',
                      Number(realizedPnL) < 0 && 'border-negative/30',
                    )}
                    {...register('realizedPnL', { valueAsNumber: true })}
                    aria-invalid={Boolean(errors.realizedPnL)}
                  />
                </Field>
              </div>
            </FormSection>

            <FormSection
              icon={<ShieldCheck className="h-3 w-3" />}
              title="Review"
              description="The part that compounds"
            >
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Setup tags" htmlFor="trade-setups">
                    <TagInput
                      value={setupTags}
                      onChange={setSetupTags}
                      suggestions={SETUP_SUGGESTIONS}
                      placeholder="Add a setup…"
                    />
                  </Field>
                  <Field label="Mistakes" htmlFor="trade-mistakes">
                    <TagInput
                      value={mistakes}
                      onChange={setMistakes}
                      suggestions={MISTAKE_SUGGESTIONS}
                      placeholder="Tag execution errors…"
                      tone="negative"
                    />
                  </Field>
                </div>

                <div className="grid gap-4 rounded-xl border border-line bg-white/[0.015] p-3.5 sm:grid-cols-2">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-medium text-muted">
                        Discipline rating
                      </p>
                      <p className="mt-0.5 text-[10px] text-faint">
                        How well did you execute?
                      </p>
                    </div>
                    <Rating value={discipline} onChange={setDiscipline} />
                  </div>
                  <div className="flex items-center justify-between gap-3 border-t border-line/70 pt-3 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
                    <div>
                      <p className="text-[11px] font-medium text-muted">
                        Followed plan
                      </p>
                      <p className="mt-0.5 text-[10px] text-faint">
                        No rule-breaking on this one
                      </p>
                    </div>
                    <Switch
                      checked={followedPlan}
                      onCheckedChange={setFollowedPlan}
                      aria-label="Followed trading plan"
                    />
                  </div>
                </div>

                <Field label="Notes" htmlFor="trade-notes">
                  <Textarea
                    id="trade-notes"
                    placeholder="What was the thesis? What did you see? What would you repeat — or remove?"
                    {...register('notes')}
                  />
                </Field>
              </div>
            </FormSection>

            <FormSection
              icon={<ImageIcon className="h-3 w-3" />}
              title="Chart screenshots"
              description="Stored locally with this trade"
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <ImageField
                  label="Pre-trade"
                  value={preImage}
                  onChange={setPreImage}
                  hint="Before entry"
                />
                <ImageField
                  label="Post-trade"
                  value={postImage}
                  onChange={setPostImage}
                  hint="After exit"
                />
              </div>
            </FormSection>
          </div>

          <div className="flex shrink-0 flex-col gap-3 border-t border-line bg-panel px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex items-center gap-2.5">
              <Badge variant={statusVariant[previewStatus]} dot>
                {previewStatus}
              </Badge>
              <span className="num text-[11px] text-faint">
                R preview{' '}
                <span
                  className={cn(
                    'font-medium',
                    previewR > 0
                      ? 'text-positive'
                      : previewR < 0
                        ? 'text-negative'
                        : 'text-muted',
                  )}
                >
                  {formatR(previewR)}
                </span>
              </span>
              <span className="hidden text-[11px] text-faint sm:inline">
                · {formatSignedCurrency(Number(realizedPnL) || 0, settings.currency)}
              </span>
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button variant="ghost" onClick={closeTradeForm} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={isSubmitting}
                icon={isSubmitting ? undefined : <Check className="h-4 w-4" />}
              >
                {editingTrade ? 'Save changes' : 'Add trade'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
