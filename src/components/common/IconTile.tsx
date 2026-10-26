import type { LucideIcon } from 'lucide-react'
import { toneClasses, type Tone } from '@/lib/status'
import { cn } from '@/lib/utils'

const RADIUS = (size: number) => (size >= 88 ? 'rounded-hero' : size <= 36 ? 'rounded-sm' : 'rounded-tile')

export function IconTile({
  icon: Icon,
  tone = 'slate',
  size = 44,
  bordered = false,
  className,
}: {
  icon: LucideIcon
  tone?: Tone
  size?: number
  bordered?: boolean
  className?: string
}) {
  const t = toneClasses[tone]
  return (
    <div
      aria-hidden
      className={cn(
        'flex shrink-0 items-center justify-center',
        RADIUS(size),
        t.bg,
        t.fg,
        bordered && ['border', t.bd],
        className,
      )}
      style={{ width: size, height: size }}
    >
      <Icon size={Math.round(size * (size >= 88 ? 0.47 : 0.5))} strokeWidth={2} />
    </div>
  )
}
