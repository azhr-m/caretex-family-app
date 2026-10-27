import type { LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { STATUS, toneClasses, type Status, type Tone } from '@/lib/status'
import { cn } from '@/lib/utils'

type Props = {
  status?: Status
  /** Override the label (e.g. gendered Hebrew variants for a domain). */
  label?: string
  tone?: Tone
  icon?: LucideIcon
  size?: 'md' | 'sm' | 'lg'
  className?: string
}

export function StatusChip({ status, label, tone, icon, size = 'md', className }: Props) {
  const { t } = useTranslation()
  const meta = status ? STATUS[status] : undefined
  const Icon = icon ?? meta?.icon
  const toneKey = tone ?? meta?.tone ?? 'slate'
  const c = toneClasses[toneKey]
  return (
    <span
      className={cn(
        'rounded-pill inline-flex max-w-full items-center gap-[5px] border font-extrabold whitespace-nowrap',
        size === 'sm'
          ? 'text-tag text-label px-2 py-0.5'
          : size === 'lg'
            ? 'text-meta px-3 py-1'
            : 'text-tag text-label px-2.5 py-1',
        c.bg,
        c.fg,
        c.bd,
        className,
      )}
    >
      {Icon && <Icon aria-hidden size={size === 'lg' ? 15 : 14} className="shrink-0" />}
      <span className="truncate">{label ?? (meta ? t(meta.labelKey) : '')}</span>
    </span>
  )
}
