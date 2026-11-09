import * as SwitchPrimitive from '@radix-ui/react-switch'
import { cn } from '@/lib/utils'

interface SwitchProps {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  id?: string
  disabled?: boolean
  className?: string
  'aria-label'?: string
}

export function Switch({
  checked,
  onCheckedChange,
  id,
  disabled,
  className,
  'aria-label': ariaLabel,
}: SwitchProps) {
  return (
    <SwitchPrimitive.Root
      id={id}
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cn(
        'focus-ring relative h-6 w-10 shrink-0 rounded-full border border-line-strong bg-white/[0.06] transition-colors data-[state=checked]:border-brand/50 data-[state=checked]:bg-brand disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
    >
      <SwitchPrimitive.Thumb className="block h-[18px] w-[18px] translate-x-[2px] rounded-full bg-muted shadow-sm transition-transform data-[state=checked]:translate-x-[20px] data-[state=checked]:bg-brand-ink" />
    </SwitchPrimitive.Root>
  )
}
