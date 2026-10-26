import type { LucideIcon } from 'lucide-react'
import { DirIcon } from '@/components/common/DirIcon'
import { cn } from '@/lib/utils'

/** Floating action, always icon + label. Positioned above the tab bar; content needs pb-[100px]. */
export function Fab({
  icon,
  label,
  onClick,
  className,
}: {
  icon: LucideIcon
  label: string
  onClick: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'bg-primary text-body text-on-primary shadow-fab fixed end-[max(16px,calc((100vw-480px)/2+16px))] z-30 flex h-14 items-center gap-2 rounded-[28px] px-5 font-extrabold active:brightness-95',
        className,
      )}
      style={{ bottom: 'calc(var(--tabbar-h, 0px) + 16px)' }}
    >
      <DirIcon icon={icon} size={20} />
      {label}
    </button>
  )
}
