import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { BedDouble, Building2, ChevronRight } from 'lucide-react'
import { Trans, useTranslation } from 'react-i18next'
import { centerPublicQuery } from '@/api/queries/center'
import { useMember } from '@/api/queries/me'
import { dashboardQuery, useRecordVisit } from '@/api/queries/residents'
import type { Dashboard, Section as SectionResult } from '@/api/schemas/dashboard'
import type { LinkedResident } from '@/api/schemas/me'
import { PullToRefresh, refetchAll } from '@/components/app/PullToRefresh'
import { NavyCard } from '@/components/common/Card'
import { DirIcon } from '@/components/common/DirIcon'
import { Ltr } from '@/components/common/Ltr'
import { QueryBoundary } from '@/components/states/QueryBoundary'
import { SectionError } from '@/components/states/states'
import { ListSkeleton, Skeleton } from '@/components/ui/skeleton'
import { appDate } from '@/lib/clock'
import { date, relativeGreeting, weekday } from '@/lib/format'
import { useLang } from '@/lib/hooks'
import { firstName } from '@/lib/names'
import {
  AttentionSection,
  DayPreviewSection,
  LatestUpdateSection,
  QuickActionsSection,
  SinceLastVisitSection,
  UpcomingSection,
} from './sections'

export function HomeScreen({ rid }: { rid: string }) {
  const member = useMember()
  const resident = member?.residents.find((r) => r.id === rid)
  const query = useQuery(dashboardQuery(rid))
  const center = useQuery(centerPublicQuery()).data
  useRecordVisit(rid)

  return (
    <PullToRefresh onRefresh={() => refetchAll(query.refetch)}>
      <QueryBoundary query={query} skeleton={<HomeSkeleton />} contactPhone={center?.phone}>
        {(data) => (
          <HomeContent data={data} rid={rid} resident={resident} centerName={center?.name} />
        )}
      </QueryBoundary>
    </PullToRefresh>
  )
}

function HomeContent({
  data,
  rid,
  resident,
  centerName,
}: {
  data: Dashboard
  rid: string
  resident?: LinkedResident
  centerName?: string
}) {
  const { t } = useTranslation('home')
  const lang = useLang()
  const query = useQuery(dashboardQuery(rid))
  const retry = () => void query.refetch()
  const now = appDate()
  const name = resident ? firstName(resident.name) : ''

  /** Renders a section, or its inline error when that part of the payload failed validation. */
  const section = <T,>(s: SectionResult<T>, render: (data: T) => React.ReactNode) =>
    s.ok ? render(s.data) : <SectionError onRetry={retry} />

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col">
        <h1 className="text-title-lg m-0 font-extrabold wrap-break-word">
          {t(`greeting.${relativeGreeting(now)}`, { name: data.greetingName })}
        </h1>
        <span className="text-secondary text-text-2">
          <Trans
            t={t}
            i18nKey="dateLine"
            values={{ weekday: weekday(now, lang), date: date(now) }}
            components={{ ltr: <Ltr /> }}
          />
        </span>
      </div>

      {resident && <ResidentCard resident={resident} rid={rid} centerName={centerName} />}

      {section(data.sinceLastVisit, (d) => (
        <SinceLastVisitSection data={d} rid={rid} />
      ))}
      {section(data.attention, (d) => (
        <AttentionSection items={d} rid={rid} />
      ))}
      {section(data.latestUpdate, (d) => d && <LatestUpdateSection update={d} rid={rid} />)}
      {section(data.upcoming, (d) => d && <UpcomingSection item={d} rid={rid} residentName={name} />)}
      {section(
        data.dayPreview,
        (d) => d.length > 0 && <DayPreviewSection items={d} rid={rid} residentName={name} />,
      )}
      <QuickActionsSection rid={rid} counts={data.counts} />
    </div>
  )
}

function ResidentCard({
  resident,
  rid,
  centerName,
}: {
  resident: LinkedResident
  rid: string
  centerName?: string
}) {
  const { t } = useTranslation('home')
  return (
    <NavyCard className="flex items-center gap-3.5">
      {resident.photoUrl ? (
        <img src={resident.photoUrl} alt="" className="size-[72px] shrink-0 rounded-[18px] object-cover" />
      ) : (
        <div
          aria-hidden
          className="size-[72px] shrink-0 rounded-[18px] bg-[repeating-linear-gradient(135deg,rgba(255,255,255,.14)_0_8px,rgba(255,255,255,.06)_8px_16px)]"
        />
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-title-sm font-extrabold wrap-break-word">{resident.name}</span>
        <span className="text-secondary flex items-center gap-1.5 opacity-85">
          <BedDouble aria-hidden size={15} className="shrink-0" />
          <span className="min-w-0 wrap-break-word">
            {resident.ward} · {resident.room}
          </span>
        </span>
        {centerName && (
          <span className="text-meta flex items-center gap-1.5 opacity-75">
            <Building2 aria-hidden size={15} className="shrink-0" />
            <span className="min-w-0 wrap-break-word">{centerName}</span>
          </span>
        )}
      </div>
      <Link
        to="/r/$rid/resident/general"
        params={{ rid }}
        aria-label={t('residentCard.profileLabel', { name: resident.name })}
        className="flex min-h-14 min-w-14 shrink-0 flex-col items-center justify-center gap-0.5 rounded-[14px] border border-white/20 bg-white/[.08] px-1"
      >
        <DirIcon icon={ChevronRight} size={20} />
        <span className="text-micro font-bold">{t('residentCard.profile')}</span>
      </Link>
    </NavyCard>
  )
}

export function HomeSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-7 w-2/3" />
        <Skeleton className="h-4 w-1/3 opacity-70" />
      </div>
      <Skeleton className="rounded-card h-[104px] w-full" />
      <div className="flex flex-col gap-2.5">
        <Skeleton className="h-3.5 w-1/2" />
        <ListSkeleton rows={3} />
      </div>
      <div className="flex flex-col gap-2.5">
        <Skeleton className="h-3.5 w-1/3" />
        <Skeleton className="rounded-card h-[132px] w-full" />
      </div>
    </div>
  )
}
