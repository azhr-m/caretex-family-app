import { Link, useNavigate } from '@tanstack/react-router'
import {
  BookOpen,
  CalendarCheck,
  CalendarClock,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  ClipboardList,
  Clock,
  FileCheck,
  FileText,
  FolderOpen,
  History,
  LayoutGrid,
  MapPin,
  MessageSquarePlus,
  MessageSquareReply,
  Newspaper,
  PartyPopper,
  PenLine,
  Play,
  Reply,
  Signature,
  Sun,
  UserRound,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import { Trans, useTranslation } from 'react-i18next'
import type { CalendarItemSummary } from '@/api/schemas/calendar'
import type { AttentionItem, AttentionKind, DashboardCounts, SinceLastVisit } from '@/api/schemas/dashboard'
import type { ScheduleItem, UpdateSummary } from '@/api/schemas/resident'
import { Card } from '@/components/common/Card'
import { DirIcon } from '@/components/common/DirIcon'
import { IconTile } from '@/components/common/IconTile'
import { ListGroup, ListRow } from '@/components/common/ListRow'
import { Ltr } from '@/components/common/Ltr'
import { PhotoImage } from '@/components/common/PhotoImage'
import { SectionHeader } from '@/components/common/SectionHeader'
import { StatusChip } from '@/components/common/StatusChip'
import { Button } from '@/components/ui/button'
import { AuthorRow, ScheduleChip } from '@/features/resident/components/common'
import { SCHEDULE_KIND } from '@/features/resident/meta'
import { deepLinkTarget } from '@/lib/deepLink'
import { date, dateTime, dayMonth, time, weekday } from '@/lib/format'
import { useLang } from '@/lib/hooks'
import { toneClasses, type Tone } from '@/lib/status'
import { cn } from '@/lib/utils'

type Kind = SinceLastVisit['items'][number]['kind']

const SINCE_META: Record<Kind, { icon: LucideIcon; tone: Tone }> = {
  update: { icon: Newspaper, tone: 'teal' },
  inquiry_reply: { icon: MessageSquareReply, tone: 'blue' },
  document: { icon: FileText, tone: 'violet' },
  calendar_change: { icon: CalendarClock, tone: 'amber' },
  request_handled: { icon: CircleCheck, tone: 'green' },
  survey: { icon: ClipboardList, tone: 'teal' },
  event: { icon: PartyPopper, tone: 'pink' },
}

export function Section({ children }: { children: React.ReactNode }) {
  return <section className="flex flex-col gap-2.5">{children}</section>
}

export function SinceLastVisitSection({ data, rid }: { data: SinceLastVisit; rid: string }) {
  const { t } = useTranslation('home')
  const navigate = useNavigate()
  return (
    <Section>
      <SectionHeader
        icon={History}
        end={
          data.items.length > 0 && (
            <CountChip tone="blue">{t('since.count', { count: data.items.length })}</CountChip>
          )
        }
      >
        {data.since ? (
          <Trans t={t} i18nKey="since.title" values={{ date: date(data.since) }} components={{ ltr: <Ltr /> }} />
        ) : (
          t('since.titleNoDate')
        )}
      </SectionHeader>
      <ListGroup>
        {data.items.length === 0 ? (
          <ListRow icon={CircleCheck} tone="green" title={t('since.empty')} />
        ) : (
          data.items.map((it) => {
            const m = SINCE_META[it.kind]
            return (
              <ListRow
                key={it.id}
                icon={m.icon}
                tone={m.tone}
                kind={t(`since.kind.${it.kind}`)}
                title={it.title}
                meta={
                  <>
                    {it.actor && `${it.actor} · `}
                    <Ltr>{dateTime(it.occurredAt)}</Ltr>
                  </>
                }
                onClick={() => void navigate(deepLinkTarget(it.link, rid))}
              />
            )
          })
        )}
      </ListGroup>
    </Section>
  )
}

const ATTENTION_META: Record<AttentionKind, { icon: LucideIcon; tone: Tone; cta: LucideIcon }> = {
  sign_document: { icon: Signature, tone: 'violet', cta: PenLine },
  confirm_read: { icon: FileCheck, tone: 'blue', cta: BookOpen },
  approve_document: { icon: FileCheck, tone: 'violet', cta: BookOpen },
  survey: { icon: ClipboardList, tone: 'teal', cta: Play },
  rsvp: { icon: PartyPopper, tone: 'pink', cta: CalendarCheck },
  inquiry_reply_needed: { icon: MessageSquareReply, tone: 'amber', cta: Reply },
  appointment_confirm: { icon: CalendarCheck, tone: 'blue', cta: CalendarCheck },
}

export function AttentionSection({ items, rid }: { items: AttentionItem[]; rid: string }) {
  const { t } = useTranslation('home')
  return (
    <Section>
      <SectionHeader
        icon={CircleAlert}
        end={items.length > 0 && <CountChip tone="violet">{t('attention.count', { count: items.length })}</CountChip>}
      >
        {t('attention.title')}
      </SectionHeader>
      {items.length === 0 ? (
        <div className="rounded-card border-green-bd bg-green-bg text-green-fg flex items-center gap-3 border p-3.5">
          <CircleCheck aria-hidden size={24} className="shrink-0" />
          <span className="text-body-sm font-extrabold">{t('attention.allCaughtUp')}</span>
        </div>
      ) : (
        items.map((a) => <ActionCard key={a.id} item={a} rid={rid} />)
      )}
    </Section>
  )
}

function ActionCard({ item, rid }: { item: AttentionItem; rid: string }) {
  const { t } = useTranslation('home')
  const m = ATTENTION_META[item.kind]
  const cta = item.kind === 'survey' && item.status === 'draft' ? 'surveyDraft' : item.kind
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <IconTile icon={m.icon} tone={m.tone} size={44} />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-body leading-[1.3] font-extrabold text-pretty wrap-break-word">{item.title}</span>
          <span className="text-meta text-text-2 wrap-break-word">{item.subtitle}</span>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <StatusChip status={item.status} />
        <Button asChild size="compact">
          <Link {...deepLinkTarget(item.link, rid)}>
            <DirIcon icon={m.cta} size={17} />
            {t(`attention.cta.${cta}`)}
          </Link>
        </Button>
      </div>
    </Card>
  )
}

export function LatestUpdateSection({ update, rid }: { update: UpdateSummary; rid: string }) {
  const { t } = useTranslation('home')
  const photo = update.photos[0]
  return (
    <Section>
      <SectionHeader icon={Newspaper}>{t('latest.title')}</SectionHeader>
      <Link
        to="/r/$rid/resident/updates/$updateId"
        params={{ rid, updateId: update.id }}
        className="rounded-card border-border bg-surface shadow-card flex flex-col gap-3 border p-3.5 text-start"
      >
        <AuthorRow
          person={update.author}
          roleIcon={false}
          meta={
            <>
              {' · '}
              <Ltr>{dateTime(update.publishedAt)}</Ltr>
            </>
          }
        />
        <span className="text-body font-extrabold text-pretty wrap-break-word">{update.title}</span>
        <span className="text-body-sm text-text-2 line-clamp-2 wrap-break-word">{update.excerpt}</span>
        {photo && <PhotoImage photo={photo} className="rounded-input h-[150px] w-full" />}
        <span className="text-body-sm text-link flex items-center gap-1.5 font-extrabold">
          {t('latest.read')}
          <DirIcon icon={ChevronRight} size={18} />
        </span>
      </Link>
    </Section>
  )
}

export function UpcomingSection({
  item,
  rid,
  residentName,
}: {
  item: CalendarItemSummary
  rid: string
  residentName: string
}) {
  const { t } = useTranslation('home')
  const lang = useLang()
  const { day, month } = dayMonth(item.startsAt, lang)
  const b = toneClasses.blue
  const needsConfirm = item.requiresConfirmation && item.confirmation === 'pending'
  const target = { to: '/r/$rid/calendar/$itemId', params: { rid, itemId: item.id } } as const
  return (
    <Section>
      <SectionHeader icon={CalendarClock}>{t('upcoming.title')}</SectionHeader>
      <Card className="flex flex-col gap-3">
        <Link {...target} className="flex gap-3.5 text-start">
          <div
            aria-hidden
            className={cn(
              'rounded-input flex w-[62px] shrink-0 flex-col items-center justify-center border py-2',
              b.bg,
              b.fg,
              b.bd,
            )}
          >
            <span className="text-tag text-label font-extrabold uppercase rtl:normal-case">
              {weekday(item.startsAt, lang, 'short')}
            </span>
            <span className="text-title-lg leading-[1.1] font-black tabular-nums">{day}</span>
            <span className="text-tag text-label font-extrabold uppercase rtl:normal-case">{month}</span>
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="text-body font-extrabold text-pretty wrap-break-word">{item.title}</span>
            <span className="text-secondary text-text-2 flex items-center gap-1.5">
              <Clock aria-hidden size={15} className="shrink-0" />
              <Ltr>{item.allDay ? date(item.startsAt) : dateTime(item.startsAt)}</Ltr>
            </span>
            {item.location && (
              <span className="text-secondary text-text-2 flex items-center gap-1.5">
                <MapPin aria-hidden size={15} className="shrink-0" />
                <span className="min-w-0 wrap-break-word">{item.location}</span>
              </span>
            )}
          </div>
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <StatusChip
            tone="blue"
            icon={UserRound}
            label={item.kind === 'personal' ? t('upcoming.personal', { name: residentName }) : t('upcoming.centerEvent')}
          />
          {needsConfirm && (
            <Button asChild variant="tonal" size="compact" className="border-border border">
              <Link {...target}>
                <CalendarCheck aria-hidden size={17} />
                {t('upcoming.confirm')}
              </Link>
            </Button>
          )}
        </div>
      </Card>
    </Section>
  )
}

export function DayPreviewSection({
  items,
  rid,
  residentName,
}: {
  items: ScheduleItem[]
  rid: string
  residentName: string
}) {
  const { t } = useTranslation('home')
  return (
    <Section>
      <SectionHeader icon={Sun}>{t('day.title', { name: residentName })}</SectionHeader>
      <div className="rounded-card border-border bg-surface shadow-card border px-3.5 py-1.5">
        {items.map((d) => {
          const m = SCHEDULE_KIND[d.kind]
          const Icon = m.icon
          return (
            <div
              key={d.id}
              className={cn('flex min-h-12 items-center gap-3 py-1', d.status === 'done' && 'opacity-75')}
            >
              <Ltr className="text-secondary w-[46px] shrink-0 text-start font-extrabold tabular-nums">
                {time(d.startsAt)}
              </Ltr>
              <Icon aria-hidden size={18} className={cn('shrink-0', toneClasses[m.tone].fg)} />
              <span
                className={cn(
                  'text-body-sm min-w-0 flex-1 wrap-break-word',
                  d.status === 'now' ? 'font-extrabold' : 'font-semibold',
                )}
              >
                {d.title}
              </span>
              <ScheduleChip status={d.status} />
            </div>
          )
        })}
        <Link
          to="/r/$rid/resident/day"
          params={{ rid }}
          className="border-border text-body-sm text-link flex min-h-[46px] items-center justify-center gap-1.5 border-t font-extrabold"
        >
          {t('day.seeAll')}
          <DirIcon icon={ChevronRight} size={18} />
        </Link>
      </div>
    </Section>
  )
}

export function QuickActionsSection({ rid, counts }: { rid: string; counts: DashboardCounts }) {
  const { t } = useTranslation('home')
  const tiles = [
    {
      key: 'inquiry',
      icon: MessageSquarePlus,
      tone: 'blue',
      label: t('quick.newInquiry'),
      sub: t('quick.newInquirySub'),
      link: { to: '/r/$rid/staff/new', params: { rid } },
    },
    {
      key: 'service',
      icon: Wrench,
      tone: 'amber',
      label: t('quick.service'),
      sub: t('quick.serviceSub'),
      link: { to: '/r/$rid/more/services/new', params: { rid } },
    },
    {
      key: 'documents',
      icon: FolderOpen,
      tone: 'violet',
      label: t('quick.documents'),
      sub: counts.documentsPending
        ? t('quick.documentsSub', { count: counts.documentsPending })
        : t('quick.documentsNone'),
      link: { to: '/r/$rid/more/documents', params: { rid } },
    },
    {
      key: 'events',
      icon: PartyPopper,
      tone: 'pink',
      label: t('quick.events'),
      sub: counts.invitationsPending
        ? t('quick.eventsSub', { count: counts.invitationsPending })
        : t('quick.eventsNone'),
      link: { to: '/r/$rid/more/feed', params: { rid } },
    },
  ] as const
  return (
    <Section>
      <SectionHeader icon={LayoutGrid}>{t('quick.title')}</SectionHeader>
      <div className="grid grid-cols-2 gap-2.5">
        {tiles.map((q) => (
          <Link
            key={q.key}
            {...q.link}
            className="rounded-card border-border bg-surface flex min-h-[108px] min-w-0 flex-col items-start gap-2.5 border p-3.5 text-start"
          >
            <IconTile icon={q.icon} tone={q.tone} size={44} />
            <span className="flex min-w-0 flex-col">
              <span className="text-body-sm font-extrabold wrap-break-word">{q.label}</span>
              <span className="text-tag text-text-2 wrap-break-word">{q.sub}</span>
            </span>
          </Link>
        ))}
      </div>
    </Section>
  )
}

function CountChip({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  const c = toneClasses[tone]
  return (
    <span className={cn('rounded-pill text-tag text-label shrink-0 px-2 py-0.5 font-extrabold whitespace-nowrap', c.bg, c.fg)}>
      {children}
    </span>
  )
}
