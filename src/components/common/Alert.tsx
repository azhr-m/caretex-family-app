import { CircleAlert, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { toneClasses, type Tone } from '@/lib/status'
import { cn } from '@/lib/utils'

/** Tinted alert box (form errors, deadline notices). Announced to screen readers. */
export function Alert({
  tone = 'red',
  icon: Icon = CircleAlert,
  title,
  children,
  action,
  className,
}: {
  tone?: Tone
  icon?: LucideIcon
  title: ReactNode
  children?: ReactNode
  action?: ReactNode
  className?: string
}) {
  const t = toneClasses[tone]
  return (
    <div role="alert" className={cn('rounded-input flex gap-3 border p-3.5', t.bg, t.bd, t.fg, className)}>
      <Icon aria-hidden size={22} className="shrink-0" />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-body-sm font-extrabold wrap-break-word">{title}</span>
        {children && <span className="text-secondary wrap-break-word">{children}</span>}
        {action}
      </div>
    </div>
  )
}
