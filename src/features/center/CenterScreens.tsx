import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import {
  BookOpen,
  CalendarDays,
  ChevronRight,
  CircleCheck,
  CircleX,
  ClipboardList,
  Clock,
  ConciergeBell,
  Dot,
  Footprints,
  Mail,
  MapPin,
  Moon,
  Navigation,
  Phone,
  Siren,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { centerQuery } from '@/api/queries/account'
import type { Center } from '@/api/schemas/account'
import { AppFrame, ScreenContent } from '@/components/app/AppFrame'
import { TopBar } from '@/components/app/TopBar'
import { Card, NavyCard } from '@/components/common/Card'
import { DirIcon } from '@/components/common/DirIcon'
import { IconTile } from '@/components/common/IconTile'
import { Ltr } from '@/components/common/Ltr'
import { SectionHeader } from '@/components/common/SectionHeader'
import { QueryBoundary } from '@/components/states/QueryBoundary'
import { Button } from '@/components/ui/button'
import { ListSkeleton, Skeleton } from '@/components/ui/skeleton'
import { DEPARTMENT_META } from '@/lib/departments'
import { formatPhone } from '@/lib/format'
import { toneClasses, type Tone } from '@/lib/status'
import { cn } from '@/lib/utils'

export function CenterInfoScreen({ rid }: { rid: string }) {
  const { t } = useTranslation(['center', 'common'])
  const query = useQuery(centerQuery())
  return (
    <AppFrame>
      <TopBar title={t('info.title')} backLabel={t('common:tabs.more')} fallbackHref={`/r/${rid}/more`} />
      <ScreenContent>
        <QueryBoundary
          query={query}
          skeleton={
            <div className="flex flex-col gap-4">
              <Skeleton className="rounded-card h-40 w-full" />
              <ListSkeleton rows={4} />
            </div>
          }
        >
          {(c) => <Info center={c} rid={rid} />}
        </QueryBoundary>
      </ScreenContent>
    </AppFrame>
  )
}

function Info({ center: c, rid }: { center: Center; rid: string }) {
  const { t } = useTranslation('center')
  const actions = [
    { icon: Phone, label: t('info.call'), href: `tel:${c.phone}` },
    { icon: Mail, label: t('info.email'), href: `mailto:${c.email}` },
    { icon: Navigation, label: t('info.directions'), href: c.mapsUrl, external: true },
  ]
  return (
    <div className="flex flex-col gap-5">
      <NavyCard className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-title-sm m-0 font-extrabold wrap-break-word">{c.name}</h1>
          <span className="text-secondary flex items-center gap-1.5 opacity-85">
            <MapPin aria-hidden size={15} className="shrink-0" />
            <span className="min-w-0 wrap-break-word">{c.address}</span>
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {actions.map((a) => (
            <a
              key={a.label}
              href={a.href}
              target={a.external ? '_blank' : undefined}
              rel={a.external ? 'noreferrer' : undefined}
              className="flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-[14px] border border-white/20 bg-white/[.08] px-1"
            >
              <a.icon aria-hidden size={20} />
              <span className="text-micro font-extrabold">{a.label}</span>
            </a>
          ))}
        </div>
      </NavyCard>

      <section className="flex flex-col gap-2.5">
        <SectionHeader icon={Clock}>{t('info.visitingHours')}</SectionHeader>
        <ul className="rounded-card border-border bg-surface m-0 flex list-none flex-col border p-0">
          {c.visitingHours.map((h) => (
            <li
              key={h.label}
              className={cn(
                'border-border flex min-h-12 items-center gap-3 border-b px-3.5 py-2.5 last:border-b-0',
                h.quiet && toneClasses.amber.fg,
              )}
            >
              {h.quiet ? <Moon aria-hidden size={18} className="shrink-0" /> : <CalendarDays aria-hidden size={18} className="text-text-2 shrink-0" />}
              <span className="text-secondary min-w-0 flex-1 font-bold wrap-break-word">{h.label}</span>
              <Ltr className="text-body-sm font-extrabold tabular-nums">
                {h.from}–{h.to}
              </Ltr>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-2.5">
        <SectionHeader icon={Phone}>{t('info.contacts')}</SectionHeader>
        {c.contacts.map((p) => {
          const meta = p.department ? DEPARTMENT_META[p.department] : { icon: ConciergeBell, tone: 'slate' as Tone }
          return (
            <Card key={p.roleLabel + p.name} className="flex items-center gap-3 rounded-[16px] shadow-none">
              <IconTile icon={meta.icon} tone={meta.tone} size={44} />
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="text-tag text-text-2 font-bold wrap-break-word">{p.roleLabel}</span>
                <span className="text-body-sm font-extrabold wrap-break-word">{p.name}</span>
                <Ltr className="text-meta text-text-2 text-start">{formatPhone(p.phone)}</Ltr>
              </div>
              <Button asChild size="compact" variant="tonal" className="px-3">
                <a href={`tel:${p.phone}`} aria-label={t('info.callLabel', { name: p.name })}>
                  <Phone aria-hidden size={16} />
                  {t('info.call')}
                </a>
              </Button>
            </Card>
          )
        })}
      </section>

      <Link
        to="/r/$rid/more/center/guide"
        params={{ rid }}
        className="rounded-card border-border bg-surface shadow-card flex min-h-16 items-center gap-3 border p-3.5 text-start"
      >
        <IconTile icon={BookOpen} tone="violet" size={44} />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-body-sm font-extrabold">{t('info.guideTitle')}</span>
          <span className="text-meta text-text-2">{t('info.guideSub')}</span>
        </span>
        <DirIcon icon={ChevronRight} size={20} className="text-text-2" />
      </Link>
    </div>
  )
}

const GUIDE_META: Record<Center['guide'][number]['code'], { icon: LucideIcon; tone: Tone }> = {
  response_hours: { icon: Clock, tone: 'blue' },
  procedures: { icon: ClipboardList, tone: 'violet' },
  may_bring: { icon: CircleCheck, tone: 'green' },
  dont_bring: { icon: CircleX, tone: 'red' },
  preparing: { icon: Footprints, tone: 'teal' },
  services: { icon: Sparkles, tone: 'amber' },
  phones: { icon: Phone, tone: 'pink' },
}

export function CenterGuideScreen({ rid }: { rid: string }) {
  const { t } = useTranslation(['center', 'common'])
  const query = useQuery(centerQuery())
  return (
    <AppFrame>
      <TopBar title={t('guide.title')} backLabel={t('common:actions.back')} fallbackHref={`/r/${rid}/more/center`} />
      <ScreenContent>
        <QueryBoundary query={query} skeleton={<ListSkeleton rows={5} />}>
          {(c) => (
            <div className="flex flex-col gap-3">
              {c.guide.map((g) => {
                const meta = GUIDE_META[g.code]
                return (
                  <Card key={g.code} className="flex flex-col gap-2.5">
                    <div className="flex items-center gap-2.5">
                      <IconTile icon={meta.icon} tone={meta.tone} size={36} />
                      <h2 className="text-body m-0 font-extrabold">{g.title}</h2>
                    </div>
                    <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
                      {g.items.map((item) => (
                        <GuideItem key={item.text} code={g.code} item={item} />
                      ))}
                    </ul>
                  </Card>
                )
              })}
            </div>
          )}
        </QueryBoundary>
      </ScreenContent>
    </AppFrame>
  )
}

function GuideItem({ code, item }: { code: Center['guide'][number]['code']; item: Center['guide'][number]['items'][number] }) {
  if (item.phone) {
    const Icon = item.emergency ? Siren : Phone
    return (
      <li>
        <a
          href={`tel:${item.phone}`}
          className={cn(
            'text-body-sm flex min-h-11 items-center gap-2.5 rounded-[12px] px-2',
            item.emergency ? cn(toneClasses.red.bg, toneClasses.red.fg, 'font-extrabold') : 'font-bold',
          )}
        >
          <Icon aria-hidden size={18} className="shrink-0" />
          <span className="min-w-0 flex-1 wrap-break-word">{item.text}</span>
          <Ltr className="text-link font-extrabold tabular-nums">{formatPhone(item.phone)}</Ltr>
        </a>
      </li>
    )
  }
  const icon =
    code === 'may_bring' ? (
      <CircleCheck aria-hidden size={18} className={cn('mt-px shrink-0', toneClasses.green.fg)} />
    ) : code === 'dont_bring' ? (
      <CircleX aria-hidden size={18} className={cn('mt-px shrink-0', toneClasses.red.fg)} />
    ) : (
      <Dot aria-hidden size={22} className="text-text-2 -mt-px shrink-0" />
    )
  return (
    <li className="text-secondary flex items-start gap-2">
      {icon}
      <span className="min-w-0 flex-1 wrap-break-word">{item.text}</span>
    </li>
  )
}
