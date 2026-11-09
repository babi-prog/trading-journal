import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { LoaderCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'outline'
  | 'danger'
  | 'brand-soft'

type ButtonSize = 'sm' | 'md' | 'lg' | 'icon' | 'icon-sm'

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-brand text-brand-ink font-semibold shadow-lg shadow-brand/10 hover:bg-brand-strong',
  secondary:
    'border border-line-strong bg-white/[0.035] text-ink hover:border-line-strong hover:bg-white/[0.065]',
  ghost: 'text-muted hover:bg-white/[0.05] hover:text-ink',
  outline:
    'border border-line text-ink hover:border-line-strong hover:bg-white/[0.04]',
  danger:
    'border border-negative/25 bg-negative/10 text-negative hover:bg-negative/15',
  'brand-soft':
    'border border-brand/25 bg-brand/10 text-brand hover:bg-brand/15',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'h-8 rounded-lg px-3 text-xs',
  md: 'h-10 rounded-[10px] px-4 text-sm',
  lg: 'h-11 rounded-xl px-5 text-sm',
  icon: 'h-9 w-9 rounded-[10px]',
  'icon-sm': 'h-8 w-8 rounded-lg',
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  icon?: ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'secondary',
      size = 'md',
      loading = false,
      icon,
      children,
      disabled,
      type = 'button',
      ...props
    },
    ref,
  ) => (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={cn(
        'focus-ring inline-flex select-none items-center justify-center gap-2 whitespace-nowrap font-medium transition-all duration-150 disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : icon}
      {children}
    </button>
  ),
)

Button.displayName = 'Button'
