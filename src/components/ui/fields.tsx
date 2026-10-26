import { CircleX, Eye, EyeOff, type LucideIcon } from 'lucide-react'
import { useId, useLayoutEffect, useRef, useState, type ComponentProps, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Ltr } from '@/components/common/Ltr'
import { cn } from '@/lib/utils'

type FieldShellProps = {
  label?: ReactNode
  helper?: ReactNode
  error?: string
  /** Rendered at the end of the helper row (e.g. counter). */
  helperEnd?: ReactNode
  children: (ids: { inputId: string; describedBy?: string }) => ReactNode
  className?: string
}

function FieldShell({ label, helper, error, helperEnd, children, className }: FieldShellProps) {
  const inputId = useId()
  const helpId = `${inputId}-help`
  const hasHelp = !!(error || helper || helperEnd)
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={inputId} className="text-secondary font-bold">
          {label}
        </label>
      )}
      {children({ inputId, describedBy: hasHelp ? helpId : undefined })}
      {hasHelp && (
        <div id={helpId} className="text-meta flex items-start gap-3">
          {error ? (
            <span role="alert" className="text-danger flex min-w-0 flex-1 items-start gap-1.5">
              <CircleX aria-hidden size={15} className="mt-px shrink-0" />
              <span className="min-w-0 wrap-break-word">{error}</span>
            </span>
          ) : (
            <span className="text-text-2 min-w-0 flex-1 wrap-break-word">{helper}</span>
          )}
          {helperEnd}
        </div>
      )}
    </div>
  )
}

const boxClasses = (bad: boolean, good = false) =>
  cn(
    'rounded-input bg-surface flex min-h-[54px] items-center gap-2.5 border-[1.5px] px-3.5 transition-colors',
    'focus-within:border-primary focus-within:border-2 focus-within:px-[13.5px]',
    bad
      ? 'border-danger border-2 px-[13.5px]'
      : good
        ? 'border-green-fg border-2 px-[13.5px]'
        : 'border-border',
  )

type TextFieldProps = Omit<ComponentProps<'input'>, 'size'> & {
  label?: ReactNode
  helper?: ReactNode
  error?: string
  /** Red border without a message (e.g. the other field holds the message). */
  invalid?: boolean
  /** Green border for a confirmed value (e.g. passwords match). */
  valid?: boolean
  icon?: LucideIcon
  trailing?: ReactNode
  /** Phone/password/OTP inputs stay LTR even in Hebrew. */
  ltr?: boolean
  containerClassName?: string
}

export function TextField({
  label,
  helper,
  error,
  invalid = false,
  valid = false,
  icon: Icon,
  trailing,
  ltr,
  containerClassName,
  className,
  ...props
}: TextFieldProps) {
  return (
    <FieldShell label={label} helper={helper} error={error} className={containerClassName}>
      {({ inputId, describedBy }) => (
        <div className={boxClasses(!!error || invalid, valid)}>
          {Icon && <Icon aria-hidden size={20} className="text-text-2 shrink-0" />}
          <input
            id={inputId}
            dir={ltr ? 'ltr' : undefined}
            aria-invalid={error || invalid ? true : undefined}
            aria-describedby={describedBy}
            className={cn(
              'text-body placeholder:text-text-2 h-full min-h-[50px] min-w-0 flex-1 bg-transparent text-start outline-none',
              className,
            )}
            {...props}
          />
          {trailing}
        </div>
      )}
    </FieldShell>
  )
}

export function PasswordField({
  defaultVisible = false,
  ...props
}: Omit<TextFieldProps, 'type' | 'trailing' | 'ltr'> & { defaultVisible?: boolean }) {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(defaultVisible)
  return (
    <TextField
      {...props}
      ltr
      type={visible ? 'text' : 'password'}
      autoComplete={props.autoComplete ?? 'current-password'}
      trailing={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-pressed={visible}
          className="bg-surface-2 text-meta text-text -me-1.5 flex h-[42px] shrink-0 items-center gap-1.5 rounded-sm px-2.5 font-bold"
        >
          {visible ? <EyeOff aria-hidden size={18} /> : <Eye aria-hidden size={18} />}
          {visible ? t('actions.hide') : t('actions.show')}
        </button>
      }
    />
  )
}

type TextAreaProps = Omit<ComponentProps<'textarea'>, 'value'> & {
  label?: ReactNode
  helper?: ReactNode
  error?: string
  value: string
  maxLength?: number
  /** Counter turns amber from this length (default 90% of max). */
  warnAt?: number
  minHeight?: number
  containerClassName?: string
}

export function TextArea({
  label,
  helper,
  error,
  value,
  maxLength,
  warnAt,
  minHeight = 120,
  containerClassName,
  className,
  ...props
}: TextAreaProps) {
  const { t } = useTranslation()
  const ref = useRef<HTMLTextAreaElement>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.max(minHeight, el.scrollHeight)}px`
  }, [value, minHeight])

  const len = value.length
  const warn = warnAt ?? (maxLength ? Math.floor(maxLength * 0.9) : Infinity)
  const counter = maxLength ? (
    <Ltr
      className={cn(
        'shrink-0 tabular-nums',
        len >= maxLength ? 'text-danger font-bold' : len >= warn ? 'text-amber-fg font-bold' : 'text-text-2',
      )}
    >
      {t('field.counter', { count: len, max: maxLength })}
    </Ltr>
  ) : undefined

  return (
    <FieldShell
      label={label}
      helper={helper}
      error={error}
      helperEnd={counter}
      className={containerClassName}
    >
      {({ inputId, describedBy }) => (
        <textarea
          ref={ref}
          id={inputId}
          value={value}
          maxLength={maxLength}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          style={{ minHeight }}
          className={cn(
            'rounded-input bg-surface text-body placeholder:text-text-2 w-full resize-none border-[1.5px] p-3.5 leading-normal outline-none',
            'focus:border-primary focus:border-2 focus:p-[13.5px]',
            error ? 'border-danger border-2 p-[13.5px]' : 'border-border',
            className,
          )}
          {...props}
        />
      )}
    </FieldShell>
  )
}
