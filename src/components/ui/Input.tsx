import {
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from 'react'
import { cn } from '@/lib/utils'

export const fieldBase =
  'h-10 w-full rounded-[10px] border border-line bg-inset px-3 text-sm text-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] transition placeholder:text-faint focus:border-brand/50 focus:outline-none focus:ring-2 focus:ring-brand/15 disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-negative/50 aria-[invalid=true]:focus:ring-negative/15'

interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  prefix?: ReactNode
  suffix?: ReactNode
  containerClassName?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    { className, prefix, suffix, containerClassName, ...props },
    ref,
  ) => {
    if (!prefix && !suffix) {
      return <input ref={ref} className={cn(fieldBase, className)} {...props} />
    }

    return (
      <div className={cn('relative', containerClassName)}>
        {prefix ? (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-faint">
            {prefix}
          </span>
        ) : null}
        <input
          ref={ref}
          className={cn(
            fieldBase,
            prefix && 'pl-7',
            suffix && 'pr-11',
            className,
          )}
          {...props}
        />
        {suffix ? (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-medium uppercase tracking-wide text-faint">
            {suffix}
          </span>
        ) : null}
      </div>
    )
  },
)

Input.displayName = 'Input'

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      'min-h-[96px] w-full resize-y rounded-[10px] border border-line bg-inset px-3 py-2.5 text-sm leading-relaxed text-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] transition placeholder:text-faint focus:border-brand/50 focus:outline-none focus:ring-2 focus:ring-brand/15 disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-negative/50',
      className,
    )}
    {...props}
  />
))

Textarea.displayName = 'Textarea'

interface FieldProps {
  label: string
  htmlFor?: string
  hint?: ReactNode
  error?: string
  required?: boolean
  children: ReactNode
  className?: string
}

export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  children,
  className,
}: FieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <div className="flex items-center justify-between gap-2">
        <label
          htmlFor={htmlFor}
          className="text-[11px] font-medium text-muted"
        >
          {label}
          {required ? <span className="ml-0.5 text-brand">*</span> : null}
        </label>
        {hint ? (
          <span className="text-[10px] text-faint">{hint}</span>
        ) : null}
      </div>
      {children}
      {error ? (
        <p className="text-[10px] font-medium text-negative">{error}</p>
      ) : null}
    </div>
  )
}
