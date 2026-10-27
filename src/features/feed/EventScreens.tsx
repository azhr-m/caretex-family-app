import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import {
  Calendar,
  CalendarCheck,
  CalendarDays,
  Circle,
  CircleCheck,
  CircleDot,
  CircleHelp,
  CircleX,
  Minus,
  Newspaper,
  PartyPopper,
  Plus,
  Save,
  UserRound,
  WifiOff,
  type LucideIcon,
} from 'lucide-react'
import { useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import type { RsvpInput } from '@/api/endpoints/more'
import { isApiError } from '@/api/errors'
import { eventQuery } from '@/api/queries/calendar'
import { useMember } from '@/api/queries/me'
import { useRsvp } from '@/api/queries/more'
import type { EventDetail as Event } from '@/api/schemas/calendar'
import { AppFrame, ScreenContent } from '@/components/app/AppFrame'
import { TopBar } from '@/components/app/TopBar'
import { Alert } from '@/components/common/Alert'
import { ListGroup } from '@/components/common/ListRow'
import { Ltr } from '@/components/common/Ltr'
import { SummaryRow } from '@/components/common/SummaryRow'
import { QueryBoundary } from '@/components/states/QueryBoundary'
import { ResultScreen } from '@/components/states/states'
import { Button } from '@/components/ui/button'
import { TextArea, TextField } from '@/components/ui/fields'
import { Skeleton } from '@/components/ui/skeleton'
import { EventDetail, rsvpAnswer } from '@/features/calendar/EventDetail'
import { appNow } from '@/lib/clock'
import { bidiIsolate, date, dateTime, dayMonth, time, weekday } from '@/lib/format'
import { useLang } from '@/lib/hooks'
import { firstName } from '@/lib/names'
import { toneClasses, type Tone } from '@/lib/status'
import { cn } from '@/lib/utils'
import { selectOnline, useNetworkStore } from '@/stores/network'

export function EventScreen({ rid, eventId }: { rid: string; eventId: string }) {
  const { t } = useTranslation(['feed', 'common'])
  const query = useQuery(eventQuery(eventId))
  return (
    <AppFrame>
      <TopBar title={t('event.title')} backLabel={t('common:actions.back')} fallbackHref={`/r/${rid}/more/feed`} />
      <QueryBoundary query={query} skeleton={<Skeleton className="m-4 h-96 rounded-[18px]" />}>
        {(e) => <EventDetail event={e} rid={rid} variant="invitation" />}
      </QueryBoundary>
    </AppFrame>
  )
}

const OPTIONS: { value: RsvpInput['status']; icon: LucideIcon; tone: Tone }[] = [
  { value: 'attending', icon: CircleCheck, tone: 'green' },
  { value: 'not_attending', icon: CircleX, tone: 'red' },
  { value: 'undecided', icon: CircleHelp, tone: 'amber' },
]

export function RsvpScreen({ rid, eventId }: { rid: string; eventId: string }) {
  const { t } = useTranslation(['feed', 'common'])
  const query = useQuery(eventQuery(eventId))
  return (
    <AppFrame>
      <TopBar title={t('rsvp.title')} backLabel={t('common:actions.cancel')} fallbackHref={`/r/${rid}/more/events/${eventId}`} />
      <ScreenContent>
        <QueryBoundary query={query} skeleton={<Skeleton className="h-96 w-full rounded-[18px]" />}>
          {(e) => <RsvpForm key={e.myRsvp?.updatedAt ?? 'new'} event={e} rid={rid} />}
        </QueryBoundary>
      </ScreenContent>
    </AppFrame>
  )
}

function EventSummary({ event: e }: { event: Event }) {
  const lang = useLang()
  const { day, month } = dayMonth(e.startsAt, lang)
  const p = toneClasses.pink
  return (
    <div className="rounded-card border-border bg-surface flex items-center gap-3.5 border p-3.5">
      <div aria-hidden className={cn('flex w-[62px] shrink-0 flex-col items-center rounded-[14px] border py-2', p.bg, p.fg, p.bd)}>
        <span className="text-tag font-extrabold uppercase rtl:normal-case">{month}</span>
        <span className="text-title-lg leading-[1.1] font-black tabular-nums">{day}</span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-body font-extrabold wrap-break-word">{e.title}</span>
        <span className="text-meta text-text-2">
          {weekday(e.startsAt, lang)} · <Ltr>{dateTime(e.startsAt)}</Ltr>
        </span>
        <span className="text-meta text-text-2 wrap-break-word">{e.location}</span>
      </div>
    </div>
  )
}

function RsvpForm({ event: e, rid }: { event: Event; rid: string }) {
  const { t } = useTranslation(['feed', 'states'])
  const navigate = useNavigate()
  const save = useRsvp(rid, e.id)
  const online = useNetworkStore(selectOnline)
  const name = firstName(useMember()?.residents.find((r) => r.id === rid)?.name ?? '')
  const [status, setStatus] = useState<RsvpInput['status'] | null>(e.myRsvp?.status ?? null)
  const [guests, setGuests] = useState(e.myRsvp?.guests ?? 0)
  const [names, setNames] = useState<string[]>(e.myRsvp?.guestNames ?? [])
  const [note, setNote] = useState(e.myRsvp?.note ?? '')
  const [tried, setTried] = useState(false)
  const [failure, setFailure] = useState<'deadline' | 'generic' | null>(null)
  const closed = Date.parse(e.rsvpDeadline) < appNow() || failure === 'deadline'
  const attending = status === 'attending'

  const setGuestCount = (n: number) => {
    const next = Math.min(e.maxGuests, Math.max(0, n))
    setGuests(next)
    setNames((list) => Array.from({ length: next }, (_, i) => list[i] ?? ''))
  }
  const nameError = (n: string) => n.trim().length < 2 || n.trim().length > 60

  const submit = () => {
    setTried(true)
    if (!status || (attending && names.slice(0, guests).some(nameError)) || note.length > 300) return
    setFailure(null)
    save.mutate(
      {
        status,
        guests: attending ? guests : 0,
        guestNames: attending ? names.slice(0, guests).map((n) => n.trim()) : [],
        note: note.trim(),
      },
      {
        onSuccess: () =>
          void navigate({ to: '/r/$rid/more/events/$eventId/rsvp/done', params: { rid, eventId: e.id }, replace: true }),
        onError: (err) => setFailure(isApiError(err) && err.code === 'DEADLINE_PASSED' ? 'deadline' : 'generic'),
      },
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <EventSummary event={e} />
      {closed && <Alert tone="amber" title={t('states:deadline', { date: date(e.rsvpDeadline) })} />}

      <fieldset className="m-0 flex flex-col gap-2.5 border-0 p-0" disabled={closed}>
        <legend className="text-title-xs mb-2.5 p-0 font-extrabold">{t('rsvp.willYou')}</legend>
        <div role="radiogroup" aria-label={t('rsvp.willYou')} className="flex flex-col gap-2.5">
          {OPTIONS.map((o) => {
            const selected = status === o.value
            return (
              <button
                key={o.value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setStatus(o.value)}
                className={cn(
                  'text-body-sm flex min-h-[58px] items-center gap-3 rounded-[16px] border-2 px-3.5 text-start',
                  selected ? 'border-primary bg-pill font-extrabold' : 'border-border bg-surface font-semibold',
                )}
              >
                <o.icon aria-hidden size={24} className={cn('shrink-0', toneClasses[o.tone].fg)} />
                <span className="min-w-0 flex-1">{t(`rsvp.options.${o.value}`)}</span>
                {selected ? (
                  <CircleDot aria-hidden size={22} className="text-primary shrink-0" />
                ) : (
                  <Circle aria-hidden size={22} className="text-text-2 shrink-0" />
                )}
              </button>
            )
          })}
        </div>
        {tried && !status && (
          <p role="alert" className="text-meta text-danger m-0 font-bold">
            {t('rsvp.statusRequired')}
          </p>
        )}
      </fieldset>

      {attending && (
        <fieldset className="m-0 flex flex-col gap-3 border-0 p-0" disabled={closed}>
          <legend className="text-secondary mb-2 p-0 font-bold">{t('rsvp.guests')}</legend>
          <div className="flex items-center justify-center gap-4">
            <Stepper icon={Minus} label={t('rsvp.less')} onClick={() => setGuestCount(guests - 1)} disabled={guests <= 0} />
            <output aria-live="polite" className="text-[28px] min-w-12 text-center font-black tabular-nums">
              {guests}
            </output>
            <Stepper icon={Plus} label={t('rsvp.more')} onClick={() => setGuestCount(guests + 1)} disabled={guests >= e.maxGuests} />
          </div>
          <span className="text-meta text-text-2 text-center">{t('rsvp.guestHelp', { name, count: e.maxGuests })}</span>
          {guests > 0 && (
            <div className="flex flex-col gap-3">
              <span className="text-secondary font-bold">{t('rsvp.guestNames')}</span>
              {names.slice(0, guests).map((n, i) => (
                <TextField
                  key={i}
                  label={t('rsvp.guestN', { n: i + 1 })}
                  icon={UserRound}
                  value={n}
                  maxLength={60}
                  placeholder={t('rsvp.guestPlaceholder')}
                  onChange={(ev) => setNames((list) => list.map((x, j) => (j === i ? ev.target.value : x)))}
                  error={tried && nameError(n) ? t('rsvp.guestNameError') : undefined}
                />
              ))}
            </div>
          )}
        </fieldset>
      )}

      <TextArea
        label={t('rsvp.note')}
        value={note}
        maxLength={300}
        minHeight={100}
        disabled={closed}
        onChange={(ev) => setNote(ev.target.value)}
        helper={t('rsvp.noteHelp')}
      />

      {failure === 'generic' && <Alert title={t('states:mutationError.title')}>{t('states:mutationError.body')}</Alert>}
      <div className="flex flex-col gap-2">
        <Button block icon={Save} loading={save.isPending} disabled={!online || closed} onClick={submit}>
          {t('rsvp.save')}
        </Button>
        {!online ? (
          <p className="text-meta text-text-2 m-0 flex items-center justify-center gap-1.5">
            <WifiOff aria-hidden size={15} />
            {t('rsvp.offline')}
          </p>
        ) : (
          !closed && (
            <p className="text-meta text-text-2 m-0 text-center">
              <Trans t={t} i18nKey="rsvp.changeUntil" values={{ date: date(e.rsvpDeadline) }} components={{ ltr: <Ltr /> }} />
            </p>
          )
        )}
      </div>
    </div>
  )
}

function Stepper({ icon: Icon, label, onClick, disabled }: { icon: LucideIcon; label: string; onClick: () => void; disabled: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="border-border bg-surface disabled:text-disabled-text flex h-14 w-16 flex-col items-center justify-center gap-0.5 rounded-[14px] border"
    >
      <Icon aria-hidden size={20} />
      <span className="text-micro font-extrabold">{label}</span>
    </button>
  )
}

export function RsvpDoneScreen({ rid, eventId }: { rid: string; eventId: string }) {
  const { t } = useTranslation(['feed', 'calendar'])
  const query = useQuery(eventQuery(eventId))
  return (
    <AppFrame>
      <QueryBoundary query={query} skeleton={<Skeleton className="m-6 h-80 rounded-[18px]" />}>
        {(e) => {
          const r = e.myRsvp
          const body = !r
            ? undefined
            : r.status === 'attending'
              ? `${r.guests ? t('saved.bodyAttendingGuests', { count: r.guests }) : t('saved.bodyAttending')} ${t('saved.addedToCalendar')}`
              : r.status === 'not_attending'
                ? t('saved.bodyNotAttending')
                : t('saved.bodyUndecided', { date: bidiIsolate(date(e.rsvpDeadline)) })
          return (
            <ResultScreen
              icon={CalendarCheck}
              tone="green"
              statusLabel={r ? t('saved.chip', { date: bidiIsolate(dateTime(r.updatedAt)) }) : undefined}
              statusIcon={CircleCheck}
              title={t('saved.title')}
              body={body}
              actions={
                <>
                  <Button asChild block>
                    <Link to="/r/$rid/more/feed" params={{ rid }} search={{ cat: 'events' }} replace>
                      <Newspaper aria-hidden size={20} />
                      {t('saved.back')}
                    </Link>
                  </Button>
                  <Button asChild variant="secondary" block>
                    <Link to="/r/$rid/calendar" params={{ rid }} search={{ view: 'list' }}>
                      <CalendarDays aria-hidden size={20} />
                      {t('saved.calendar')}
                    </Link>
                  </Button>
                </>
              }
            >
              <ListGroup>
                <SummaryRow icon={PartyPopper} label={t('saved.event')}>
                  {e.title}
                </SummaryRow>
                <SummaryRow icon={Calendar} label={t('saved.when')}>
                  <Ltr>
                    {date(e.startsAt)} {time(e.startsAt)}
                  </Ltr>
                </SummaryRow>
                {r && (
                  <SummaryRow icon={CircleCheck} label={t('saved.answer')}>
                    {rsvpAnswer(r, (k, o) => t(`calendar:${k}`, o))}
                  </SummaryRow>
                )}
              </ListGroup>
            </ResultScreen>
          )
        }}
      </QueryBoundary>
    </AppFrame>
  )
}
