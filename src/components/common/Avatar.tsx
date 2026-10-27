import { toneClasses, type Tone } from '@/lib/status'
import { cn } from '@/lib/utils'

export function Avatar({
  initials,
  photoUrl,
  tone = 'pink',
  size = 42,
  className,
}: {
  initials: string
  photoUrl?: string | null
  tone?: Tone
  size?: number
  className?: string
}) {
  const t = toneClasses[tone]
  return (
    <div
      aria-hidden
      className={cn(
        'flex shrink-0 items-center justify-center overflow-hidden rounded-full font-extrabold',
        t.bg,
        t.fg,
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}
    >
      {photoUrl ? <img src={photoUrl} alt="" className="size-full object-cover" /> : initials}
    </div>
  )
}
