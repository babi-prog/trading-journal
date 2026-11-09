import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TagInputProps {
  value: string[]
  onChange: (value: string[]) => void
  suggestions: string[]
  placeholder?: string
  tone?: 'brand' | 'negative'
  max?: number
}

export function TagInput({
  value,
  onChange,
  suggestions,
  placeholder = 'Type and press Enter…',
  tone = 'brand',
  max = 6,
}: TagInputProps) {
  const [draft, setDraft] = useState('')

  function addTag(raw: string) {
    const tag = raw.trim()
    if (!tag || value.some((item) => item.toLowerCase() === tag.toLowerCase())) {
      setDraft('')
      return
    }
    if (value.length >= max) return
    onChange([...value, tag])
    setDraft('')
  }

  function removeTag(tag: string) {
    onChange(value.filter((item) => item !== tag))
  }

  const filtered = suggestions
    .filter(
      (suggestion) =>
        !value.some((item) => item.toLowerCase() === suggestion.toLowerCase()),
    )
    .filter((suggestion) =>
      draft
        ? suggestion.toLowerCase().includes(draft.trim().toLowerCase())
        : true,
    )
    .slice(0, 6)

  return (
    <div>
      <div
        className={cn(
          'flex min-h-10 flex-wrap items-center gap-1.5 rounded-[10px] border border-line bg-inset px-2 py-2 transition focus-within:border-brand/50 focus-within:ring-2 focus-within:ring-brand/15',
        )}
      >
        {value.map((tag) => (
          <span
            key={tag}
            className={cn(
              'inline-flex items-center gap-1 rounded-md border px-1.5 py-1 text-[10px] font-medium',
              tone === 'negative'
                ? 'border-negative/25 bg-negative/10 text-negative'
                : 'border-brand/25 bg-brand/10 text-brand',
            )}
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="focus-ring rounded-sm opacity-60 transition hover:opacity-100"
              aria-label={`Remove ${tag}`}
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ',') {
              event.preventDefault()
              addTag(draft)
            } else if (event.key === 'Backspace' && !draft && value.length > 0) {
              removeTag(value[value.length - 1]!)
            }
          }}
          placeholder={value.length >= max ? 'Tag limit reached' : placeholder}
          disabled={value.length >= max}
          className="h-6 min-w-[110px] flex-1 bg-transparent text-xs text-ink outline-none placeholder:text-faint disabled:cursor-not-allowed"
        />
      </div>
      {filtered.length > 0 ? (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {filtered.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => addTag(suggestion)}
              className={cn(
                'inline-flex items-center gap-1 rounded-md border border-line bg-white/[0.025] px-1.5 py-1 text-[9.5px] text-faint transition hover:border-line-strong hover:text-muted',
              )}
            >
              <Plus className="h-2.5 w-2.5" />
              {suggestion}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
