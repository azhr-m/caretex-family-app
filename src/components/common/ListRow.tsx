import { ChevronRight, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { toneClasses, type Tone } from '@/lib/status'
import { cn } from '@/lib/utils'
import { DirIcon } from './DirIcon'
import { IconTile } from './IconTile'

/** Grouped card container for ListRows; rows get dividers except the last. */
export function ListGroup({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'rounded-card border-border bg-surface shadow-card [&>*:not(:last-child)]:border-border overflow-hidden border [&>*:not(:last-child)]:border-b',
        className,
      )}
    >
      {children}
    </div>
  )
}

type Props = {
  icon: LucideIcon
  tone?: Tone
  kind?: string
  title: ReactNode
  meta?: ReactNode
  end?: ReactNode
  onClick?: () => void
  chevron?: boolean
  className?: string
}

export function ListRow({
  icon,
  tone = 'slate',
  kind,
  title,
  meta,
  end,
  onClick,
  chevron = true,
  className,
}: Props) {
  const Comp = onClick ? 'button' : 'div'
  return (
    <Comp
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'flex min-h-16 w-full items-center gap-3 bg-transparent px-3.5 py-3 text-start',
        onClick && 'active:bg-surface-2 transition-colors',
        className,
      )}
    >
      <IconTile icon={icon} tone={tone} size={42} />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        {kind && <span className={cn('text-tag text-label font-extrabold', toneClasses[tone].fg)}>{kind}</span>}
        <span className="text-body-sm leading-[1.3] font-bold text-pretty wrap-break-word">{title}</span>
        {meta && <span className="text-meta text-text-2">{meta}</span>}
      </div>
      {end}
      {chevron && onClick && <DirIcon icon={ChevronRight} size={20} className="text-text-2" />}
    </Comp>
  )
}
