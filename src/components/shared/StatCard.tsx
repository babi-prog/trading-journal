import type { ReactNode } from 'react'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { Sparkline } from '@/components/ui/Sparkline'
import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: ReactNode
  sub?: ReactNode
  icon?: ReactNode
  valueClassName?: string
  delta?: {
    value: string
    positive: boolean
    label?: string
  } | null
  sparkline?: number[]
  sparklineClassName?: string
  className?: string
}

export function StatCard({
  label,
  value,
  sub,
  icon,
  valueClassName,
  delta,
  sparkline,
  sparklineClassName,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        'card-surface group relative min-h-[132px] overflow-hidden p-4 sm:p-5',
        className,
      )}
    >
      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10.5px] font-medium uppercase tracking-[0.12em] text-faint">
            {label}
          </p>
          <p
            className={cn(
              'num mt-3 truncate font-display text-[24px] font-semibold leading-none tracking-[-0.035em] text-ink sm:text-[27px]',
              valueClassName,
            )}
          >
            {value}
          </p>
        </div>
        {icon ? (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line bg-white/[0.025] text-faint transition group-hover:border-line-strong group-hover:text-muted">
            {icon}
          </div>
        ) : null}
      </div>

      <div className="relative z-10 mt-3 flex min-h-[16px] flex-wrap items-center gap-x-2 gap-y-1 text-[10.5px] text-faint">
        {delta ? (
          <span
            className={cn(
              'flex items-center gap-0.5 font-medium',
              delta.positive ? 'text-positive' : 'text-negative',
            )}
          >
            {delta.positive ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
            {delta.value}
          </span>
        ) : null}
        {delta?.label ? <span className="text-faint/80">{delta.label}</span> : null}
        {sub ? <span>{sub}</span> : null}
      </div>

      {sparkline && sparkline.length > 1 ? (
        <div
          className={cn(
            'pointer-events-none absolute inset-x-0 -bottom-0.5 h-14 opacity-50',
            sparklineClassName,
          )}
        >
          <Sparkline values={sparkline} className="h-14" />
        </div>
      ) : null}
    </div>
  )
}

interface MiniStatProps {
  label: string
  value: ReactNode
  sub?: ReactNode
  valueClassName?: string
  className?: string
}

export function MiniStat({
  label,
  value,
  sub,
  valueClassName,
  className,
}: MiniStatProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-line/80 bg-panel/60 px-3.5 py-3',
        className,
      )}
    >
      <p className="text-[9.5px] font-medium uppercase tracking-[0.14em] text-faint">
        {label}
      </p>
      <p
        className={cn(
          'num mt-1.5 font-display text-[17px] font-semibold leading-none tracking-tight text-ink',
          valueClassName,
        )}
      >
        {value}
      </p>
      {sub ? <p className="mt-1 text-[10px] text-faint">{sub}</p> : null}
    </div>
  )
}
