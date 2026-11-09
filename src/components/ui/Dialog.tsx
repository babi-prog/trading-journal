import type { ReactNode } from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export const Dialog = DialogPrimitive.Root
export const DialogTrigger = DialogPrimitive.Trigger
export const DialogClose = DialogPrimitive.Close

export const DialogTitle = DialogPrimitive.Title
export const DialogDescription = DialogPrimitive.Description

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-3xl',
  xl: 'max-w-5xl',
} as const

interface DialogContentProps {
  children: ReactNode
  className?: string
  size?: keyof typeof sizeClasses
  showClose?: boolean
  closeLabel?: string
  overlayClassName?: string
  onOpenAutoFocus?: (event: Event) => void
}

export function DialogContent({
  children,
  className,
  size = 'md',
  showClose = true,
  closeLabel = 'Close dialog',
  overlayClassName,
}: DialogContentProps) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay
        className={cn(
          'dialog-overlay fixed inset-0 z-[60] bg-black/70 backdrop-blur-[3px]',
          overlayClassName,
        )}
      />
      <DialogPrimitive.Content
        className={cn(
          'dialog-content fixed left-1/2 top-1/2 z-[60] flex max-h-[min(90svh,900px)] w-[calc(100vw-1.5rem)] flex-col overflow-hidden rounded-2xl border border-line-strong bg-panel shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9)] focus:outline-none',
          sizeClasses[size],
          className,
        )}
      >
        {children}
        {showClose ? (
          <DialogPrimitive.Close
            className="focus-ring absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-faint transition hover:bg-white/[0.06] hover:text-ink"
            aria-label={closeLabel}
          >
            <X className="h-4 w-4" />
          </DialogPrimitive.Close>
        ) : null}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}
