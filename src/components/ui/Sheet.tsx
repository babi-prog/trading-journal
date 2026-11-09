import type { ReactNode } from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: ReactNode
}

export function Sheet({ open, onOpenChange, children }: SheetProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      {children}
    </DialogPrimitive.Root>
  )
}

export const SheetTrigger = DialogPrimitive.Trigger
export const SheetTitle = DialogPrimitive.Title
export const SheetDescription = DialogPrimitive.Description
export const SheetClose = DialogPrimitive.Close

interface SheetContentProps {
  children: ReactNode
  className?: string
  side?: 'right' | 'left'
  showClose?: boolean
  closeLabel?: string
}

export function SheetContent({
  children,
  className,
  side = 'right',
  showClose = true,
  closeLabel = 'Close panel',
}: SheetContentProps) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="dialog-overlay fixed inset-0 z-[60] bg-black/70 backdrop-blur-[3px]" />
      <DialogPrimitive.Content
        className={cn(
          'fixed inset-y-0 z-[60] flex h-full w-full flex-col overflow-hidden border-line-strong bg-panel shadow-[0_0_120px_rgba(0,0,0,0.7)] focus:outline-none',
          side === 'right'
            ? 'drawer-content right-0 border-l sm:max-w-[560px]'
            : 'drawer-left left-0 border-r',
          className,
        )}
      >
        {children}
        {showClose ? (
          <DialogPrimitive.Close
            className="focus-ring absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-lg text-faint transition hover:bg-white/[0.06] hover:text-ink"
            aria-label={closeLabel}
          >
            <X className="h-4 w-4" />
          </DialogPrimitive.Close>
        ) : null}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}
