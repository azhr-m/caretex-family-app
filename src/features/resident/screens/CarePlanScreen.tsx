import { useQuery } from '@tanstack/react-query'
import { CalendarCheck, CalendarClock, ClipboardList, HandHeart, Users, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useMember } from '@/api/queries/me'
import { carePlanQuery } from '@/api/queries/residents'
import type { CarePlan } from '@/api/schemas/resident'
import { PullToRefresh, refetchAll } from '@/components/app/PullToRefresh'
import { Card, NavyCard } from '@/components/common/Card'
import { IconTile } from '@/components/common/IconTile'
import { Ltr } from '@/components/common/Ltr'
import { StatusChip } from '@/components/common/StatusChip'
import { QueryBoundary } from '@/components/states/QueryBoundary'
import { EmptyState } from '@/components/states/states'
import { ListSkeleton, Skeleton } from '@/components/ui/skeleton'
import { date, dayInstant } from '@/lib/format'
import { firstName } from '@/lib/names'
import { toneClasses } from '@/lib/status'
import { cn } from '@/lib/utils'
import { SectionGate, permissionStates } from '../components/SectionGate'
import { GOAL_STATUS, goalIcon, goalTone } from '../meta'

type Plan = Extract<CarePlan, { state: 'ok' }>

export function CarePlanScreen({ rid }: { rid: string }) {
  return (
    <SectionGate rid={rid} permission="carePlan">
      <CarePlanQuery rid={rid} />
    </SectionGate>
  )
}

function CarePlanQuery({ rid }: { rid: string }) {
  const query = useQuery(carePlanQuery(rid))
  const name = firstName(useMember()?.residents.find((r) => r.id === rid)?.name ?? '')
  return (
    <PullToRefresh onRefresh={() => refetchAll(query.refetch)}>
      <QueryBoundary
        query={query}
        skeleton={
          <div className="flex flex-col gap-3.5">
            <Skeleton className="rounded-card h-32 w-full" />
            <ListSkeleton rows={3} />
          </div>
        }
        permission={permissionStates(rid, 'carePlan')}
        isNotShared={(p) => p.state === 'not_shared'}
      >
        {(p) => <Plan plan={p as Plan} name={name} />}
      </QueryBoundary>
    </PullToRefresh>
  )
}

function Plan({ plan, name }: { plan: Plan; name: string }) {
  const { t } = useTranslation('resident')
  const pink = toneClasses.pink
  return (
    <div className="flex flex-col gap-3.5">
      <NavyCard className="flex flex-col gap-2">
        <h1 className="text-title-xs m-0 font-extrabold wrap-break-word">{t('care.title', { name })}</h1>
        <p className="text-secondary m-0 opacity-85">{t('care.sub', { name })}</p>
        <div className="mt-1 flex flex-wrap gap-2">
          <NavyChip icon={CalendarCheck}>
            <Trans
              t={t}
              i18nKey="care.reviewed"
              values={{ date: date(dayInstant(plan.reviewedOn)) }}
              components={{ ltr: <Ltr /> }}
            />
          </NavyChip>
          <NavyChip icon={CalendarClock}>
            <Trans
              t={t}
              i18nKey="care.nextReview"
              values={{ date: date(dayInstant(plan.nextReviewOn)) }}
              components={{ ltr: <Ltr /> }}
            />
          </NavyChip>
        </div>
      </NavyCard>

      {plan.goals.length === 0 && <EmptyState icon={ClipboardList} title={t('care.empty')} />}

      {plan.goals.map((g, i) => {
        const status = GOAL_STATUS[g.status]
        return (
          <Card key={g.id} className="flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <IconTile icon={goalIcon(g.icon)} tone={goalTone(i)} size={44} />
              <div className="flex min-w-0 flex-1 flex-col items-start gap-1.5">
                <span className="text-label font-extrabold tracking-[.04em] uppercase rtl:tracking-normal">
                  {t('care.goal')}
                </span>
                <h2 className="text-body m-0 leading-[1.3] font-extrabold text-pretty wrap-break-word">{g.title}</h2>
                <StatusChip tone={status.tone} icon={status.icon} label={t(`care.status.${g.status}`)} size="sm" />
              </div>
            </div>
            <div className="text-secondary flex gap-2.5">
              <Users aria-hidden size={18} className="text-text-2 shrink-0" />
              <div className="flex min-w-0 flex-col">
                <span className="font-extrabold">{t('care.team')}</span>
                <span className="text-text-2 wrap-break-word">{g.teamActions}</span>
              </div>
            </div>
            <div className={cn('text-secondary flex gap-2.5 rounded-[12px] px-3 py-2.5', pink.bg)}>
              <HandHeart aria-hidden size={18} className={cn('shrink-0', pink.fg)} />
              <div className="flex min-w-0 flex-col">
                <span className={cn('font-extrabold', pink.fg)}>{t('care.family')}</span>
                <span className="wrap-break-word">{g.familyActions}</span>
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}

function NavyChip({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return (
    <span className="rounded-pill text-label inline-flex items-center gap-[5px] bg-white/12 px-2.5 py-1 font-bold">
      <Icon aria-hidden size={14} className="shrink-0" />
      <span>{children}</span>
    </span>
  )
}
