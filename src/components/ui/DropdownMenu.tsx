import type { ComponentProps, ReactNode } from 'react'
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import { cn } from '@/lib/utils'

export const DropdownMenu = DropdownMenuPrimitive.Root
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger
export const DropdownMenuGroup = DropdownMenuPrimitive.Group

interface DropdownMenuContentProps
  extends ComponentProps<typeof DropdownMenuPrimitive.Content> {
  children: ReactNode
}

export function DropdownMenuContent({
  className,
  align = 'end',
  sideOffset = 8,
  children,
  ...props
}: DropdownMenuContentProps) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        align={align}
        sideOffset={sideOffset}
        className={cn(
          'animate-scale-in z-[100] min-w-[210px] rounded-xl border border-line-strong bg-panel-raised p-1.5 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)]',
          className,
        )}
        {...props}
      >
        {children}
      </DropdownMenuPrimitive.Content>
    </DropdownMenuPrimitive.Portal>
  )
}

interface DropdownMenuItemProps
  extends ComponentProps<typeof DropdownMenuPrimitive.Item> {
  icon?: ReactNode
  danger?: boolean
  children: ReactNode
}

export function DropdownMenuItem({
  icon,
  danger,
  children,
  className,
  ...props
}: DropdownMenuItemProps) {
  return (
    <DropdownMenuPrimitive.Item
      className={cn(
        'flex cursor-pointer select-none items-center gap-2.5 rounded-lg px-2.5 py-2 text-[12.5px] outline-none transition data-[disabled]:pointer-events-none data-[disabled]:opacity-40',
        danger
          ? 'text-negative data-[highlighted]:bg-negative/10'
          : 'text-muted data-[highlighted]:bg-white/[0.055] data-[highlighted]:text-ink',
        className,
      )}
      {...props}
    >
      {icon ? <span className="shrink-0 opacity-80">{icon}</span> : null}
      {children}
    </DropdownMenuPrimitive.Item>
  )
}

export function DropdownMenuLabel({ children }: { children: ReactNode }) {
  return (
    <DropdownMenuPrimitive.Label className="px-2.5 pb-1 pt-2 text-[10px] font-medium uppercase tracking-[0.14em] text-faint">
      {children}
    </DropdownMenuPrimitive.Label>
  )
}

export function DropdownMenuSeparator() {
  return (
    <DropdownMenuPrimitive.Separator className="my-1 h-px bg-line" />
  )
}
