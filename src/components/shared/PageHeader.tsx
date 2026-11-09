import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  eyebrow?: string
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  className?: string
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between',
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow ? (
          <div className="mb-2 flex items-center gap-2">
            <span className="h-px w-5 bg-brand/50" />
            <span className="text-[9.5px] font-semibold uppercase tracking-[0.22em] text-brand/80">
              {eyebrow}
            </span>
          </div>
        ) : null}
        <h1 className="font-display text-[26px] font-semibold leading-[1.08] tracking-[-0.035em] text-ink sm:text-[32px]">
          {title}
        </h1>
        {description ? (
          <p className="mt-1.5 max-w-2xl text-[12.5px] leading-relaxed text-muted">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  )
}
