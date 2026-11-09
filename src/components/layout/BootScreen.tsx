import { LogoMark } from '@/components/brand/Logo'

export function BootScreen() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-7 bg-canvas px-6">
      <div className="relative">
        <div className="absolute inset-0 rounded-2xl bg-brand/20 blur-2xl" />
        <LogoMark className="relative h-14 w-14" />
      </div>
      <div className="text-center">
        <h1 className="font-display text-lg font-semibold text-ink">
          Opening your journal
        </h1>
        <p className="mt-1 text-xs text-muted">
          Local-first · Your data never leaves this device
        </p>
      </div>
      <div className="w-52 space-y-2">
        <div className="skeleton h-1.5 rounded-full" />
        <div className="skeleton h-1.5 w-4/5 rounded-full" />
        <div className="skeleton h-1.5 w-3/5 rounded-full" />
      </div>
    </div>
  )
}
