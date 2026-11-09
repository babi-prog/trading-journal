import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('card-surface', className)} {...props} />
}

interface CardHeaderProps {
  title: ReactNode
  subtitle?: ReactNode
  action?: ReactNode
  icon?: ReactNode
  className?: string
}

export function CardHeader({
  title,
  subtitle,
  action,
  icon,
  className,
}: CardHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 px-5 pt-5 sm:flex-row sm:items-start sm:justify-between',
        className,
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        {icon ? (
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line bg-inset text-muted">
            {icon}
          </div>
        ) : null}
        <div className="min-w-0">
          <h3 className="truncate font-display text-[15px] font-semibold text-ink">
            {title}
          </h3>
          {subtitle ? (
            <p className="mt-0.5 text-xs leading-relaxed text-muted">{subtitle}</p>
          ) : null}
        </div>
      </div>
      {action ? (
        <div className="flex shrink-0 items-center gap-2">{action}</div>
      ) : null}
    </div>
  )
}
