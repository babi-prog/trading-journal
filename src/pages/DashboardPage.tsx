import { useMemo } from 'react'
import {
  ArrowDownRight,
  ArrowUpRight,
  ChartNoAxesCombined,
  CircleDollarSign,
  Crosshair,
  Flame,
  Gauge,
  Percent,
  Plus,
  Target,
  TrendingDown,
  Trophy,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  axisTickStyle,
  chartAxisStroke,
  chartGridStroke,
  chartTooltipItemStyle,
  chartTooltipLabelStyle,
  chartTooltipStyle,
} from '@/components/charts/chartTheme'
import { PageHeader } from '@/components/shared/PageHeader'
import { RangeTabs } from '@/components/shared/RangeTabs'
import { StatCard } from '@/components/shared/StatCard'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Meter } from '@/components/ui/Meter'
import { Rating } from '@/components/ui/Rating'
import {
  bestAndWorstDays,
  buildEquitySeries,
  computeMetrics,
  filterByRange,
  performanceBySession,
  tagPerformance,
} from '@/lib/analytics'
import { SESSION_META } from '@/lib/constants'
import {
  cn,
  formatCurrency,
  formatDateLong,
  formatDayShort,
  formatPercent,
  formatR,
  formatSignedCurrency,
  getPreviousBounds,
  isInBounds,
  pnlTone,
  toneText,
  to12Hour,
} from '@/lib/utils'
import { useJournalStore } from '@/store/useJournalStore'
import { useUIStore } from '@/store/useUIStore'

export function DashboardPage() {
  const trades = useJournalStore((state) => state.trades)
  const settings = useJournalStore((state) => state.settings)
  const range = useUIStore((state) => state.range)
  const setRange = useUIStore((state) => state.setRange)
  const openTradeForm = useUIStore((state) => state.openTradeForm)
  const openTradeDetail = useUIStore((state) => state.openTradeDetail)

  const scoped = useMemo(() => filterByRange(trades, range), [trades, range])
  const metrics = useMemo(
    () => computeMetrics(scoped, settings.startingBalance),
    [scoped, settings.startingBalance],
  )
  const previous = useMemo(() => {
    const bounds = getPreviousBounds(range)
    if (!bounds) return null
    return trades.filter((trade) => isInBounds(trade.date, bounds))
  }, [trades, range])
  const previousMetrics = useMemo(
    () => (previous ? computeMetrics(previous, settings.startingBalance) : null),
    [previous, settings.startingBalance],
  )
  const equity = useMemo(
    () => buildEquitySeries(scoped, settings.startingBalance),
    [scoped, settings.startingBalance],
  )
  const sessions = useMemo(() => performanceBySession(scoped), [scoped])
  const setups = useMemo(
    () => tagPerformance(scoped, 'setupTags').slice(0, 5),
    [scoped],
  )
  const dayStats = useMemo(() => bestAndWorstDays(scoped), [scoped])
  const recent = useMemo(() => scoped.slice(0, 6), [scoped])

  const equityDomain = useMemo(() => {
    if (equity.length === 0) return [0, 1]
    const values = equity.map((point) => point.equity)
    const min = Math.min(...values)
    const max = Math.max(...values)
    const pad = Math.max((max - min) * 0.12, 200)
    return [min - pad, max + pad]
  }, [equity])

  const bestSession = useMemo(
    () => [...sessions].sort((a, b) => b.netPnl - a.netPnl)[0] ?? null,
    [sessions],
  )
  const topSetup = setups[0] ?? null
  const equityColor =
    metrics.netPnl >= 0 ? '#3ddc97' : '#fb7185'

  const delta = previousMetrics
    ? {
        value: formatSignedCurrency(
          metrics.netPnl - previousMetrics.netPnl,
          settings.currency,
        ),
        positive: metrics.netPnl >= previousMetrics.netPnl,
        label: 'vs previous period',
      }
    : null

  const hasTrades = trades.length > 0
  const hasScoped = scoped.length > 0

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Dashboard"
        title="Your edge, in focus."
        description="A live read on consistency, risk and execution — measured over the range you choose."
        actions={
          <>
            <RangeTabs value={range} onChange={setRange} />
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

      {!hasTrades ? (
        <Card>
          <EmptyState
            icon={<ChartNoAxesCombined className="h-5 w-5" />}
            title="Your journal is ready"
            description="Log your first trade to unlock equity curves, session edge and setup performance."
            action={
              <Button
                variant="primary"
                icon={<Plus className="h-4 w-4" />}
                onClick={() => openTradeForm()}
              >
                Log your first trade
              </Button>
            }
          />
        </Card>
      ) : !hasScoped ? (
        <Card>
          <EmptyState
            icon={<SearchEmpty />}
            title="No trades in this range"
            description="Try a wider range or log a new trade to keep the journal current."
            action={
              <Button variant="secondary" onClick={() => setRange('all')}>
                Show all time
              </Button>
            }
          />
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Net P&L"
              value={
                <span className={toneText(pnlTone(metrics.netPnl))}>
                  {formatSignedCurrency(metrics.netPnl, settings.currency)}
                </span>
              }
              icon={<CircleDollarSign className="h-4 w-4" />}
              delta={delta}
              sparkline={equity.map((point) => point.equity)}
              sparklineClassName={
                metrics.netPnl >= 0 ? 'text-positive' : 'text-negative'
              }
            />
            <StatCard
              label="Win rate"
              value={formatPercent(metrics.winRate, 1)}
              icon={<Percent className="h-4 w-4" />}
              sub={`${metrics.wins}W · ${metrics.losses}L · ${metrics.breakEven}BE`}
            />
            <StatCard
              label="Profit factor"
              value={
                Number.isFinite(metrics.profitFactor)
                  ? metrics.profitFactor.toFixed(2)
                  : '∞'
              }
              icon={<Gauge className="h-4 w-4" />}
              sub={`${metrics.totalTrades} trades · ${metrics.tradingDays} days`}
            />
            <StatCard
              label="Expectancy / trade"
              value={formatSignedCurrency(metrics.expectancy, settings.currency)}
              icon={<Target className="h-4 w-4" />}
              valueClassName={toneText(pnlTone(metrics.expectancy))}
              sub={`Avg ${formatR(metrics.avgR)} · PF ${Number.isFinite(metrics.profitFactor) ? metrics.profitFactor.toFixed(2) : '∞'}`}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <Card className="overflow-hidden xl:col-span-2">
              <CardHeader
                title="Equity curve"
                subtitle={`Starting balance ${formatCurrency(settings.startingBalance, settings.currency)} · ${scoped.length} trades`}
                icon={<ChartNoAxesCombined className="h-4 w-4" />}
                action={
                  <div className="flex items-center gap-2">
                    <Badge variant={metrics.netPnl >= 0 ? 'positive' : 'negative'} dot>
                      {formatSignedCurrency(metrics.netPnl, settings.currency)}
                    </Badge>
                  </div>
                }
              />
              <div className="mt-4 h-[280px] w-full px-2 pb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={equity}
                    margin={{ top: 16, right: 22, bottom: 4, left: 4 }}
                  >
                    <defs>
                      <linearGradient id="equityFill" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="0%"
                          stopColor={equityColor}
                          stopOpacity={0.28}
                        />
                        <stop
                          offset="100%"
                          stopColor={equityColor}
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 6"
                      stroke={chartGridStroke}
                      vertical={false}
                    />
                    <XAxis
                      dataKey="label"
                      tick={axisTickStyle}
                      tickLine={false}
                      axisLine={{ stroke: chartAxisStroke }}
                      minTickGap={28}
                      dy={6}
                    />
                    <YAxis
                      domain={equityDomain}
                      tick={axisTickStyle}
                      tickLine={false}
                      axisLine={false}
                      width={58}
                      tickFormatter={(value: number) =>
                        new Intl.NumberFormat('en-US', {
                          notation: 'compact',
                          maximumFractionDigits: 1,
                        }).format(value)
                      }
                    />
                    <Tooltip
                      contentStyle={chartTooltipStyle}
                      labelStyle={chartTooltipLabelStyle}
                      itemStyle={chartTooltipItemStyle}
                      formatter={(value) => [
                        formatSignedCurrency(Number(value), settings.currency),
                        'Equity',
                      ]}
                      labelFormatter={(label) => String(label)}
                    />
                    <Area
                      type="monotone"
                      dataKey="equity"
                      stroke={equityColor}
                      strokeWidth={2}
                      fill="url(#equityFill)"
                      activeDot={{ r: 3.5, strokeWidth: 0 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader
                title="Execution discipline"
                subtitle="The habits behind the numbers"
                icon={<Flame className="h-4 w-4" />}
              />
              <div className="space-y-4 p-5">
                <div>
                  <div className="mb-1.5 flex items-center justify-between text-[11px]">
                    <span className="text-muted">Followed plan</span>
                    <span className="num font-medium text-ink">
                      {formatPercent(metrics.planFollowedRate)}
                    </span>
                  </div>
                  <Meter
                    value={metrics.planFollowedRate}
                    color={metrics.planFollowedRate >= 70 ? 'positive' : 'negative'}
                  />
                </div>
                <div>
                  <div className="mb-1.5 flex items-center justify-between text-[11px]">
                    <span className="text-muted">Avg discipline</span>
                    <Rating value={Math.round(metrics.avgDiscipline)} readOnly size="sm" />
                  </div>
                  <Meter
                    value={(metrics.avgDiscipline / 5) * 100}
                    color="brand"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="rounded-xl border border-line/80 bg-white/[0.015] px-3 py-2.5">
                    <p className="text-[9px] uppercase tracking-[0.14em] text-faint">Best day</p>
                    <p className="num mt-1.5 text-[13px] font-semibold text-positive">
                      {dayStats.best
                        ? formatSignedCurrency(dayStats.best.pnl, settings.currency)
                        : '—'}
                    </p>
                    <p className="mt-0.5 text-[10px] text-faint">
                      {dayStats.best ? formatDayShort(dayStats.best.date) : 'No data'}
                    </p>
                  </div>
                  <div className="rounded-xl border border-line/80 bg-white/[0.015] px-3 py-2.5">
                    <p className="text-[9px] uppercase tracking-[0.14em] text-faint">Worst day</p>
                    <p className="num mt-1.5 text-[13px] font-semibold text-negative">
                      {dayStats.worst
                        ? formatSignedCurrency(dayStats.worst.pnl, settings.currency)
                        : '—'}
                    </p>
                    <p className="mt-0.5 text-[10px] text-faint">
                      {dayStats.worst ? formatDayShort(dayStats.worst.date) : 'No data'}
                    </p>
                  </div>
                </div>
                <div className="rounded-xl border border-line/80 bg-white/[0.015] p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-[0.14em] text-faint">
                      Max drawdown
                    </span>
                    <span className="num text-[11px] font-medium text-negative">
                      {formatSignedCurrency(-metrics.maxDrawdown, settings.currency)}
                    </span>
                  </div>
                  <Meter className="mt-2" value={metrics.maxDrawdownPct} color="negative" height="xs" />
                </div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
            <Card className="overflow-hidden lg:col-span-3">
              <CardHeader
                title="Session edge"
                subtitle="Where your process actually pays"
                icon={<Crosshair className="h-4 w-4" />}
                action={
                  bestSession ? (
                    <Badge variant="brand">
                      Best: {bestSession.key}
                    </Badge>
                  ) : null
                }
              />
              <div className="h-[240px] w-full px-2 pb-4 pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={sessions}
                    margin={{ top: 12, right: 18, bottom: 4, left: 4 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 6"
                      stroke={chartGridStroke}
                      vertical={false}
                    />
                    <XAxis
                      dataKey="key"
                      tick={axisTickStyle}
                      tickLine={false}
                      axisLine={{ stroke: chartAxisStroke }}
                      dy={6}
                    />
                    <YAxis
                      tick={axisTickStyle}
                      tickLine={false}
                      axisLine={false}
                      width={52}
                      tickFormatter={(value: number) =>
                        new Intl.NumberFormat('en-US', {
                          notation: 'compact',
                          maximumFractionDigits: 1,
                        }).format(value)
                      }
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                      contentStyle={chartTooltipStyle}
                      labelStyle={chartTooltipLabelStyle}
                      itemStyle={chartTooltipItemStyle}
                      formatter={(value) => [
                        formatSignedCurrency(Number(value), settings.currency),
                        'Net P&L',
                      ]}
                    />
                    <Bar dataKey="netPnl" radius={[6, 6, 3, 3]} maxBarSize={46}>
                      {sessions.map((session) => (
                        <Cell
                          key={session.key}
                          fill={
                            session.netPnl >= 0
                              ? SESSION_META[session.key as keyof typeof SESSION_META]?.color ??
                                '#3ddc97'
                              : '#fb7185'
                          }
                          fillOpacity={0.82}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 border-t border-line/70 px-4 py-3 sm:grid-cols-4">
                {sessions.map((session) => (
                  <div key={session.key} className="min-w-0">
                    <p className="flex items-center gap-1.5 text-[10px] font-medium text-muted">
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{
                          background:
                            SESSION_META[session.key as keyof typeof SESSION_META]?.color,
                        }}
                      />
                      {session.key}
                    </p>
                    <p
                      className={cn(
                        'num mt-1 text-[11px] font-semibold',
                        toneText(pnlTone(session.netPnl)),
                      )}
                    >
                      {session.totalTrades
                        ? formatSignedCurrency(session.netPnl, settings.currency)
                        : '—'}
                    </p>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="overflow-hidden lg:col-span-2">
              <CardHeader
                title="Top setups"
                subtitle="Highest net contribution"
                icon={<Trophy className="h-4 w-4" />}
              />
              <div className="divide-y divide-line/60 px-4 pb-2">
                {setups.map((setup, index) => (
                  <div
                    key={setup.key}
                    className="flex items-center gap-3 py-3"
                  >
                    <span className="num flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-line bg-white/[0.02] text-[10px] font-semibold text-faint">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11.5px] font-medium text-ink">
                        {setup.key}
                      </p>
                      <p className="mt-0.5 text-[10px] text-faint">
                        {setup.totalTrades} trades · {formatPercent(setup.winRate)} win
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={cn(
                          'num text-[11.5px] font-semibold',
                          toneText(pnlTone(setup.netPnl)),
                        )}
                      >
                        {formatSignedCurrency(setup.netPnl, settings.currency)}
                      </p>
                      <p className="num mt-0.5 text-[10px] text-faint">
                        {formatR(setup.avgR)} avg
                      </p>
                    </div>
                  </div>
                ))}
                {setups.length === 0 ? (
                  <p className="py-8 text-center text-[11px] text-faint">
                    Tag setups on your trades to see this breakdown.
                  </p>
                ) : null}
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <Card className="overflow-hidden xl:col-span-2">
              <CardHeader
                title="Recent trades"
                subtitle="Latest entries in this range"
                icon={<ChartNoAxesCombined className="h-4 w-4" />}
                action={
                  <Link
                    to="/trades"
                    className="focus-ring inline-flex h-8 items-center justify-center rounded-lg px-3 text-xs font-medium text-muted transition hover:bg-white/[0.05] hover:text-ink"
                  >
                    View all
                  </Link>
                }
              />
              <div className="mt-1 divide-y divide-line/60 px-2 pb-2">
                {recent.map((trade) => (
                  <button
                    key={trade.id}
                    type="button"
                    onClick={() => openTradeDetail(trade.id)}
                    className="focus-ring flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left transition hover:bg-white/[0.025]"
                  >
                    <span
                      className={cn(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border',
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
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1.5 truncate text-[12px] font-medium text-ink">
                        {trade.instrument}
                        <span className="text-[10px] font-normal text-faint">
                          {trade.session}
                        </span>
                      </p>
                      <p className="mt-0.5 truncate text-[10px] text-faint">
                        {formatDateLong(trade.date)} · {to12Hour(trade.entryTime)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={cn(
                          'num text-[12px] font-semibold',
                          toneText(pnlTone(trade.realizedPnL)),
                        )}
                      >
                        {formatSignedCurrency(trade.realizedPnL, settings.currency)}
                      </p>
                      <p className="num mt-0.5 text-[10px] text-faint">
                        {formatR(trade.rMultiple)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader
                title="Momentum"
                subtitle="Streaks & averages"
                icon={<Flame className="h-4 w-4" />}
              />
              <div className="space-y-3 p-5">
                <div className="flex items-center justify-between rounded-xl border border-line/80 bg-white/[0.015] px-3.5 py-3">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-brand/20 bg-brand/10 text-brand">
                      <Flame className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.12em] text-faint">Current streak</p>
                      <p className="mt-0.5 text-[11px] text-ink">
                        {metrics.currentStreak
                          ? `${metrics.currentStreak.count} ${metrics.currentStreak.status}`
                          : 'No trades'}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      metrics.currentStreak?.status === 'Win'
                        ? 'positive'
                        : metrics.currentStreak?.status === 'Loss'
                          ? 'negative'
                          : 'neutral'
                    }
                  >
                    {metrics.currentStreak?.status ?? '—'}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl border border-line/80 bg-white/[0.015] px-3 py-2.5">
                    <p className="text-[9px] uppercase tracking-[0.14em] text-faint">Avg win</p>
                    <p className="num mt-1.5 text-[13px] font-semibold text-positive">
                      {formatSignedCurrency(metrics.avgWin, settings.currency)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-line/80 bg-white/[0.015] px-3 py-2.5">
                    <p className="text-[9px] uppercase tracking-[0.14em] text-faint">Avg loss</p>
                    <p className="num mt-1.5 text-[13px] font-semibold text-negative">
                      {formatSignedCurrency(metrics.avgLoss, settings.currency)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-line/80 bg-white/[0.015] px-3 py-2.5">
                    <p className="text-[9px] uppercase tracking-[0.14em] text-faint">Best win streak</p>
                    <p className="num mt-1.5 text-[13px] font-semibold text-ink">
                      {metrics.bestWinStreak}
                    </p>
                  </div>
                  <div className="rounded-xl border border-line/80 bg-white/[0.015] px-3 py-2.5">
                    <p className="text-[9px] uppercase tracking-[0.14em] text-faint">Worst streak</p>
                    <p className="num mt-1.5 text-[13px] font-semibold text-ink">
                      {metrics.worstLossStreak}
                    </p>
                  </div>
                </div>
                {topSetup ? (
                  <div className="rounded-xl border border-brand/15 bg-brand/[0.045] px-3.5 py-3">
                    <p className="text-[9px] uppercase tracking-[0.14em] text-brand/80">Top setup</p>
                    <p className="mt-1 text-[12px] font-medium text-ink">{topSetup.key}</p>
                    <p className="mt-0.5 text-[10px] text-muted">
                      {formatPercent(topSetup.winRate)} win rate · {topSetup.totalTrades} trades
                    </p>
                  </div>
                ) : null}
              </div>
            </Card>
          </div>

          {metrics.totalTrades > 0 ? (
            <div className="flex flex-col gap-2 rounded-xl border border-line/70 bg-white/[0.012] px-4 py-3 text-[11px] text-muted sm:flex-row sm:items-center sm:justify-between">
              <span className="flex items-center gap-2">
                <TrendingDown className="h-3.5 w-3.5 text-faint" />
                Largest loss {formatSignedCurrency(metrics.largestLoss, settings.currency)} · Largest win{' '}
                {formatSignedCurrency(metrics.largestWin, settings.currency)}
              </span>
              <span className="flex items-center gap-1.5 text-faint">
                <span className="h-1.5 w-1.5 rounded-full bg-positive" />
                {metrics.tradingDays} active trading days in range
              </span>
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}

function SearchEmpty() {
  return <Target className="h-5 w-5" />
}
