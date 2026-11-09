import { useMemo, useState } from 'react'
import {
  BadgeCheck,
  Check,
  CircleQuestionMark,
  ListChecks,
  ShieldCheck,
  Sparkles,
  Target,
  TriangleExclamationPoint,
} from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { RangeTabs } from '@/components/shared/RangeTabs'
import { Badge } from '@/components/ui/Badge'
import { Card, CardHeader } from '@/components/ui/Card'
import { Meter } from '@/components/ui/Meter'
import {
  computeMetrics,
  filterByRange,
  tagPerformance,
} from '@/lib/analytics'
import { MISTAKE_SUGGESTIONS, SETUP_SUGGESTIONS } from '@/lib/constants'
import {
  cn,
  formatPercent,
  formatR,
  formatSignedCurrency,
  pnlTone,
  toneText,
} from '@/lib/utils'
import { useJournalStore } from '@/store/useJournalStore'
import { useUIStore } from '@/store/useUIStore'

const SETUP_NOTES: Record<string, string> = {
  '4H Wick': 'Higher-timeframe rejection into a liquidity pocket. Wait for displacement.',
  '5m MSS': 'Market structure shift after a sweep. Enter on the retest, not the break.',
  FVG: 'Fair value gap continuation. Trade in the direction of the higher-timeframe draw.',
  'PDH Sweep': 'Previous day high/low sweep, then reversal with confirmation.',
  'Order Block': 'Last down/up candle before displacement. Demand or supply with reaction.',
  'Liquidity Grab': 'Stop run through an obvious level with a fast rejection.',
  'Trend Continuation': 'Pullback into structure within a clean trend. Buy the discount.',
  'Range Reversal': 'Edge-of-range rejection with momentum divergence. Lower conviction.',
  'Opening Drive': 'First-hour momentum with a clean opening range break.',
  'VWAP Reclaim': 'Reclaim of VWAP after a failed break. Needs volume confirmation.',
}

const CHECKLIST = [
  'Higher-timeframe bias is clear',
  'Liquidity has been swept',
  'Entry is from a planned level, not a chase',
  'Stop is beyond invalidation, not a dollar amount',
  'Target has at least 2R of room',
  'Risk is within the daily limit',
  'No high-impact news in the next 30 minutes',
  'I accept the loss before I click',
]

const RULES = [
  {
    title: 'Risk first',
    body: 'Cap risk per trade at 0.5–1% of the account. The stop defines size — never the other way around.',
  },
  {
    title: 'One model',
    body: 'Only take setups that appear in this playbook. If it is not written down, it is not a trade.',
  },
  {
    title: 'Two losses, stop',
    body: 'After two full losses in a session, close the platform. Protect the mental capital.',
  },
  {
    title: 'Journal immediately',
    body: 'Screenshot before and after. Tag the setup and the mistake while it is still honest.',
  },
]

function gradeFor(winRate: number, avgR: number, trades: number) {
  if (trades < 3) return { label: 'Building sample', variant: 'outline' as const }
  if (avgR > 0.6 && winRate >= 55)
    return { label: 'A+ model', variant: 'positive' as const }
  if (avgR > 0.15) return { label: 'Solid edge', variant: 'brand' as const }
  return { label: 'Needs work', variant: 'warning' as const }
}

export function PlaybookPage() {
  const trades = useJournalStore((state) => state.trades)
  const settings = useJournalStore((state) => state.settings)
  const range = useUIStore((state) => state.range)
  const setRange = useUIStore((state) => state.setRange)
  const [checked, setChecked] = useState<Record<string, boolean>>({})

  const scoped = useMemo(() => filterByRange(trades, range), [trades, range])
  const metrics = useMemo(() => computeMetrics(scoped), [scoped])
  const setups = useMemo(() => tagPerformance(scoped, 'setupTags'), [scoped])
  const setupMap = useMemo(
    () => new Map(setups.map((setup) => [setup.key, setup])),
    [setups],
  )

  const bestSetup = setups[0] ?? null
  const totalChecks = CHECKLIST.length
  const completed = CHECKLIST.filter((item) => checked[item]).length

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Playbook"
        title="Write the rules. Trade the rules."
        description="Your setups, checklist and non-negotiables — with live performance attached."
        actions={<RangeTabs value={range} onChange={setRange} />}
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="relative overflow-hidden xl:col-span-2">
          <div className="absolute inset-0 bg-dots opacity-[0.35]" />
          <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-brand/[0.07] blur-3xl" />
          <div className="relative p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <Badge variant="brand" dot>
                A+ model
              </Badge>
              <span className="text-[10px] text-faint">
                {metrics.totalTrades} trades reviewed in range
              </span>
            </div>
            <h2 className="mt-3 max-w-lg font-display text-[24px] font-semibold leading-tight tracking-[-0.03em] text-ink sm:text-[28px]">
              {bestSetup
                ? `${bestSetup.key} is carrying the book.`
                : 'The playbook is waiting for its first entry.'}
            </h2>
            <p className="mt-2 max-w-xl text-[12px] leading-relaxed text-muted">
              {bestSetup
                ? `Across ${bestSetup.totalTrades} trades this setup produced ${formatSignedCurrency(bestSetup.netPnl, settings.currency)} at a ${formatPercent(bestSetup.winRate)} win rate. Keep the entry criteria tight and size up only when the checklist is fully green.`
                : 'Log trades with setup tags and the playbook will rank each model by real contribution — not how it feels.'}
            </p>
            <div className="mt-5 grid grid-cols-3 gap-2">
              <div className="rounded-xl border border-line/80 bg-panel/60 px-3 py-2.5">
                <p className="text-[9px] uppercase tracking-[0.14em] text-faint">Plan followed</p>
                <p className="num mt-1.5 text-[14px] font-semibold text-ink">
                  {formatPercent(metrics.planFollowedRate)}
                </p>
              </div>
              <div className="rounded-xl border border-line/80 bg-panel/60 px-3 py-2.5">
                <p className="text-[9px] uppercase tracking-[0.14em] text-faint">Avg R</p>
                <p className={cn('num mt-1.5 text-[14px] font-semibold', toneText(pnlTone(metrics.avgR)))}>
                  {formatR(metrics.avgR)}
                </p>
              </div>
              <div className="rounded-xl border border-line/80 bg-panel/60 px-3 py-2.5">
                <p className="text-[9px] uppercase tracking-[0.14em] text-faint">Avg discipline</p>
                <p className="num mt-1.5 text-[14px] font-semibold text-ink">
                  {metrics.avgDiscipline.toFixed(1)} / 5
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader
            title="Pre-trade checklist"
            subtitle={`${completed} of ${totalChecks} complete`}
            icon={<ListChecks className="h-4 w-4" />}
            action={
              completed === totalChecks ? (
                <Badge variant="positive" dot>
                  Ready
                </Badge>
              ) : null
            }
          />
          <div className="px-4 pb-4">
            <div className="space-y-1.5 pt-1">
              {CHECKLIST.map((item) => {
                const isChecked = Boolean(checked[item])
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() =>
                      setChecked((state) => ({ ...state, [item]: !state[item] }))
                    }
                    className={cn(
                      'focus-ring flex w-full items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left text-[11px] transition',
                      isChecked
                        ? 'border-positive/20 bg-positive/[0.045] text-muted'
                        : 'border-transparent text-muted hover:bg-white/[0.03]',
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition',
                        isChecked
                          ? 'border-positive bg-positive text-brand-ink'
                          : 'border-line-strong bg-inset',
                      )}
                    >
                      {isChecked ? <Check className="h-2.5 w-2.5" /> : null}
                    </span>
                    <span className={cn('leading-snug', isChecked && 'line-through opacity-70')}>
                      {item}
                    </span>
                  </button>
                )
              })}
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-line/70 pt-3 text-[9.5px] text-faint">
              <span>Do not trade until every box is green.</span>
              <span className="num">{formatPercent((completed / totalChecks) * 100)}</span>
            </div>
            <Meter
              className="mt-1.5"
              height="xs"
              value={(completed / totalChecks) * 100}
              color={completed === totalChecks ? 'positive' : 'brand'}
            />
          </div>
        </Card>
      </div>

      <div>
        <div className="mb-2.5 flex items-center justify-between">
          <h2 className="font-display text-sm font-semibold text-ink">Setup library</h2>
          <span className="text-[10px] text-faint">
            Tagged performance · {scoped.length} trades
          </span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {SETUP_SUGGESTIONS.map((setupName) => {
            const setup = setupMap.get(setupName)
            const grade = gradeFor(
              setup?.winRate ?? 0,
              setup?.avgR ?? 0,
              setup?.totalTrades ?? 0,
            )
            return (
              <Card key={setupName} className="card-hover overflow-hidden p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-white/[0.025] text-muted">
                      <Target className="h-3.5 w-3.5" />
                    </span>
                    <div>
                      <h3 className="font-display text-[13px] font-semibold text-ink">
                        {setupName}
                      </h3>
                      <p className="text-[10px] text-faint">
                        {setup ? `${setup.totalTrades} trades` : 'No sample yet'}
                      </p>
                    </div>
                  </div>
                  <Badge variant={grade.variant}>{grade.label}</Badge>
                </div>
                <p className="mt-3 min-h-[32px] text-[10.5px] leading-relaxed text-faint">
                  {SETUP_NOTES[setupName] ?? 'Document the entry criteria here.'}
                </p>
                <div className="mt-3 grid grid-cols-3 gap-2 border-t border-line/60 pt-3">
                  <div>
                    <p className="text-[8.5px] uppercase tracking-[0.12em] text-faint">Net</p>
                    <p
                      className={cn(
                        'num mt-1 text-[11px] font-semibold',
                        setup ? toneText(pnlTone(setup.netPnl)) : 'text-faint',
                      )}
                    >
                      {setup
                        ? formatSignedCurrency(setup.netPnl, settings.currency)
                        : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[8.5px] uppercase tracking-[0.12em] text-faint">Win</p>
                    <p className="num mt-1 text-[11px] font-semibold text-ink">
                      {setup ? formatPercent(setup.winRate) : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[8.5px] uppercase tracking-[0.12em] text-faint">Avg R</p>
                    <p
                      className={cn(
                        'num mt-1 text-[11px] font-semibold',
                        setup ? toneText(pnlTone(setup.avgR)) : 'text-faint',
                      )}
                    >
                      {setup ? formatR(setup.avgR) : '—'}
                    </p>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="overflow-hidden">
          <CardHeader
            title="Non-negotiables"
            subtitle="The rules that keep the account alive"
            icon={<ShieldCheck className="h-4 w-4" />}
          />
          <div className="divide-y divide-line/60 px-4 pb-2">
            {RULES.map((rule, index) => (
              <div key={rule.title} className="flex gap-3 py-3">
                <span className="num flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-line bg-white/[0.02] text-[10px] font-semibold text-brand">
                  {index + 1}
                </span>
                <div>
                  <p className="text-[11.5px] font-medium text-ink">{rule.title}</p>
                  <p className="mt-1 text-[10.5px] leading-relaxed text-faint">{rule.body}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader
            title="Mistake library"
            subtitle="Name it to remove it"
            icon={<TriangleExclamationPoint className="h-4 w-4" />}
          />
          <div className="flex flex-wrap gap-1.5 p-4 pt-2">
            {MISTAKE_SUGGESTIONS.map((mistake) => {
              const cost = tagPerformance(scoped, 'mistakes').find(
                (entry) => entry.key === mistake,
              )
              return (
                <span
                  key={mistake}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-[10px]',
                    cost && cost.totalTrades > 0
                      ? 'border-negative/20 bg-negative/[0.055] text-negative'
                      : 'border-line bg-white/[0.02] text-faint',
                  )}
                >
                  {mistake}
                  {cost && cost.totalTrades > 0 ? (
                    <span className="num opacity-70">{cost.totalTrades}</span>
                  ) : null}
                </span>
              )
            })}
          </div>
          <div className="mx-4 mb-4 rounded-xl border border-line/80 bg-white/[0.015] p-3">
            <p className="flex items-center gap-1.5 text-[10px] font-medium text-muted">
              <CircleQuestionMark className="h-3 w-3" />
              Review prompt
            </p>
            <p className="mt-1 text-[10.5px] leading-relaxed text-faint">
              After every red day, pick one mistake from this list and write the exact
              trigger that caused it. Next session, design one guardrail around it.
            </p>
          </div>
        </Card>
      </div>

      <div className="flex flex-col items-start justify-between gap-3 rounded-xl border border-brand/15 bg-brand/[0.035] px-4 py-3.5 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-brand/20 bg-brand/10 text-brand">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[11.5px] font-medium text-ink">
              Your best setup is only as good as your worst execution.
            </p>
            <p className="text-[10px] text-faint">
              {bestSetup
                ? `${bestSetup.key} contributes ${formatSignedCurrency(bestSetup.netPnl, settings.currency)} in this range. Protect it with process.`
                : 'Tag your setups to start building edge data.'}
            </p>
          </div>
        </div>
        <Badge variant="brand" className="shrink-0">
          <BadgeCheck className="h-3 w-3" />
          Review weekly
        </Badge>
      </div>
    </div>
  )
}
