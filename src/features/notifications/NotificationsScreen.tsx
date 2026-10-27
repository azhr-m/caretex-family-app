import { useInfiniteQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import {
  BellRing,
  CalendarClock,
  CheckCheck,
  ChevronRight,
  CircleCheck,
  ClipboardList,
  FileSignature,
  MessageSquareReply,
  Newspaper,
  PartyPopper,
  type LucideIcon,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { notificationsQuery, useMarkAllNotificationsRead, useMarkNotificationRead } from '@/api/queries/account'
import { useMember } from '@/api/queries/me'
import type { AppNotification, NotificationKind } from '@/api/schemas/account'
import { AppFrame, ScreenContent } from '@/components/app/AppFrame'
import { PullToRefresh, refetchAll } from '@/components/app/PullToRefresh'
import { TopBar } from '@/components/app/TopBar'
import { DirIcon } from '@/components/common/DirIcon'
import { IconTile } from '@/components/common/IconTile'
import { LoadMore } from '@/components/common/LoadMore'
import { Ltr } from '@/components/common/Ltr'
import { SectionHeader } from '@/components/common/SectionHeader'
import { QueryBoundary } from '@/components/states/QueryBoundary'
import { EmptyState } from '@/components/states/states'
import { ListSkeleton } from '@/components/ui/skeleton'
import { toast } from '@/components/ui/toast'
import { appDate } from '@/lib/clock'
import { deepLinkTarget } from '@/lib/deepLink'
import { addDays, date, isoDay, time, weekday } from '@/lib/format'
import { useLang } from '@/lib/hooks'
import type { Tone } from '@/lib/status'
import { cn } from '@/lib/utils'
import { useSessionStore } from '@/stores/session'

const KIND_META: Record<NotificationKind, { icon: LucideIcon; tone: Tone }> = {
  document: { icon: FileSignature, tone: 'violet' },
  inquiry_reply: { icon: MessageSquareReply, tone: 'blue' },
  event: { icon: PartyPopper, tone: 'pink' },
  calendar_change: { icon: CalendarClock, tone: 'amber' },
  update: { icon: Newspaper, tone: 'teal' },
  service_request: { icon: CircleCheck, tone: 'green' },
  survey: { icon: ClipboardList, tone: 'teal' },
  newsletter: { icon: Newspaper, tone: 'violet' },
}

/** 7.1: grouped by day, unread first-class, tap = mark read + deep link (switching resident if needed). */
export function NotificationsScreen({ rid }: { rid: string }) {
  const { t } = useTranslation(['notifications', 'common'])
  const query = useInfiniteQuery(notificationsQuery())
  const markAll = useMarkAllNotificationsRead()
  const unread = query.data?.pages[0]?.unreadCount ?? 0
  return (
    <AppFrame>
      <TopBar
        title={t('title')}
        backLabel={t('common:actions.back')}
        fallbackHref={`/r/${rid}/home`}
        end={
          unread > 0 && (
            <button
              type="button"
              onClick={() =>
                markAll.mutate(undefined, {
                  onSuccess: () => toast.success({ title: t('states:toast.allMarkedRead') }),
                  onError: () => toast.error({ title: t('markFailed') }),
                })
              }
              className="text-meta text-link flex min-h-11 items-center gap-1 px-1 text-end font-bold"
            >
              <CheckCheck aria-hidden size={18} className="shrink-0" />
              <span className="line-clamp-2">{t('markAll')}</span>
            </button>
          )
        }
      />
      <ScreenContent>
        <PullToRefresh onRefresh={() => refetchAll(query.refetch)}>
          <QueryBoundary
            query={query}
            skeleton={<ListSkeleton rows={5} />}
            isEmpty={(d) => d.pages[0]?.items.length === 0}
            empty={<EmptyState icon={BellRing} tone="green" title={t('empty')} body={t('emptyBody')} />}
          >
            {(d) => (
              <div className="flex flex-col gap-4">
                {groupByDay(d.pages.flatMap((p) => p.items)).map(([day, items]) => (
                  <DayGroup key={day} day={day} items={items} rid={rid} />
                ))}
                <LoadMore
                  hasNext={query.hasNextPage}
                  loading={query.isFetchingNextPage}
                  onLoad={() => void query.fetchNextPage()}
                  loadingLabel={t('loadingMore')}
                />
              </div>
            )}
          </QueryBoundary>
        </PullToRefresh>
      </ScreenContent>
    </AppFrame>
  )
}

function groupByDay(items: AppNotification[]) {
  const map = new Map<string, AppNotification[]>()
  for (const n of items) {
    const d = isoDay(n.createdAt)
    map.set(d, [...(map.get(d) ?? []), n])
  }
  return [...map]
}

function DayGroup({ day, items, rid }: { day: string; items: AppNotification[]; rid: string }) {
  const { t } = useTranslation('notifications')
  const lang = useLang()
  const today = isoDay(appDate())
  const instant = items[0]!.createdAt
  const prefix = day === today ? t('today') : day === addDays(today, -1) ? t('yesterday') : weekday(instant, lang)
  return (
    <section className="flex flex-col gap-2">
      <SectionHeader>
        {prefix} · <Ltr>{date(instant)}</Ltr>
      </SectionHeader>
      <ul className="rounded-card border-border bg-surface m-0 flex list-none flex-col overflow-hidden border p-0">
        {items.map((n) => (
          <li key={n.id} className="border-border border-b last:border-b-0">
            <Row n={n} rid={rid} />
          </li>
        ))}
      </ul>
    </section>
  )
}

function Row({ n, rid }: { n: AppNotification; rid: string }) {
  const { t } = useTranslation(['notifications', 'auth'])
  const navigate = useNavigate()
  const markRead = useMarkNotificationRead()
  const member = useMember()
  const meta = KIND_META[n.kind]
  const unread = !n.readAt

  const open = () => {
    if (unread) markRead.mutate(n.id)
    const target = n.link.residentId
    if (target && target !== rid) {
      const resident = member?.residents.find((r) => r.id === target)
      if (!resident) return toast.error({ title: t('notLinked') })
      useSessionStore.getState().setActiveResident(target)
      toast.success({ title: t('auth:switcher.nowViewing', { name: resident.name }) })
    }
    void navigate(deepLinkTarget(n.link, rid))
  }

  return (
    <button
      type="button"
      onClick={open}
      className={cn('flex min-h-16 w-full items-center gap-3 px-3.5 py-3 text-start', unread && 'bg-unread')}
    >
      <span aria-hidden className={cn('size-2 shrink-0 rounded-full', unread ? 'bg-blue-fg' : 'bg-transparent')} />
      <IconTile icon={meta.icon} tone={meta.tone} size={40} />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className={cn('text-body-sm leading-[1.3] wrap-break-word', unread ? 'font-extrabold' : 'font-semibold')}>
          {n.title}
        </span>
        <span className="text-meta text-text-2">
          {t(`kinds.${n.kind}`)} · <Ltr>{time(n.createdAt)}</Ltr> · {unread ? t('new') : t('read')}
        </span>
      </span>
      <DirIcon icon={ChevronRight} size={20} className="text-text-2" />
    </button>
  )
}
