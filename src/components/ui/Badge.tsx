import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

type BadgeVariant =
  | 'neutral'
  | 'positive'
  | 'negative'
  | 'brand'
  | 'warning'
  | 'info'
  | 'outline'

const badgeVariants: Record<BadgeVariant, string> = {
  neutral: 'border-line-strong bg-white/[0.04] text-muted',
  positive: 'border-positive/25 bg-positive/10 text-positive',
  negative: 'border-negative/25 bg-negative/10 text-negative',
  brand: 'border-brand/25 bg-brand/10 text-brand',
  warning: 'border-warning/25 bg-warning/10 text-warning',
  info: 'border-info/25 bg-info/10 text-info',
  outline: 'border-line bg-transparent text-muted',
}

const dotColors: Record<BadgeVariant, string> = {
  neutral: 'bg-faint',
  positive: 'bg-positive',
  negative: 'bg-negative',
  brand: 'bg-brand',
  warning: 'bg-warning',
  info: 'bg-info',
  outline: 'bg-faint',
}

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  size?: 'sm' | 'md'
  dot?: boolean
  children: ReactNode
}

export function Badge({
  className,
  variant = 'neutral',
  size = 'sm',
  dot = false,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border font-medium leading-none',
        size === 'sm' ? 'px-2 py-1 text-[10px]' : 'px-2.5 py-1.5 text-xs',
        badgeVariants[variant],
        className,
      )}
      {...props}
    >
      {dot ? (
        <span
          className={cn('h-1.5 w-1.5 rounded-full', dotColors[variant])}
          aria-hidden
        />
      ) : null}
      {children}
    </span>
  )
}
