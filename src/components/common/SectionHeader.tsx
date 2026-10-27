import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { toneClasses, type Tone } from '@/lib/status'
import { cn } from '@/lib/utils'

export function SectionHeader({
  icon: Icon,
  children,
  count,
  countTone = 'violet',
  end,
  className,
}: {
  icon?: LucideIcon
  children: ReactNode
  count?: number
  countTone?: Tone
  end?: ReactNode
  className?: string
}) {
  const t = toneClasses[countTone]
  return (
    <div className={cn('text-tag text-label flex items-center gap-2', className)}>
      {Icon && <Icon aria-hidden size={16} className="shrink-0" />}
      <h2 className="text-tag text-label m-0 min-w-0 flex-1 font-extrabold tracking-[.06em] wrap-break-word uppercase rtl:tracking-normal rtl:normal-case">
        {children}
      </h2>
      {count !== undefined && (
        <span className={cn('rounded-pill text-tag text-label px-2 py-0.5 font-extrabold tabular-nums', t.bg, t.fg)}>
          {count}
        </span>
      )}
      {end}
    </div>
  )
}
