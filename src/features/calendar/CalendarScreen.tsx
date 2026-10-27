import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import {
  Building2,
  Calendar,
  CalendarCheck,
  CalendarRange,
  CalendarX,
  ChevronLeft,
  ChevronRight,
  Clock,
  List,
  Minus,
  UserRound,
} from 'lucide-react'
import { Trans, useTranslation } from 'react-i18next'
import { useMember } from '@/api/queries/me'
import { calendarQuery } from '@/api/queries/calendar'
import type { CalendarItemSummary } from '@/api/schemas/calendar'
import { PullToRefresh, refetchAll } from '@/components/app/PullToRefresh'
import { DirIcon } from '@/components/common/DirIcon'
import { IconTile } from '@/components/common/IconTile'
import { Ltr } from '@/components/common/Ltr'
import { SectionHeader } from '@/components/common/SectionHeader'
import { QueryBoundary } from '@/components/states/QueryBoundary'
import { EmptyState } from '@/components/states/states'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { ListSkeleton, Skeleton } from '@/components/ui/skeleton'
import { appDate } from '@/lib/clock'
import {
  addDays,
  addMonths,
  date,
  dayInstant,
  isoDay,
  monthGrid,
  monthStart,
  monthYear,
  startOfWeek,
  time,
  weekday,
} from '@/lib/format'
import { useLang } from '@/lib/hooks'
import { firstName } from '@/lib/names'
import { toneClasses } from '@/lib/status'
import { cn } from '@/lib/utils'
import { CATEGORY_ICON, kindTone } from './meta'

export type CalendarView = 'month' | 'week' | 'list'
export type CalendarSearch = { view?: CalendarView; date?: string }

const LIST_DAYS = 120

/** Literal classes so Tailwind generates them. */
const START_BORDER = { blue: 'border-s-blue-fg', pink: 'border-s-pink-fg' } as const

export function CalendarScreen({ rid, search }: { rid: string; search: CalendarSearch }) {
  const { t } = useTranslation('calendar')
  const navigate = useNavigate()
  const view = search.view ?? 'month'
  const today = isoDay(appDate())
  const day = search.date ?? today
  const name = firstName(useMember()?.residents.find((r) => r.id === rid)?.name ?? '')

  const set = (patch: CalendarSearch) =>
    void navigate({ to: '/r/$rid/calendar', params: { rid }, search: (prev) => ({ ...prev, ...patch }), replace: true })

  return (
    <div className="flex flex-col gap-3.5">
      <SegmentedControl
        label={t('views.label')}
        value={view}
        onChange={(v) => set({ view: v === 'month' ? undefined : v })}
        options={[
          { value: 'month', label: t('views.month'), icon: Calendar },
          { value: 'week', label: t('views.week'), icon: CalendarRange },
          { value: 'list', label: t('views.list'), icon: List },
        ]}
      />
      <div className="flex flex-wrap gap-2">
        <LegendChip tone="blue" icon={UserRound} marker="dot">
          {t('legend.personal', { name })}
        </LegendChip>
        <LegendChip tone="pink" icon={Building2} marker="diamond">
          {t('legend.center')}
        </LegendChip>
      </div>
      {view === 'month' && (
        <MonthView rid={rid} day={day} today={today} onSelect={(d) => set({ date: d === today ? undefined : d })} />
      )}
      {view === 'week' && <WeekView rid={rid} day={day} today={today} onDay={(d) => set({ date: d })} />}
      {view === 'list' && <ListView rid={rid} from={day} today={today} />}
    </div>
  )
}

function LegendChip({
  tone,
  icon: Icon,
  marker,
  children,
}: {
  tone: 'blue' | 'pink'
  icon: typeof UserRound
  marker: 'dot' | 'diamond'
  children: React.ReactNode
}) {
  const c = toneClasses[tone]
  return (
    <span className={cn('rounded-pill text-tag inline-flex items-center gap-1.5 border px-2.5 py-1 font-extrabold', c.bg, c.fg, c.bd)}>
      <Marker kind={marker} tone={tone} />
      <Icon aria-hidden size={14} />
      {children}
    </span>
  )
}

function Marker({ kind, tone }: { kind: 'dot' | 'diamond'; tone: 'blue' | 'pink' }) {
  return kind === 'dot' ? (
    <span aria-hidden className={cn('size-[7px] shrink-0 rounded-full', toneClasses[tone].solid)} />
  ) : (
    <span aria-hidden className={cn('size-1.5 shrink-0 rotate-45', toneClasses[tone].solid)} />
  )
}

const byDay = (items: CalendarItemSummary[]) => {
  const map = new Map<string, CalendarItemSummary[]>()
  for (const i of items) {
    const d = isoDay(i.startsAt)
    map.set(d, [...(map.get(d) ?? []), i])
  }
  return map
}

function MonthView({
  rid,
  day,
  today,
  onSelect,
}: {
  rid: string
  day: string
  today: string
  onSelect: (day: string) => void
}) {
  const { t } = useTranslation('calendar')
  const lang = useLang()
  const grid = monthGrid(day)
  const month = day.slice(0, 7)
  const query = useQuery(calendarQuery(rid, grid[0]!, grid.at(-1)!))
  const items = byDay(query.data?.items ?? [])
  const goMonth = (n: number) => {
    const first = addMonths(monthStart(day), n)
    onSelect(first.slice(0, 7) === today.slice(0, 7) ? today : first)
  }
  const weekdays = grid.slice(0, 7).map((d) => weekday(dayInstant(d), lang, lang === 'he' ? 'narrow' : 'short'))
  const selected = items.get(day) ?? []

  return (
    <PullToRefresh onRefresh={() => refetchAll(query.refetch)}>
      <div className="flex flex-col gap-3.5">
        <div className="rounded-card border-border bg-surface flex flex-col gap-2.5 border p-3">
          <div className="flex items-center gap-2">
            <NavSquare label={t('month.prev')} icon={ChevronLeft} onClick={() => goMonth(-1)} />
            <h2 className="text-title-xs m-0 flex-1 text-center font-extrabold" aria-live="polite">
              {monthYear(dayInstant(monthStart(day)), lang)}
            </h2>
            <NavSquare label={t('month.next')} icon={ChevronRight} onClick={() => goMonth(1)} />
          </div>
          <div role="grid" aria-label={monthYear(dayInstant(monthStart(day)), lang)} className="grid grid-cols-7 gap-0.5">
            <div role="row" className="contents">
              {weekdays.map((w, i) => (
                <span key={i} role="columnheader" className="text-tag text-label py-1 text-center font-extrabold">
                  {w}
                </span>
              ))}
            </div>
            {Array.from({ length: grid.length / 7 }, (_, row) => (
              <div key={row} role="row" className="contents">
                {grid.slice(row * 7, row * 7 + 7).map((d) => {
                  const inMonth = d.slice(0, 7) === month
                  const list = items.get(d) ?? []
                  const isToday = d === today
                  const isSelected = d === day
                  const num = String(Number(d.slice(8)))
                  if (!inMonth) {
                    return (
                      <span key={d} role="gridcell" aria-hidden className="text-label text-body-sm flex h-12 items-start justify-center pt-2.5 font-semibold">
                        {num}
                      </span>
                    )
                  }
                  return (
                    <button
                      key={d}
                      type="button"
                      role="gridcell"
                      aria-selected={isSelected}
                      aria-current={isToday ? 'date' : undefined}
                      aria-label={t('month.cellLabel', { date: date(dayInstant(d)), count: list.length })}
                      onClick={() => onSelect(d)}
                      className={cn(
                        'flex h-12 flex-col items-center justify-center gap-[3px] rounded-[12px] border-2',
                        isSelected ? 'bg-primary text-on-primary border-transparent' : isToday ? 'border-primary' : 'border-transparent',
                      )}
                    >
                      <span className={cn('text-body-sm leading-none tabular-nums', isToday || isSelected ? 'font-black' : 'font-semibold')}>
                        {num}
                      </span>
                      <span aria-hidden className="flex h-2 items-center gap-[3px]">
                        {list.some((i) => i.kind === 'personal') && <Marker kind="dot" tone="blue" />}
                        {list.some((i) => i.kind === 'center_event') && <Marker kind="diamond" tone="pink" />}
                      </span>
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        <DayHeader day={day} today={today} />
        <QueryBoundary query={query} skeleton={<ListSkeleton rows={1} />}>
          {() =>
            selected.length ? (
              <div className="flex flex-col gap-2.5">
                {selected.map((i) => (
                  <ItemRow key={i.id} item={i} rid={rid} />
                ))}
              </div>
            ) : (
              <div className="rounded-[16px] bg-surface-2 text-secondary text-text-2 flex items-center gap-2.5 p-4">
                <CalendarX aria-hidden size={20} className="shrink-0" />
                {t('nothingDay')}
              </div>
            )
          }
        </QueryBoundary>
      </div>
    </PullToRefresh>
  )
}

function DayHeader({ day, today }: { day: string; today: string }) {
  const { t } = useTranslation('calendar')
  const lang = useLang()
  return (
    <SectionHeader icon={CalendarCheck}>
      <Trans
        t={t}
        i18nKey={day === today ? 'todayHeader' : 'dayHeader'}
        values={{ weekday: weekday(dayInstant(day), lang), date: date(dayInstant(day)) }}
        components={{ ltr: <Ltr /> }}
      />
    </SectionHeader>
  )
}

function NavSquare({ label, icon, onClick }: { label: string; icon: typeof ChevronLeft; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="border-border bg-surface-2 flex size-11 shrink-0 items-center justify-center rounded-[12px] border"
    >
      <DirIcon icon={icon} size={20} />
    </button>
  )
}

function itemTime(i: CalendarItemSummary, allDay: string) {
  return i.allDay ? allDay : time(i.startsAt)
}

/** Month / week row: tone border at the start, tile, title, time · type, chevron. */
function ItemRow({ item: i, rid, compact = false }: { item: CalendarItemSummary; rid: string; compact?: boolean }) {
  const { t } = useTranslation('calendar')
  const name = firstName(useMember()?.residents.find((r) => r.id === rid)?.name ?? '')
  const tone = kindTone(i.kind)
  const type = i.kind === 'personal' ? t('legend.personal', { name }) : t('legend.center')
  return (
    <Link
      to="/r/$rid/calendar/$itemId"
      params={{ rid, itemId: i.id }}
      className={cn(
        'border-border bg-surface flex items-center gap-3 rounded-[16px] border border-s-4 text-start',
        compact ? 'min-h-12 px-3 py-2' : 'min-h-16 px-3.5 py-3',
        START_BORDER[tone],
      )}
    >
      {compact ? (
        <CategoryIcon item={i} />
      ) : (
        <IconTile icon={CATEGORY_ICON[i.category]} tone={tone} size={42} />
      )}
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className={cn('leading-[1.3] font-extrabold text-pretty wrap-break-word', compact ? 'text-secondary' : 'text-body-sm')}>
          {i.title}
        </span>
        <span className={cn('text-text-2 flex flex-wrap items-center gap-x-1.5', compact ? 'text-tag' : 'text-meta')}>
          {!compact && <Clock aria-hidden size={13} className="shrink-0" />}
          <Ltr>{itemTime(i, t('allDay'))}</Ltr>
          <span>· {type}</span>
        </span>
      </span>
      {!compact && <DirIcon icon={ChevronRight} size={20} className="text-text-2" />}
    </Link>
  )
}

function CategoryIcon({ item }: { item: CalendarItemSummary }) {
  const Icon = CATEGORY_ICON[item.category]
  return <Icon aria-hidden size={18} className={cn('shrink-0', toneClasses[kindTone(item.kind)].fg)} />
}

function WeekView({ rid, day, today, onDay }: { rid: string; day: string; today: string; onDay: (d: string) => void }) {
  const { t } = useTranslation('calendar')
  const lang = useLang()
  const start = startOfWeek(day)
  const end = addDays(start, 6)
  const query = useQuery(calendarQuery(rid, start, end))
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i))
  const thisWeek = today >= start && today <= end

  return (
    <PullToRefresh onRefresh={() => refetchAll(query.refetch)}>
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center gap-2">
          <NavSquare label={t('week.prev')} icon={ChevronLeft} onClick={() => onDay(addDays(start, -7))} />
          <div className="flex min-w-0 flex-1 flex-col items-center" aria-live="polite">
            {thisWeek && <span className="text-body font-extrabold">{t('week.this')}</span>}
            <Ltr className={cn(thisWeek ? 'text-meta text-text-2' : 'text-body font-extrabold')}>
              {date(dayInstant(start))} – {date(dayInstant(end))}
            </Ltr>
          </div>
          <NavSquare label={t('week.next')} icon={ChevronRight} onClick={() => onDay(addDays(start, 7))} />
        </div>
        <QueryBoundary query={query} skeleton={<ListSkeleton rows={4} />}>
          {(d) => {
            const items = byDay(d.items)
            return (
              <ol className="m-0 flex list-none flex-col gap-2 p-0">
                {days.map((dd) => {
                  const list = items.get(dd) ?? []
                  const isToday = dd === today
                  return (
                    <li key={dd} className="flex items-stretch gap-2.5" aria-current={isToday ? 'date' : undefined}>
                      <div
                        className={cn(
                          'flex w-14 shrink-0 flex-col items-center justify-center rounded-[14px] border py-2',
                          isToday ? 'border-primary bg-primary text-on-primary' : 'border-border bg-surface',
                        )}
                      >
                        <span className="text-tag font-extrabold">{weekday(dayInstant(dd), lang, 'short')}</span>
                        <span className="text-title-sm leading-[1.1] font-black tabular-nums">{Number(dd.slice(8))}</span>
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5">
                        {list.length ? (
                          list.map((i) => <ItemRow key={i.id} item={i} rid={rid} compact />)
                        ) : (
                          <span className="text-meta text-text-2 flex items-center gap-1.5 px-1">
                            <Minus aria-hidden size={14} />
                            {t('nothing')}
                          </span>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ol>
            )
          }}
        </QueryBoundary>
      </div>
    </PullToRefresh>
  )
}

function ListView({ rid, from, today }: { rid: string; from: string; today: string }) {
  const { t } = useTranslation('calendar')
  const query = useQuery(calendarQuery(rid, from, addDays(from, LIST_DAYS)))
  return (
    <PullToRefresh onRefresh={() => refetchAll(query.refetch)}>
      <QueryBoundary
        query={query}
        skeleton={<Skeleton className="h-64 w-full rounded-[18px]" />}
        isEmpty={(d) => d.items.length === 0}
        empty={<EmptyState icon={CalendarX} title={t('list.empty')} />}
      >
        {(d) => (
          <div className="flex flex-col gap-4">
            {[...byDay(d.items)].map(([dd, list]) => (
              <section key={dd} className="flex flex-col gap-2">
                <DayHeader day={dd} today={today} />
                {list.map((i) => (
                  <ListRow key={i.id} item={i} rid={rid} />
                ))}
              </section>
            ))}
          </div>
        )}
      </QueryBoundary>
    </PullToRefresh>
  )
}

function ListRow({ item: i, rid }: { item: CalendarItemSummary; rid: string }) {
  const { t } = useTranslation('calendar')
  const name = firstName(useMember()?.residents.find((r) => r.id === rid)?.name ?? '')
  const tone = kindTone(i.kind)
  const c = toneClasses[tone]
  return (
    <Link
      to="/r/$rid/calendar/$itemId"
      params={{ rid, itemId: i.id }}
      className="rounded-card border-border bg-surface flex min-h-16 items-center gap-3 border px-3.5 py-3 text-start"
    >
      <Ltr className="text-secondary w-11 shrink-0 text-start font-extrabold tabular-nums">{itemTime(i, t('allDay'))}</Ltr>
      <IconTile icon={CATEGORY_ICON[i.category]} tone={tone} size={40} />
      <span className="flex min-w-0 flex-1 flex-col items-start gap-1">
        <span className="text-body-sm leading-[1.3] font-extrabold text-pretty wrap-break-word">{i.title}</span>
        <span className={cn('rounded-pill text-tag inline-flex items-center gap-1 px-2 py-0.5 font-extrabold', c.bg, c.fg)}>
          {i.kind === 'personal' ? <UserRound aria-hidden size={12} /> : <Building2 aria-hidden size={12} />}
          {i.kind === 'personal' ? t('legend.personal', { name }) : t('legend.center')}
        </span>
      </span>
      <DirIcon icon={ChevronRight} size={20} className="text-text-2" />
    </Link>
  )
}
