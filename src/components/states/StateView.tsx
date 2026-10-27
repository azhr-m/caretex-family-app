import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { IconTile } from '@/components/common/IconTile'
import { StatusChip } from '@/components/common/StatusChip'
import type { Status, Tone } from '@/lib/status'
import { cn } from '@/lib/utils'

export type StateViewProps = {
  icon: LucideIcon
  tone?: Tone
  status?: Status
  statusLabel?: string
  statusIcon?: LucideIcon
  title: ReactNode
  body?: ReactNode
  children?: ReactNode
  actions?: ReactNode
  /** `screen` = full result screen (96 tile, 26 title); `inline` = inside content area. */
  size?: 'screen' | 'inline'
  animate?: boolean
  className?: string
}

/** Shared structure for ResultScreen, EmptyState, ErrorState and PermissionState. */
export function StateView({
  icon,
  tone = 'slate',
  status,
  statusLabel,
  statusIcon,
  title,
  body,
  children,
  actions,
  size = 'inline',
  animate = false,
  className,
}: StateViewProps) {
  const screen = size === 'screen'
  return (
    <div
      className={cn(
        'flex flex-col items-center text-center',
        screen ? 'min-h-full px-[22px] pt-11 pb-8' : 'px-5 py-10',
        className,
      )}
    >
      <div className={cn(animate && 'animate-pop')}>
        <IconTile icon={icon} tone={tone} size={screen ? 96 : 88} bordered />
      </div>
      {(status || statusLabel) && (
        <StatusChip
          status={status}
          label={statusLabel}
          tone={status ? undefined : tone}
          icon={statusIcon}
          size="lg"
          className="mt-4"
        />
      )}
      <h1
        className={cn(
          'm-0 mt-4 font-extrabold text-pretty wrap-break-word',
          screen ? 'text-title-xl' : 'text-title-sm',
        )}
      >
        {title}
      </h1>
      {body && (
        <p className="text-body text-text-2 m-0 mt-2 max-w-[340px] text-pretty wrap-break-word">{body}</p>
      )}
      {children && <div className="mt-5 w-full text-start">{children}</div>}
      {actions && (
        <div className={cn('flex w-full flex-col gap-2.5', screen ? 'mt-auto pt-8' : 'mt-6')}>{actions}</div>
      )}
    </div>
  )
}
