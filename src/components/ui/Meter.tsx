import { cn, clamp } from '@/lib/utils'

interface MeterProps {
  value: number
  className?: string
  barClassName?: string
  height?: 'xs' | 'sm' | 'md'
  color?: 'brand' | 'positive' | 'negative' | 'muted'
}

const heights = {
  xs: 'h-1',
  sm: 'h-1.5',
  md: 'h-2',
}

const colors = {
  brand: 'bg-brand',
  positive: 'bg-positive',
  negative: 'bg-negative',
  muted: 'bg-faint',
}

export function Meter({
  value,
  className,
  barClassName,
  height = 'sm',
  color = 'brand',
}: MeterProps) {
  return (
    <div
      className={cn(
        'w-full overflow-hidden rounded-full bg-white/[0.055]',
        heights[height],
        className,
      )}
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn(
          'h-full rounded-full transition-[width] duration-700 ease-out',
          colors[color],
          barClassName,
        )}
        style={{ width: `${clamp(value, 0, 100)}%` }}
      />
    </div>
  )
}
