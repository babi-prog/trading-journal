import { cn } from '@/lib/utils'

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      className={cn('h-9 w-9 shrink-0', className)}
      aria-hidden
    >
      <rect
        x="1"
        y="1"
        width="62"
        height="62"
        rx="16"
        fill="#0D131D"
        stroke="rgba(255,255,255,0.08)"
      />
      <path
        d="M17 43V25.5C17 20.8 20.8 17 25.5 17H47"
        stroke="var(--color-brand)"
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      <path
        d="M25 31V43"
        stroke="var(--color-brand)"
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      <path
        d="M25 37H37.5C41.6 37 45 40.4 45 44.5V47"
        stroke="var(--color-brand)"
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      <circle cx="44.5" cy="44.5" r="3" fill="var(--color-brand)" />
    </svg>
  )
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn('flex flex-col leading-none', className)}>
      <span className="font-display text-[16px] font-semibold tracking-[-0.02em] text-ink">
        Trader<span className="text-brand">Casa</span>
      </span>
      <span className="mt-1 text-[8px] font-semibold uppercase tracking-[0.34em] text-faint">
        Journal
      </span>
    </span>
  )
}
