import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { ChevronLeft, ChevronRight, Info, Sun } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useMember } from '@/api/queries/me'
import { scheduleQuery } from '@/api/queries/residents'
import type { Schedule, ScheduleItem } from '@/api/schemas/resident'
import { PullToRefresh, refetchAll } from '@/components/app/PullToRefresh'
import { InfoBox } from '@/components/common/Card'
import { DirIcon } from '@/components/common/DirIcon'
import { IconTile } from '@/components/common/IconTile'
import { Ltr } from '@/components/common/Ltr'
import { QueryBoundary } from '@/components/states/QueryBoundary'
import { EmptyState } from '@/components/states/states'
import { Skeleton } from '@/components/ui/skeleton'
import { appDate } from '@/lib/clock'
import { addDays, date, dayInstant, isoDay, relativeDay, time, weekday } from '@/lib/format'
import { useLang } from '@/lib/hooks'
import { firstName } from '@/lib/names'
import { cn } from '@/lib/utils'
import { ScheduleChip } from '../components/common'
import { SectionGate, permissionStates } from '../components/SectionGate'
import { SCHEDULE_KIND } from '../meta'

type Day = Exclude<Schedule, { state: 'not_shared' }>

export function DayScreen({ rid, date: requested }: { rid: string; date?: string }) {
  const today = isoDay(appDate())
  const tomorrow = addDays(today, 1)
  // Days after tomorrow aren't published yet.
  const day = requested && requested <= tomorrow ? requested : today
  return (
    <SectionGate rid={rid} permission="schedule">
      <div className="flex flex-col gap-3.5">
        <DaySwitcher rid={rid} day={day} tomorrow={tomorrow} />
        <DayQuery key={day} rid={rid} day={day} isToday={day === today} />
      </div>
    </SectionGate>
  )
}

function DaySwitcher({ rid, day, tomorrow }: { rid: string; day: string; tomorrow: string }) {
  const { t } = useTranslation('resident')
  const lang = useLang()
  const label = (iso: string) => {
    const rel = relativeDay(iso)
    return rel ? t(`day.${rel}`) : <Ltr>{date(dayInstant(iso)).slice(0, 5)}</Ltr>
  }
  const rel = relativeDay(day)
  const prev = addDays(day, -1)
  const next = addDays(day, 1)
  const canNext = next <= tomorrow
  const btn = 'border-border bg-surface text-meta flex h-11 shrink-0 items-center gap-1 rounded-[12px] border px-2.5 font-extrabold'
  return (
    <div className="flex items-center gap-2">
      <Link
        to="/r/$rid/resident/day"
        params={{ rid }}
        search={{ date: prev }}
        replace
        aria-label={t('day.prevLabel')}
        className={btn}
      >
        <DirIcon icon={ChevronLeft} size={18} />
        <span>{label(prev)}</span>
      </Link>
      <div className="flex min-w-0 flex-1 flex-col items-center text-center" aria-live="polite">
        <span className="text-body font-extrabold">{rel ? t(`day.${rel}`) : weekday(dayInstant(day), lang)}</span>
        <span className="text-meta text-text-2">
          {rel ? (
            <Trans
              t={t}
              i18nKey="day.dateLabel"
              values={{ weekday: weekday(dayInstant(day), lang), date: date(dayInstant(day)) }}
              components={{ ltr: <Ltr /> }}
            />
          ) : (
            <Ltr>{date(dayInstant(day))}</Ltr>
          )}
        </span>
      </div>
      {canNext ? (
        <Link
          to="/r/$rid/resident/day"
          params={{ rid }}
          search={{ date: next }}
          replace
          aria-label={t('day.nextLabel')}
          className={btn}
        >
          <span>{label(next)}</span>
          <DirIcon icon={ChevronRight} size={18} />
        </Link>
      ) : (
        <span aria-disabled="true" aria-label={t('day.nextLabel')} className={cn(btn, 'text-disabled-text')}>
          <span>{label(next)}</span>
          <DirIcon icon={ChevronRight} size={18} />
        </span>
      )}
    </div>
  )
}

function DayQuery({ rid, day, isToday }: { rid: string; day: string; isToday: boolean }) {
  const { t } = useTranslation('resident')
  const query = useQuery(scheduleQuery(rid, day))
  const name = firstName(useMember()?.residents.find((r) => r.id === rid)?.name ?? '')
  return (
    <PullToRefresh onRefresh={() => refetchAll(query.refetch)}>
      <QueryBoundary
        query={query}
        skeleton={<TimelineSkeleton />}
        permission={permissionStates(rid, 'schedule')}
        isNotShared={(s) => 'state' in s}
        isEmpty={(s) => !('state' in s) && s.items.length === 0}
        empty={<EmptyState icon={Sun} title={t('day.empty')} />}
      >
        {(s) => {
          const d = s as Day
          return (
            <div className="flex flex-col gap-3.5">
              <Timeline items={d.items} autoScroll={isToday} />
              <InfoBox icon={Info} className="text-meta">
                <Trans
                  t={t}
                  i18nKey="day.note"
                  values={{ name, by: d.lastUpdatedBy, time: time(d.lastUpdatedAt) }}
                  components={{ ltr: <Ltr /> }}
                />
              </InfoBox>
            </div>
          )
        }}
      </QueryBoundary>
    </PullToRefresh>
  )
}

/** Time · rail with dots (done green, now amber ring, upcoming hollow) · card. */
function Timeline({ items, autoScroll }: { items: ScheduleItem[]; autoScroll: boolean }) {
  const nowRef = useRef<HTMLLIElement>(null)
  useEffect(() => {
    if (autoScroll) nowRef.current?.scrollIntoView({ block: 'center' })
  }, [autoScroll])

  const passed = (s: ScheduleItem['status']) => s === 'done' || s === 'now'
  return (
    <ol className="m-0 flex list-none flex-col p-0">
      {items.map((d, i) => {
        const m = SCHEDULE_KIND[d.kind]
        const upcoming = d.status === 'upcoming' || d.status === 'cancelled'
        return (
          <li key={d.id} ref={d.status === 'now' ? nowRef : undefined} className="flex items-stretch gap-2.5">
            <Ltr
              className={cn(
                'text-secondary w-[46px] shrink-0 pt-3.5 text-start font-extrabold tabular-nums',
                upcoming && 'text-text-2',
              )}
            >
              {time(d.startsAt)}
            </Ltr>
            <div aria-hidden className="flex w-5 shrink-0 flex-col items-center">
              <div
                className={cn('h-4 w-0.5', i === 0 ? 'bg-transparent' : passed(d.status) ? 'bg-green-fg' : 'bg-border')}
              />
              <div
                className={cn(
                  'size-3.5 shrink-0 rounded-full border-[3px]',
                  d.status === 'done' && 'border-green-fg bg-green-fg',
                  d.status === 'now' && 'border-amber-bd bg-amber-fg',
                  upcoming && 'border-border bg-surface',
                )}
              />
              <div
                className={cn(
                  'w-0.5 flex-1',
                  i === items.length - 1 ? 'bg-transparent' : d.status === 'done' ? 'bg-green-fg' : 'bg-border',
                )}
              />
            </div>
            <div
              className={cn(
                'bg-surface my-1 flex min-h-11 min-w-0 flex-1 items-center gap-2.5 rounded-[14px] px-3 py-2.5',
                d.status === 'now' ? 'border-amber-fg border-2' : 'border-border border',
                d.status === 'cancelled' && 'opacity-60',
              )}
            >
              <IconTile icon={m.icon} tone={m.tone} size={36} />
              <div className="flex min-w-0 flex-1 flex-col">
                <span
                  className={cn(
                    'text-body-sm font-extrabold wrap-break-word',
                    d.status === 'cancelled' && 'line-through',
                  )}
                >
                  {d.title}
                </span>
                <span className="text-tag text-text-2 wrap-break-word">{d.place}</span>
              </div>
              <ScheduleChip status={d.status} />
            </div>
          </li>
        )
      })}
    </ol>
  )
}

function TimelineSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="flex items-center gap-2.5">
          <Skeleton className="h-4 w-[46px]" />
          <Skeleton className="size-3.5 rounded-full" />
          <Skeleton className="h-[58px] flex-1 rounded-[14px]" />
        </div>
      ))}
    </div>
  )
}
