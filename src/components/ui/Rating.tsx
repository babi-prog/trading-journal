import { useState } from 'react'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RatingProps {
  value: number
  onChange?: (value: number) => void
  readOnly?: boolean
  size?: 'sm' | 'md'
  className?: string
}

export function Rating({
  value,
  onChange,
  readOnly = false,
  size = 'md',
  className,
}: RatingProps) {
  const [hovered, setHovered] = useState(0)
  const active = hovered || value
  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'

  if (readOnly) {
    return (
      <span
        className={cn('inline-flex items-center gap-0.5', className)}
        aria-label={`Discipline ${value} out of 5`}
      >
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              iconSize,
              star <= value
                ? 'fill-brand text-brand'
                : 'fill-transparent text-line-strong',
            )}
          />
        ))}
      </span>
    )
  }

  return (
    <div
      className={cn('inline-flex items-center gap-1', className)}
      onMouseLeave={() => setHovered(0)}
      role="radiogroup"
      aria-label="Discipline rating"
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={`${star} out of 5`}
          onMouseEnter={() => setHovered(star)}
          onClick={() => onChange?.(star)}
          className="focus-ring rounded-sm p-0.5 transition hover:scale-110"
        >
          <Star
            className={cn(
              size === 'sm' ? 'h-4 w-4' : 'h-5 w-5',
              star <= active
                ? 'fill-brand text-brand'
                : 'fill-transparent text-line-strong',
            )}
          />
        </button>
      ))}
    </div>
  )
}
