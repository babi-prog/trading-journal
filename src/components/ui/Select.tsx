import type { ReactNode } from 'react'
import * as SelectPrimitive from '@radix-ui/react-select'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

interface SelectProps {
  value: string
  onValueChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  icon?: ReactNode
  className?: string
  contentClassName?: string
  size?: 'sm' | 'md'
  ariaLabel?: string
  id?: string
  disabled?: boolean
}

export function Select({
  value,
  onValueChange,
  options,
  placeholder = 'Select…',
  icon,
  className,
  contentClassName,
  size = 'md',
  ariaLabel,
  id,
  disabled,
}: SelectProps) {
  const selected = options.find((option) => option.value === value)

  return (
    <SelectPrimitive.Root value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectPrimitive.Trigger
        id={id}
        aria-label={ariaLabel}
        className={cn(
          'focus-ring flex w-full items-center justify-between gap-2 rounded-[10px] border border-line bg-inset px-3 text-left text-ink transition hover:border-line-strong focus:border-brand/50 focus:ring-2 focus:ring-brand/15 disabled:cursor-not-allowed disabled:opacity-50 data-[state=open]:border-brand/40',
          size === 'sm' ? 'h-9 text-xs' : 'h-10 text-sm',
          className,
        )}
      >
        <span className="flex min-w-0 items-center gap-2">
          {icon ? <span className="shrink-0 text-faint">{icon}</span> : null}
          <span className={cn('truncate', !selected && 'text-faint')}>
            {selected?.label ?? placeholder}
          </span>
        </span>
        <SelectPrimitive.Icon asChild>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-faint" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={6}
          className={cn(
            'animate-scale-in z-[90] max-h-[min(340px,60vh)] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-xl border border-line-strong bg-panel-raised p-1 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.85)]',
            contentClassName,
          )}
        >
          <SelectPrimitive.Viewport className="p-0.5">
            {options.map((option) => (
              <SelectPrimitive.Item
                key={option.value}
                value={option.value}
                disabled={option.disabled}
                className="relative flex cursor-pointer select-none items-center gap-2 rounded-lg py-2 pl-2.5 pr-8 text-[13px] text-muted outline-none transition data-[disabled]:pointer-events-none data-[disabled]:opacity-40 data-[highlighted]:bg-white/[0.055] data-[highlighted]:text-ink data-[state=checked]:text-brand"
              >
                <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                <SelectPrimitive.ItemIndicator className="absolute right-2.5 flex h-4 w-4 items-center justify-center">
                  <Check className="h-3.5 w-3.5" />
                </SelectPrimitive.ItemIndicator>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  )
}
