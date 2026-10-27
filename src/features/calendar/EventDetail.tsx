import { Link } from '@tanstack/react-router'
import {
  Accessibility,
  Building2,
  Calendar,
  CalendarCheck,
  CircleCheck,
  CircleX,
  Clock,
  Hourglass,
  MapPin,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { Trans, useTranslation } from 'react-i18next'
import type { EventDetail as Event, RsvpStatus } from '@/api/schemas/calendar'
import { ImagePlaceholder } from '@/components/common/ImagePlaceholder'
import { Ltr } from '@/components/common/Ltr'
import { StatusChip } from '@/components/common/StatusChip'
import { Button } from '@/components/ui/button'
import { appNow } from '@/lib/clock'
import { date, dateTime, time, weekday } from '@/lib/format'
import { useLang } from '@/lib/hooks'
import type { Tone } from '@/lib/status'
import { DetailRows, type DetailRow } from './DetailRows'

const RSVP_CHIP: Record<RsvpStatus | 'none', { tone: Tone; icon: LucideIcon }> = {
  none: { tone: 'amber', icon: Hourglass },
  attending: { tone: 'green', icon: CircleCheck },
  not_attending: { tone: 'slate', icon: CircleX },
  undecided: { tone: 'amber', icon: Hourglass },
}

/** Center event detail (design `calEvent` / 6.4). RSVP itself is the Phase 4 route. */
export function EventDetail({ event: e, rid }: { event: Event; rid: string }) {
  const { t } = useTranslation('calendar')
  const lang = useLang()
  const rsvp = RSVP_CHIP[e.myRsvp?.status ?? 'none']
  const closed = Date.parse(e.rsvpDeadline) < appNow()
  const when = e.endsAt ? `${date(e.startsAt)} · ${time(e.startsAt)}–${time(e.endsAt)}` : dateTime(e.startsAt)

  const rows: DetailRow[] = [
    {
      icon: Calendar,
      label: t('event.dateTime'),
      value: (
        <Trans t={t} i18nKey="appt.dateTimeValue" values={{ weekday: weekday(e.startsAt, lang), when }} components={{ ltr: <Ltr /> }} />
      ),
    },
    { icon: MapPin, label: t('event.location'), value: e.location },
    { icon: Users, label: t('event.who'), value: t('event.whoValue', { count: e.maxGuests }) },
    { icon: Accessibility, label: t('event.accessibility'), value: e.accessibility },
  ]

  return (
    <article className="flex flex-col">
      {e.coverUrl ? (
        <img src={e.coverUrl} alt="" className="h-[180px] w-full object-cover" />
      ) : (
        <ImagePlaceholder className="h-[180px] w-full" />
      )}
      <div className="flex flex-col gap-4 px-4 pt-4 pb-7">
        <div className="flex flex-wrap gap-2">
          <StatusChip tone="pink" icon={Building2} label={t('legend.center')} />
          <StatusChip tone={rsvp.tone} icon={rsvp.icon} label={t(`event.rsvp.${e.myRsvp?.status ?? 'none'}`)} />
        </div>
        <h1 className="text-title-md m-0 leading-[1.25] font-extrabold text-pretty wrap-break-word">{e.title}</h1>
        <p className="text-body text-text-2 m-0 whitespace-pre-line wrap-break-word">{e.body}</p>
        <DetailRows rows={rows} />
        {e.program.length > 0 && (
          <section className="flex flex-col gap-2">
            <h2 className="text-tag text-label m-0 font-extrabold tracking-[.06em] uppercase rtl:tracking-normal">
              {t('event.program')}
            </h2>
            <ol className="rounded-card border-border bg-surface m-0 flex list-none flex-col border p-0">
              {e.program.map((p) => (
                <li key={p.time + p.title} className="border-border flex min-h-11 items-center gap-3 border-b px-3.5 py-2.5 last:border-b-0">
                  <Clock aria-hidden size={16} className="text-text-2 shrink-0" />
                  <Ltr className="text-secondary w-11 shrink-0 text-start font-extrabold tabular-nums">{p.time}</Ltr>
                  <span className="text-body-sm min-w-0 flex-1 font-bold wrap-break-word">{p.title}</span>
                </li>
              ))}
            </ol>
          </section>
        )}
        {closed ? (
          <p className="text-secondary text-text-2 m-0 text-center">
            <Trans t={t} i18nKey="event.rsvpClosed" values={{ date: date(e.rsvpDeadline) }} components={{ ltr: <Ltr /> }} />
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            <Button asChild block>
              <Link to="/r/$rid/more/events/$eventId/rsvp" params={{ rid, eventId: e.id }}>
                <CalendarCheck aria-hidden size={20} />
                {e.myRsvp ? t('event.changeRsvp') : t('event.rsvpButton')}
              </Link>
            </Button>
            <p className="text-meta text-text-2 m-0 text-center">
              <Trans t={t} i18nKey="event.rsvpBy" values={{ date: date(e.rsvpDeadline) }} components={{ ltr: <Ltr /> }} />
            </p>
          </div>
        )}
      </div>
    </article>
  )
}
