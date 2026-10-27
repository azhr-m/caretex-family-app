import { useMutationState, useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import {
  Calendar,
  CalendarCheck,
  CalendarPlus,
  CircleAlert,
  CircleCheck,
  ClipboardList,
  Clock,
  History,
  Info,
  MapPin,
  MessageSquarePlus,
  NotebookText,
  UserRound,
} from 'lucide-react'
import { Trans, useTranslation } from 'react-i18next'
import { downloadIcs } from '@/api/endpoints/calendar'
import { useMember } from '@/api/queries/me'
import { calendarItemQuery, eventQuery, useConfirmItem } from '@/api/queries/calendar'
import type { CalendarItemDetail } from '@/api/schemas/calendar'
import { AppFrame, ScreenContent } from '@/components/app/AppFrame'
import { TopBar } from '@/components/app/TopBar'
import { InfoBox } from '@/components/common/Card'
import { IconTile } from '@/components/common/IconTile'
import { Ltr } from '@/components/common/Ltr'
import { StatusChip } from '@/components/common/StatusChip'
import { QueryBoundary } from '@/components/states/QueryBoundary'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/components/ui/toast'
import { date, dateTime, time, weekday } from '@/lib/format'
import { useLang } from '@/lib/hooks'
import { firstName } from '@/lib/names'
import { toneClasses } from '@/lib/status'
import { cn, uuid } from '@/lib/utils'
import { DetailRows, type DetailRow } from './DetailRows'
import { EventDetail } from './EventDetail'
import { CATEGORY_DEPARTMENT, CATEGORY_ICON } from './meta'

export function CalendarItemScreen({ rid, itemId }: { rid: string; itemId: string }) {
  const { t } = useTranslation('calendar')
  const query = useQuery(calendarItemQuery(itemId))
  const isEvent = query.data?.kind === 'center_event'
  return (
    <AppFrame>
      <TopBar
        title={isEvent ? t('event.title') : t('appt.title')}
        backLabel={t('appt.back')}
        fallbackHref={`/r/${rid}/calendar`}
      />
      <QueryBoundary query={query} skeleton={<DetailSkeleton />}>
        {(item) =>
          item.kind === 'center_event' && item.eventId ? (
            <CenterEvent eventId={item.eventId} rid={rid} />
          ) : (
            <ScreenContent>
              <Appointment item={item} rid={rid} />
            </ScreenContent>
          )
        }
      </QueryBoundary>
    </AppFrame>
  )
}

function CenterEvent({ eventId, rid }: { eventId: string; rid: string }) {
  const query = useQuery(eventQuery(eventId))
  return (
    <QueryBoundary query={query} skeleton={<DetailSkeleton />}>
      {(e) => <EventDetail event={e} rid={rid} />}
    </QueryBoundary>
  )
}

function Appointment({ item: i, rid }: { item: CalendarItemDetail; rid: string }) {
  const { t } = useTranslation('calendar')
  const lang = useLang()
  const resident = useMember()?.residents.find((r) => r.id === rid)
  const name = firstName(resident?.name ?? '')
  const confirm = useConfirmItem(rid, i.id, resident?.ward ?? '')
  const queued = useMutationState({
    filters: { mutationKey: ['confirm', i.id], status: 'pending' },
    select: (m) => m.state.isPaused,
  })
  const confirmed = i.confirmation === 'confirmed'
  const waiting = queued.length > 0
  const Icon = CATEGORY_ICON[i.category]
  const when = i.allDay
    ? date(i.startsAt)
    : i.endsAt
      ? `${date(i.startsAt)} · ${time(i.startsAt)}–${time(i.endsAt)}`
      : dateTime(i.startsAt)

  const rows: DetailRow[] = [
    {
      icon: Calendar,
      label: t('appt.dateTime'),
      value: (
        <Trans t={t} i18nKey="appt.dateTimeValue" values={{ weekday: weekday(i.startsAt, lang), when }} components={{ ltr: <Ltr /> }} />
      ),
    },
    { icon: MapPin, label: t('appt.location'), value: i.location },
    ...(i.with ? [{ icon: UserRound, label: t('appt.with'), value: i.with }] : []),
    ...(i.purpose ? [{ icon: ClipboardList, label: t('appt.purpose'), value: i.purpose }] : []),
    ...(i.changed
      ? [
          {
            icon: History,
            label: t('appt.changed'),
            value: (
              <Trans
                t={t}
                i18nKey="appt.changedValue"
                values={{ from: date(i.changed.from), at: date(i.changed.at) }}
                components={{ ltr: <Ltr /> }}
              />
            ),
          },
        ]
      : []),
    ...(i.notes ? [{ icon: NotebookText, label: t('appt.notes'), value: i.notes }] : []),
  ]

  const addToCalendar = () =>
    downloadIcs(i.id, `${i.id}.ics`).catch(() => toast.error({ title: t('appt.downloadFailed') }))

  return (
    <article className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <StatusChip tone="blue" icon={UserRound} label={t('legend.personal', { name })} />
        {i.requiresConfirmation &&
          (confirmed ? (
            <StatusChip tone="green" icon={CircleCheck} label={t('appt.confirmed')} />
          ) : (
            <StatusChip tone="violet" icon={CircleAlert} label={t('appt.needsConfirm')} />
          ))}
      </div>
      <div className="flex items-center gap-3">
        <IconTile icon={Icon} tone="blue" size={56} />
        <h1 className="text-title-md m-0 leading-[1.25] font-extrabold text-pretty wrap-break-word">{i.title}</h1>
      </div>
      <DetailRows rows={rows} />
      {i.requiresConfirmation && <InfoBox icon={Info}>{t('appt.note')}</InfoBox>}

      {i.requiresConfirmation &&
        (confirmed ? (
          <div
            role="status"
            className={cn(
              'text-button-lg flex min-h-14 items-center justify-center gap-2.5 rounded-[16px] border font-extrabold',
              toneClasses.green.bg,
              toneClasses.green.bd,
              toneClasses.green.fg,
            )}
          >
            <CircleCheck aria-hidden size={20} />
            {t('appt.youConfirmed')}
          </div>
        ) : waiting && queued[0] ? (
          <div
            role="status"
            className={cn(
              'text-secondary flex min-h-14 items-center justify-center gap-2 rounded-[16px] border px-4 font-extrabold',
              toneClasses.amber.bg,
              toneClasses.amber.bd,
              toneClasses.amber.fg,
            )}
          >
            <Clock aria-hidden size={18} />
            {t('states:queued')}
          </div>
        ) : (
          <Button block icon={CalendarCheck} loading={confirm.isPending || waiting} onClick={() => confirm.mutate(uuid())}>
            {t('appt.confirm')}
          </Button>
        ))}

      <div className="grid grid-cols-2 gap-2.5">
        <Button asChild variant="secondary" size="compact">
          <Link
            to="/r/$rid/staff/new"
            params={{ rid }}
            search={{
              dept: CATEGORY_DEPARTMENT[i.category],
              subject: t('appt.askSubject', { title: i.title }).slice(0, 80),
              ref: `calendar_item:${i.id}`,
            }}
          >
            <MessageSquarePlus aria-hidden size={18} />
            {t('appt.ask')}
          </Link>
        </Button>
        <Button variant="secondary" size="compact" icon={CalendarPlus} onClick={() => void addToCalendar()}>
          {t('appt.addToCalendar')}
        </Button>
      </div>
    </article>
  )
}

function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <Skeleton className="h-6 w-1/2" />
      <Skeleton className="h-14 w-full" />
      <Skeleton className="h-60 w-full rounded-[18px]" />
      <Skeleton className="h-14 w-full rounded-[16px]" />
    </div>
  )
}
