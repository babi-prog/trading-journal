import { useMemo } from 'react'
import {
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
import { Card, CardHeader } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Meter } from '@/components/ui/Meter'
import {
  computeMetrics,
  disciplineDistribution,
  filterByRange,
  performanceByInstrument,
  performanceByWeekday,
  planFollowedSplit,
  rDistribution,
  tagPerformance,
} from '@/lib/analytics'
import {
  cn,
  formatNumber,
  formatPercent,
  formatR,
  formatSignedCurrency,
  pnlTone,
  toneText,
} from '@/lib/utils'
import { useJournalStore } from '@/store/useJournalStore'
import { useUIStore } from '@/store/useUIStore'
import { ChartNoAxesCombined } from 'lucide-react'

function PerfTable({
  title,
  subtitle,
  rows,
  currency,
}: {
  title: string
  subtitle: string
  rows: { key: string; totalTrades: number; winRate: number; netPnl: number; avgR: number }[]
  currency: string
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader
        title={title}
        subtitle={subtitle}
        icon={<ChartNoAxesCombined className="h-4 w-4" />}
      />
      <div className="mt-1 overflow-x-auto">
        <table className="w-full min-w-[420px] border-collapse text-left">
          <thead>
            <tr className="border-y border-line/70 bg-white/[0.012]">
              <th className="px-4 py-2 text-[9.5px] font-semibold uppercase tracking-[0.13em] text-faint">
                Group
              </th>
              <th className="px-3 py-2 text-right text-[9.5px] font-semibold uppercase tracking-[0.13em] text-faint">
                Trades
              </th>
              <th className="px-3 py-2 text-right text-[9.5px] font-semibold uppercase tracking-[0.13em] text-faint">
                Win
              </th>
              <th className="px-3 py-2 text-right text-[9.5px] font-semibold uppercase tracking-[0.13em] text-faint">
                Avg R
              </th>
              <th className="px-4 py-2 text-right text-[9.5px] font-semibold uppercase tracking-[0.13em] text-faint">
                Net P&L
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key} className="border-b border-line/50 last:border-0">
                <td className="px-4 py-2.5 text-[11.5px] font-medium text-ink">
                  {row.key}
                </td>
                <td className="num px-3 py-2.5 text-right text-[11px] text-muted">
                  {row.totalTrades}
                </td>
                <td className="num px-3 py-2.5 text-right text-[11px] text-muted">
                  {formatPercent(row.winRate)}
                </td>
                <td
                  className={cn(
                    'num px-3 py-2.5 text-right text-[11px] font-medium',
                    toneText(pnlTone(row.avgR)),
                  )}
                >
                  {formatR(row.avgR)}
                </td>
                <td
                  className={cn(
                    'num px-4 py-2.5 text-right text-[11px] font-semibold',
                    toneText(pnlTone(row.netPnl)),
                  )}
                >
                  {formatSignedCurrency(row.netPnl, currency)}
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-[11px] text-faint">
                  No data in this range.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

export function AnalyticsPage() {
  const trades = useJournalStore((state) => state.trades)
  const settings = useJournalStore((state) => state.settings)
  const range = useUIStore((state) => state.range)
  const setRange = useUIStore((state) => state.setRange)

  const scoped = useMemo(() => filterByRange(trades, range), [trades, range])
  const metrics = useMemo(
    () => computeMetrics(scoped, settings.startingBalance),
    [scoped, settings.startingBalance],
  )
  const rBuckets = useMemo(() => rDistribution(scoped), [scoped])
  const weekdays = useMemo(() => performanceByWeekday(scoped), [scoped])
  const instruments = useMemo(() => performanceByInstrument(scoped), [scoped])
  const mistakes = useMemo(
    () => tagPerformance(scoped, 'mistakes').slice(0, 8),
    [scoped],
  )
  const split = useMemo(() => planFollowedSplit(scoped), [scoped])
  const discipline = useMemo(() => disciplineDistribution(scoped), [scoped])
  const setups = useMemo(
    () => tagPerformance(scoped, 'setupTags'),
    [scoped],
  )

  const maxDisciplineCount = Math.max(
    1,
    ...discipline.map((entry) => entry.count),
  )

  if (trades.length === 0) {
    return (
      <div className="space-y-5">
        <PageHeader
          eyebrow="Analytics"
          title="Turn the log into an edge."
          description="Distribution, timing and behaviour — measured so you can fix the leaks."
        />
        <Card>
          <EmptyState
            icon={<ChartNoAxesCombined className="h-5 w-5" />}
            title="No analytics yet"
            description="Log a handful of trades and this page will fill with R distribution, session edge and discipline correlations."
          />
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Analytics"
        title="Turn the log into an edge."
        description="Distribution, timing and behaviour — measured so you can fix the leaks."
        actions={<RangeTabs value={range} onChange={setRange} />}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Expectancy"
          value={formatSignedCurrency(metrics.expectancy, settings.currency)}
          valueClassName={toneText(pnlTone(metrics.expectancy))}
          sub={`${metrics.totalTrades} trades`}
        />
        <StatCard
          label="Profit factor"
          value={
            Number.isFinite(metrics.profitFactor)
              ? metrics.profitFactor.toFixed(2)
              : '∞'
          }
          sub={`Gross ${formatSignedCurrency(metrics.grossProfit + metrics.grossLoss, settings.currency)}`}
        />
        <StatCard
          label="Avg R"
          value={formatR(metrics.avgR)}
          valueClassName={toneText(pnlTone(metrics.avgR))}
          sub={`Best ${formatR(Math.max(...scoped.map((t) => t.rMultiple)))}`}
        />
        <StatCard
          label="Max drawdown"
          value={formatSignedCurrency(-metrics.maxDrawdown, settings.currency)}
          valueClassName="text-negative"
          sub={`${formatPercent(metrics.maxDrawdownPct, 1)} peak-to-trough`}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="overflow-hidden xl:col-span-2">
          <CardHeader
            title="R distribution"
            subtitle="Where your outcomes actually cluster"
            icon={<ChartNoAxesCombined className="h-4 w-4" />}
            action={
              <Badge variant="brand">
                {metrics.wins}W / {metrics.losses}L
              </Badge>
            }
          />
          <div className="h-[260px] w-full px-2 pb-4 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={rBuckets}
                margin={{ top: 12, right: 18, bottom: 4, left: 4 }}
              >
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
                  dy={6}
                />
                <YAxis
                  allowDecimals={false}
                  tick={axisTickStyle}
                  tickLine={false}
                  axisLine={false}
                  width={30}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                  contentStyle={chartTooltipStyle}
                  labelStyle={chartTooltipLabelStyle}
                  itemStyle={chartTooltipItemStyle}
                  formatter={(value, name) => [
                    name === 'count'
                      ? `${value} trades`
                      : formatSignedCurrency(Number(value), settings.currency),
                    name === 'count' ? 'Count' : 'Net P&L',
                  ]}
                />
                <Bar dataKey="count" radius={[5, 5, 2, 2]} maxBarSize={44}>
                  {rBuckets.map((bucket, index) => (
                    <Cell
                      key={bucket.label}
                      fill={
                        index <= 3
                          ? index === 3
                            ? '#647084'
                            : '#fb7185'
                          : index === 4
                            ? '#7dd3fc'
                            : '#3ddc97'
                      }
                      fillOpacity={0.82}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader
            title="Plan adherence"
            subtitle="The cost of breaking your rules"
            icon={<ChartNoAxesCombined className="h-4 w-4" />}
          />
          <div className="space-y-3 p-5">
            {[split.followed, split.broken].map((group, index) => (
              <div
                key={group.key}
                className={cn(
                  'rounded-xl border p-3.5',
                  index === 0
                    ? 'border-positive/20 bg-positive/[0.045]'
                    : 'border-negative/20 bg-negative/[0.045]',
                )}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-medium text-ink">{group.key}</p>
                    <p className="mt-0.5 text-[10px] text-faint">
                      {group.totalTrades} trades · {formatPercent(group.winRate)} win
                    </p>
                  </div>
                  <p
                    className={cn(
                      'num text-[13px] font-semibold',
                      toneText(pnlTone(group.netPnl)),
                    )}
                  >
                    {formatSignedCurrency(group.netPnl, settings.currency)}
                  </p>
                </div>
                <div className="mt-3 flex items-center justify-between text-[9.5px] text-faint">
                  <span>Avg {formatR(group.avgR)}</span>
                  <span>
                    {group.profitFactor === Number.POSITIVE_INFINITY
                      ? 'PF ∞'
                      : `PF ${group.profitFactor.toFixed(2)}`}
                  </span>
                </div>
              </div>
            ))}
            <div className="rounded-xl border border-line/80 bg-white/[0.015] p-3.5">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-muted">Discipline score</span>
                <span className="num font-medium text-ink">
                  {metrics.avgDiscipline.toFixed(1)} / 5
                </span>
              </div>
              <Meter
                className="mt-2"
                value={(metrics.avgDiscipline / 5) * 100}
                color="brand"
              />
              <p className="mt-2 text-[9.5px] leading-relaxed text-faint">
                {metrics.planFollowedRate >= 75
                  ? 'Strong rule adherence — protect this consistency.'
                  : 'Rule breaks are showing up. Tighten the checklist before the next entry.'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <CardHeader
          title="Weekday performance"
          subtitle="Net P&L by day of week"
          icon={<ChartNoAxesCombined className="h-4 w-4" />}
        />
        <div className="h-[220px] w-full px-2 pb-4 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={weekdays}
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
              <Bar dataKey="netPnl" radius={[6, 6, 3, 3]} maxBarSize={58}>
                {weekdays.map((day) => (
                  <Cell
                    key={day.key}
                    fill={day.netPnl >= 0 ? '#3ddc97' : '#fb7185'}
                    fillOpacity={0.82}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <PerfTable
          title="Instrument edge"
          subtitle="Ranked by net contribution"
          rows={instruments}
          currency={settings.currency}
        />
        <PerfTable
          title="Setup edge"
          subtitle="Which plays deserve more size"
          rows={setups}
          currency={settings.currency}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="overflow-hidden lg:col-span-2">
          <CardHeader
            title="Cost of mistakes"
            subtitle="Tagged execution errors, ranked by damage"
            icon={<ChartNoAxesCombined className="h-4 w-4" />}
          />
          <div className="divide-y divide-line/60 px-4 pb-2">
            {mistakes.map((mistake) => {
              const maxLoss = Math.max(
                1,
                ...mistakes.map((entry) => Math.abs(Math.min(entry.netPnl, 0))),
              )
              return (
                <div key={mistake.key} className="flex items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-[11.5px] font-medium text-ink">
                        {mistake.key}
                      </p>
                      <p
                        className={cn(
                          'num shrink-0 text-[11.5px] font-semibold',
                          toneText(pnlTone(mistake.netPnl)),
                        )}
                      >
                        {formatSignedCurrency(mistake.netPnl, settings.currency)}
                      </p>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <Meter
                        value={
                          (Math.abs(Math.min(mistake.netPnl, 0)) / maxLoss) * 100
                        }
                        color="negative"
                        height="xs"
                        className="flex-1"
                      />
                      <span className="num shrink-0 text-[9.5px] text-faint">
                        {mistake.totalTrades} trades
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
            {mistakes.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-[12px] font-medium text-positive">
                  No mistakes tagged
                </p>
                <p className="mt-1 text-[10px] text-faint">
                  Keep it that way — clean execution compounds.
                </p>
              </div>
            ) : null}
          </div>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader
            title="Discipline spread"
            subtitle="Self-ratings across the range"
            icon={<ChartNoAxesCombined className="h-4 w-4" />}
          />
          <div className="space-y-3 p-5">
            {discipline.map((entry) => (
              <div key={entry.rating} className="flex items-center gap-3">
                <span className="num w-8 text-[10.5px] text-faint">
                  {entry.rating} ★
                </span>
                <Meter
                  value={(entry.count / maxDisciplineCount) * 100}
                  color={entry.rating >= 4 ? 'positive' : entry.rating >= 3 ? 'brand' : 'negative'}
                  className="flex-1"
                />
                <span className="num w-8 text-right text-[10.5px] text-muted">
                  {entry.count}
                </span>
              </div>
            ))}
            <div className="mt-2 border-t border-line/70 pt-3">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-faint">Total risk taken</span>
                <span className="num text-muted">
                  {formatNumber(metrics.totalRisk, 0)}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between text-[10px]">
                <span className="text-faint">Avg hold</span>
                <span className="num text-muted">
                  {formatNumber(metrics.avgHoldMinutes / 60, 1)}h
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
