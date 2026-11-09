import { RANGE_PRESETS, cn, type RangePreset } from '@/lib/utils'

interface RangeTabsProps {
  value: RangePreset
  onChange: (value: RangePreset) => void
  className?: string
}

export function RangeTabs({ value, onChange, className }: RangeTabsProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-0.5 rounded-[10px] border border-line bg-inset p-1',
        className,
      )}
    >
      {RANGE_PRESETS.map((preset) => (
        <button
          key={preset.value}
          type="button"
          onClick={() => onChange(preset.value)}
          title={preset.label}
          aria-pressed={value === preset.value}
          className={cn(
            'h-7 rounded-md px-2.5 text-[10px] font-semibold tracking-wide transition',
            value === preset.value
              ? 'bg-white/[0.075] text-ink shadow-sm'
              : 'text-faint hover:text-muted',
          )}
        >
          {preset.short}
        </button>
      ))}
    </div>
  )
}
