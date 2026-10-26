import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type Variant = 'offline' | 'changed' | 'online'

const STYLES: Record<Variant, string> = {
  offline: 'bg-offline-bg text-white',
  changed: 'border-b border-amber-bd bg-amber-bg text-amber-fg',
  online: 'bg-green-fg text-white dark:text-bg',
}

export function Banner({
  variant,
  icon: Icon,
  title,
  body,
  action,
  className,
}: {
  variant: Variant
  icon: LucideIcon
  title: ReactNode
  body?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div role="status" className={cn('flex items-center gap-3 px-4 py-3', STYLES[variant], className)}>
      <Icon aria-hidden size={variant === 'changed' ? 22 : 20} className="shrink-0" />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="text-body-sm font-extrabold wrap-break-word">{title}</span>
        {body && <span className="text-meta wrap-break-word opacity-90">{body}</span>}
      </div>
      {action}
    </div>
  )
}
