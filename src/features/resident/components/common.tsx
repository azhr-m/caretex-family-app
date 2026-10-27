import type { Person } from '@/api/schemas/common'
import type { ScheduleItem } from '@/api/schemas/resident'
import { useTranslation } from 'react-i18next'
import { Avatar } from '@/components/common/Avatar'
import { StatusChip } from '@/components/common/StatusChip'
import { ROLE_META } from '@/lib/staff'
import { cn } from '@/lib/utils'
import { SCHEDULE_STATUS } from '../meta'

/** Avatar + name + role line (role icon, then any extra meta such as "· 10:15"). */
export function AuthorRow({
  person,
  meta,
  size = 40,
  roleIcon = true,
  className,
}: {
  person: Person
  meta?: React.ReactNode
  size?: number
  roleIcon?: boolean
  className?: string
}) {
  const role = ROLE_META[person.roleCode]
  const RoleIcon = role.icon
  return (
    <div className={cn('flex w-full min-w-0 items-center gap-2.5', className)}>
      <Avatar initials={person.initials} photoUrl={person.photoUrl} tone={role.tone} size={size} />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className={cn('font-extrabold wrap-break-word', size >= 48 ? 'text-body' : 'text-body-sm')}>
          {person.name}
        </span>
        <span
          className={cn(
            'text-text-2 flex min-w-0 items-center gap-[5px]',
            size >= 48 ? 'text-secondary' : 'text-meta',
          )}
        >
          {roleIcon && <RoleIcon aria-hidden size={14} className="shrink-0" />}
          <span className="min-w-0 wrap-break-word">
            {person.role}
            {meta}
          </span>
        </span>
      </div>
    </div>
  )
}

export function ScheduleChip({ status, size = 'sm' }: { status: ScheduleItem['status']; size?: 'sm' | 'md' }) {
  const { t } = useTranslation('resident')
  const m = SCHEDULE_STATUS[status]
  return <StatusChip tone={m.tone} icon={m.icon} label={t(`day.status.${status}`)} size={size} />
}
