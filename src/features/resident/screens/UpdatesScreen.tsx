import { useInfiniteQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Calendar, ChevronRight, LoaderCircle, Newspaper } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useMember } from '@/api/queries/me'
import { updatesQuery } from '@/api/queries/residents'
import type { UpdateSummary } from '@/api/schemas/resident'
import { PullToRefresh, refetchAll } from '@/components/app/PullToRefresh'
import { DirIcon } from '@/components/common/DirIcon'
import { Ltr } from '@/components/common/Ltr'
import { PhotoImage } from '@/components/common/PhotoImage'
import { SectionHeader } from '@/components/common/SectionHeader'
import { StatusChip } from '@/components/common/StatusChip'
import { QueryBoundary } from '@/components/states/QueryBoundary'
import { EmptyState } from '@/components/states/states'
import { ListSkeleton } from '@/components/ui/skeleton'
import { date, isoDay, time, weekday } from '@/lib/format'
import { useLang } from '@/lib/hooks'
import { firstName } from '@/lib/names'
import { AuthorRow } from '../components/common'
import { SectionGate, permissionStates } from '../components/SectionGate'

export function UpdatesScreen({ rid }: { rid: string }) {
  return (
    <SectionGate rid={rid} permission="updates">
      <UpdatesQuery rid={rid} />
    </SectionGate>
  )
}

function UpdatesQuery({ rid }: { rid: string }) {
  const { t } = useTranslation('resident')
  const query = useInfiniteQuery(updatesQuery(rid))
  const name = firstName(useMember()?.residents.find((r) => r.id === rid)?.name ?? '')
  return (
    <PullToRefresh onRefresh={() => refetchAll(query.refetch)}>
      <QueryBoundary
        query={query}
        skeleton={<ListSkeleton rows={3} />}
        permission={permissionStates(rid, 'updates')}
        isEmpty={(d) => d.pages[0]?.items.length === 0}
        empty={
          <EmptyState
            icon={Newspaper}
            title={t('updates.empty')}
            body={t('updates.emptyBody', { name })}
          />
        }
      >
        {(d) => (
          <div className="flex flex-col gap-4">
            <p className="text-secondary text-text-2 m-0">{t('updates.intro', { name })}</p>
            {groupByDay(d.pages.flatMap((p) => p.items)).map(([day, items]) => (
              <DayGroup key={day} items={items} rid={rid} />
            ))}
            <LoadMore
              hasNext={query.hasNextPage}
              loading={query.isFetchingNextPage}
              onLoad={() => void query.fetchNextPage()}
              showEnd={d.pages.length > 1}
            />
          </div>
        )}
      </QueryBoundary>
    </PullToRefresh>
  )
}

function groupByDay(items: UpdateSummary[]) {
  const groups = new Map<string, UpdateSummary[]>()
  for (const u of items) {
    const day = isoDay(u.publishedAt)
    groups.set(day, [...(groups.get(day) ?? []), u])
  }
  return [...groups]
}

function DayGroup({ items, rid }: { items: UpdateSummary[]; rid: string }) {
  const { t } = useTranslation('resident')
  const lang = useLang()
  const first = items[0]!.publishedAt
  return (
    <section className="flex flex-col gap-2">
      <SectionHeader icon={Calendar}>
        <Trans
          t={t}
          i18nKey="updates.dateHeader"
          values={{ weekday: weekday(first, lang), date: date(first) }}
          components={{ ltr: <Ltr /> }}
        />
      </SectionHeader>
      {items.map((u) => (
        <UpdateCard key={u.id} update={u} rid={rid} />
      ))}
    </section>
  )
}

function UpdateCard({ update: u, rid }: { update: UpdateSummary; rid: string }) {
  const { t } = useTranslation('resident')
  const extra = u.photoCount - u.photos.length
  return (
    <Link
      to="/r/$rid/resident/updates/$updateId"
      params={{ rid, updateId: u.id }}
      className="rounded-card border-border bg-surface shadow-card flex flex-col gap-2.5 border p-3.5 text-start"
    >
      <div className="flex items-center gap-2">
        <AuthorRow
          person={u.author}
          meta={
            <>
              {' · '}
              <Ltr>{time(u.publishedAt)}</Ltr>
            </>
          }
          className="flex-1"
        />
        {u.isNew && <StatusChip status="new" size="sm" />}
      </div>
      <span className="text-body font-extrabold text-pretty wrap-break-word">{u.title}</span>
      <span className="text-body-sm text-text-2 line-clamp-3 wrap-break-word">{u.excerpt}</span>
      {u.photos.length > 0 && (
        <div className="flex gap-2">
          {u.photos.map((p, i) => (
            <div key={p.id} className="relative h-[110px] min-w-0 flex-1">
              <PhotoImage photo={p} className="rounded-tile size-full" />
              {i === u.photos.length - 1 && extra > 0 && (
                <span className="rounded-tile text-title-sm absolute inset-0 flex items-center justify-center bg-black/45 font-extrabold text-white">
                  <Ltr>{t('updates.morePhotos', { count: extra })}</Ltr>
                </span>
              )}
            </div>
          ))}
        </div>
      )}
      <span className="text-secondary text-link flex items-center gap-1.5 font-extrabold">
        {t('updates.read')}
        <DirIcon icon={ChevronRight} size={17} />
      </span>
    </Link>
  )
}

/** Infinite scroll: loads the next page when the sentinel scrolls into view. */
function LoadMore({
  hasNext,
  loading,
  onLoad,
  showEnd,
}: {
  hasNext: boolean
  loading: boolean
  onLoad: () => void
  showEnd: boolean
}) {
  const { t } = useTranslation('resident')
  const ref = useRef<HTMLDivElement>(null)
  const onLoadRef = useRef(onLoad)
  useEffect(() => {
    onLoadRef.current = onLoad
  })
  useEffect(() => {
    const el = ref.current
    if (!el || !hasNext) return
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) onLoadRef.current()
    })
    io.observe(el)
    return () => io.disconnect()
  }, [hasNext, loading])

  if (!hasNext) {
    return showEnd ? <p className="text-meta text-text-2 m-0 py-2 text-center">{t('updates.end')}</p> : null
  }
  return (
    <div ref={ref} className="text-meta text-text-2 flex min-h-11 items-center justify-center gap-2 py-2" role="status">
      {loading && (
        <>
          <LoaderCircle aria-hidden size={16} className="animate-spin" />
          {t('updates.loadingMore')}
        </>
      )}
    </div>
  )
}
