import { useId } from 'react'
import { cn } from '@/lib/utils'

interface SparklineProps {
  values: number[]
  className?: string
  height?: number
  filled?: boolean
  strokeWidth?: number
}

export function Sparkline({
  values,
  className,
  height = 36,
  filled = true,
  strokeWidth = 1.6,
}: SparklineProps) {
  const gradientId = useId()
  if (values.length < 2) return null

  const width = 100
  const padding = 2
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const step = (width - padding * 2) / (values.length - 1)

  const points = values.map((value, index) => {
    const x = padding + index * step
    const y =
      padding + (1 - (value - min) / range) * (height - padding * 2)
    return [x, y] as const
  })

  const line = points
    .map(([x, y], index) => `${index === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`)
    .join(' ')
  const area = `${line} L${points[points.length - 1]![0].toFixed(2)},${height} L${points[0]![0].toFixed(2)},${height} Z`

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={cn('h-9 w-full', className)}
      aria-hidden
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.28" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      {filled ? <path d={area} fill={`url(#${gradientId})`} /> : null}
      <path
        d={line}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}
