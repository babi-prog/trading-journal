import { useState, type ReactNode } from 'react'
import { TriangleExclamationPoint } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'primary'
  onConfirm: () => void | Promise<void>
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
}: ConfirmDialogProps) {
  const [busy, setBusy] = useState(false)

  async function handleConfirm() {
    try {
      setBusy(true)
      await onConfirm()
      onOpenChange(false)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        size="sm"
        className="z-[90]"
        overlayClassName="z-[90]"
        showClose={false}
      >
        <div className="p-6">
          <div
            className={cn(
              'flex h-11 w-11 items-center justify-center rounded-xl border',
              variant === 'danger'
                ? 'border-negative/25 bg-negative/10 text-negative'
                : 'border-brand/25 bg-brand/10 text-brand',
            )}
          >
            <TriangleExclamationPoint className="h-5 w-5" />
          </div>
          <DialogTitle className="mt-4 font-display text-lg font-semibold text-ink">
            {title}
          </DialogTitle>
          <DialogDescription asChild>
            <div className="mt-2 text-[13px] leading-relaxed text-muted">
              {description}
            </div>
          </DialogDescription>
          <div className="mt-6 flex items-center justify-end gap-2">
            <Button onClick={() => onOpenChange(false)} disabled={busy}>
              {cancelLabel}
            </Button>
            <Button
              variant={variant === 'danger' ? 'danger' : 'primary'}
              onClick={handleConfirm}
              loading={busy}
            >
              {confirmLabel}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
