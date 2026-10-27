import { Bell, ChevronsUpDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Avatar } from '@/components/common/Avatar'
import { Ltr } from '@/components/common/Ltr'
import { Skeleton } from '@/components/ui/skeleton'
import { count as fmtCount } from '@/lib/format'
import type { Tone } from '@/lib/status'

export function AppHeaderSkeleton() {
  return (
    <header
      aria-busy="true"
      className="border-border bg-bg flex items-center gap-2.5 border-b px-3.5 pt-1.5 pb-3"
    >
      <div className="rounded-btn border-border bg-surface flex min-h-14 min-w-0 flex-1 items-center gap-2.5 border px-2.5 py-1.5">
        <Skeleton className="size-[42px] shrink-0 rounded-full" />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <Skeleton className="h-3.5 w-2/3" />
          <Skeleton className="h-3 w-1/3 opacity-70" />
        </div>
      </div>
      <Skeleton className="rounded-btn h-14 w-[62px] shrink-0" />
    </header>
  )
}

export type HeaderResident = {
  name: string
  initials: string
  place: string
  tone: Tone
  photoUrl?: string | null
}

export function AppHeader({
  resident,
  unread,
  onSwitch,
  onNotifications,
}: {
  resident: HeaderResident
  unread: number
  onSwitch: () => void
  onNotifications: () => void
}) {
  const { t } = useTranslation()
  return (
    <header className="border-border bg-bg flex items-center gap-2.5 border-b px-3.5 pt-1.5 pb-3">
      <button
        type="button"
        onClick={onSwitch}
        className="rounded-btn border-border bg-surface flex min-h-14 min-w-0 flex-1 items-center gap-2.5 border px-2.5 py-1.5 text-start"
      >
        <Avatar initials={resident.initials} photoUrl={resident.photoUrl} tone={resident.tone} size={42} />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-body truncate font-extrabold">
            <span className="sr-only">{t('header.switchResidentSr')} </span>
            {resident.name}
          </span>
          <span className="text-meta text-text-2 truncate">{resident.place}</span>
        </span>
        <span aria-hidden className="text-text-2 flex shrink-0 flex-col items-center">
          <ChevronsUpDown size={18} />
          <span className="text-micro font-bold">{t('header.switch')}</span>
        </span>
      </button>
      <button
        type="button"
        onClick={onNotifications}
        className="rounded-btn border-border bg-surface relative flex min-h-14 w-[62px] shrink-0 flex-col items-center justify-center gap-0.5 border"
      >
        <span aria-hidden className="relative flex">
          <Bell size={22} />
          {unread > 0 && (
            <span className="border-surface bg-danger text-micro absolute -end-2.5 -top-1.5 flex h-[19px] min-w-[19px] items-center justify-center rounded-[10px] border-2 px-[5px] font-extrabold text-white dark:text-bg">
              <Ltr>{fmtCount(unread)}</Ltr>
            </span>
          )}
        </span>
        <span className="text-micro text-text-2 font-bold">
          {t('header.alerts')}
          {unread > 0 && <span className="sr-only">, {t('header.unreadSr', { count: unread })}</span>}
        </span>
      </button>
    </header>
  )
}
