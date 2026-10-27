import { useState, type Ref } from 'react'
import { cn } from '@/lib/utils'

type Props = {
  value: string
  onChange: (value: string) => void
  /** Called once all cells are filled. */
  onComplete?: (value: string) => void
  length?: number
  error?: boolean
  disabled?: boolean
  label: string
  describedBy?: string
  ref?: Ref<HTMLInputElement>
}

/**
 * One real input (numeric keyboard, `one-time-code` autofill, paste, backspace) laid over
 * `length` visual cells. Always LTR.
 */
export function OtpInput({
  value,
  onChange,
  onComplete,
  length = 6,
  error,
  disabled,
  label,
  describedBy,
  ref,
}: Props) {
  const [focused, setFocused] = useState(false)
  const active = Math.min(value.length, length - 1)

  return (
    <div dir="ltr" className="relative">
      <div aria-hidden className="flex justify-between gap-2">
        {Array.from({ length }, (_, i) => {
          const char = value[i] ?? ''
          return (
            <div
              key={i}
              className={cn(
                'rounded-input bg-surface flex h-[60px] max-w-12 min-w-0 flex-1 items-center justify-center border-2 text-[26px] font-extrabold tabular-nums',
                error
                  ? 'border-danger'
                  : focused && i === active
                    ? 'border-primary'
                    : char
                      ? 'border-text-2'
                      : 'border-border',
              )}
            >
              {char}
            </div>
          )
        })}
      </div>
      <input
        ref={ref}
        value={value}
        disabled={disabled}
        onChange={(e) => {
          const next = e.target.value.replace(/\D/g, '').slice(0, length)
          onChange(next)
          if (next.length === length) onComplete?.(next)
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]*"
        maxLength={length}
        aria-label={label}
        aria-invalid={error || undefined}
        aria-describedby={describedBy}
        className="absolute inset-0 h-full w-full cursor-text bg-transparent text-transparent caret-transparent opacity-0 outline-none"
      />
    </div>
  )
}
