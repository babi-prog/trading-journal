import { useId, useRef, useState, type DragEvent } from 'react'
import { Image as ImageIcon, LoaderCircle, RefreshCcw, Trash, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { compressImage } from '@/lib/image'
import { cn } from '@/lib/utils'

interface ImageFieldProps {
  label: string
  value?: string
  onChange: (value?: string) => void
  hint?: string
}

export function ImageField({ label, value, onChange, hint }: ImageFieldProps) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [dragging, setDragging] = useState(false)

  async function handleFile(file: File | undefined) {
    if (!file) return
    try {
      setBusy(true)
      const dataUrl = await compressImage(file)
      onChange(dataUrl)
    } catch (error) {
      toast.error('Could not attach image', {
        description:
          error instanceof Error ? error.message : 'Please try another image.',
      })
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setDragging(false)
    void handleFile(event.dataTransfer.files?.[0])
  }

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-[11px] font-medium text-muted">{label}</span>
        <span className="text-[10px] text-faint">{hint ?? 'Optional'}</span>
      </div>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="sr-only"
        onChange={(event) => void handleFile(event.target.files?.[0])}
      />
      <div
        onDragOver={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          'group relative overflow-hidden rounded-xl border border-dashed border-line-strong bg-inset transition',
          dragging && 'border-brand/60 bg-brand/[0.04]',
        )}
      >
        {value ? (
          <>
            <img
              src={value}
              alt={`${label} screenshot`}
              className="h-40 w-full object-cover"
            />
            <div className="absolute inset-0 flex items-end justify-between gap-2 bg-gradient-to-t from-black/80 via-black/10 to-transparent p-2.5 opacity-0 transition group-hover:opacity-100">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="focus-ring flex items-center gap-1.5 rounded-md border border-white/15 bg-black/50 px-2 py-1.5 text-[10px] font-medium text-white backdrop-blur transition hover:bg-black/70"
              >
                <RefreshCcw className="h-3 w-3" />
                Replace
              </button>
              <button
                type="button"
                onClick={() => onChange(undefined)}
                className="focus-ring flex items-center gap-1.5 rounded-md border border-negative/30 bg-negative/20 px-2 py-1.5 text-[10px] font-medium text-white backdrop-blur transition hover:bg-negative/30"
              >
                <Trash className="h-3 w-3" />
                Remove
              </button>
            </div>
          </>
        ) : (
          <label
            htmlFor={inputId}
            className="flex h-40 w-full cursor-pointer flex-col items-center justify-center gap-2 px-4 text-center transition hover:bg-white/[0.02]"
          >
            {busy ? (
              <LoaderCircle className="h-5 w-5 animate-spin text-brand" />
            ) : (
              <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-white/[0.025] text-faint">
                <ImageIcon className="h-4 w-4" />
              </span>
            )}
            <span className="text-[11px] font-medium text-muted">
              {busy ? 'Processing image…' : 'Drop a chart screenshot'}
            </span>
            <span className="flex items-center gap-1 text-[10px] text-faint">
              <Upload className="h-2.5 w-2.5" />
              or click to browse · PNG, JPG
            </span>
          </label>
        )}
        {busy && value ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <LoaderCircle className="h-5 w-5 animate-spin text-brand" />
          </div>
        ) : null}
      </div>
    </div>
  )
}
