import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Building2, Clock, Maximize2, MessageSquarePlus } from 'lucide-react'
import { useEffect } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { centerPublicQuery } from '@/api/queries/center'
import { updateQuery, useMarkUpdateSeen } from '@/api/queries/residents'
import type { Photo } from '@/api/schemas/common'
import type { UpdateDetail } from '@/api/schemas/resident'
import { AppFrame, ScreenContent } from '@/components/app/AppFrame'
import { TopBar } from '@/components/app/TopBar'
import { InfoBox } from '@/components/common/Card'
import { Ltr } from '@/components/common/Ltr'
import { PhotoImage } from '@/components/common/PhotoImage'
import { StatusChip } from '@/components/common/StatusChip'
import { QueryBoundary } from '@/components/states/QueryBoundary'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { dateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { AuthorRow } from '../components/common'
import { permissionStates } from '../components/SectionGate'
import { UPDATE_CATEGORY } from '../meta'

export function UpdateDetailScreen({ rid, updateId }: { rid: string; updateId: string }) {
  const { t } = useTranslation(['resident', 'common'])
  const query = useQuery(updateQuery(updateId))
  const center = useQuery(centerPublicQuery()).data
  return (
    <AppFrame>
      <TopBar
        title={t('update.title')}
        backLabel={t('common:actions.back')}
        fallbackHref={`/r/${rid}/resident/updates`}
      />
      <ScreenContent>
        <QueryBoundary
          query={query}
          skeleton={<DetailSkeleton />}
          permission={permissionStates(rid, 'updates')}
          contactPhone={center?.phone}
        >
          {(u) => <Detail update={u} rid={rid} />}
        </QueryBoundary>
      </ScreenContent>
    </AppFrame>
  )
}

function Detail({ update: u, rid }: { update: UpdateDetail; rid: string }) {
  const { t } = useTranslation('resident')
  const seen = useMarkUpdateSeen(rid)
  const { mutate } = seen
  const category = UPDATE_CATEGORY[u.category]

  useEffect(() => {
    if (u.isNew) mutate(u.id)
  }, [u.id, u.isNew, mutate])

  return (
    <article className="flex flex-col gap-4">
      <AuthorRow person={u.author} size={48} />
      <div className="flex flex-wrap gap-2">
        <span className="rounded-pill bg-surface-2 text-meta inline-flex items-center gap-[5px] px-2.5 py-1 font-bold">
          <Clock aria-hidden size={14} className="shrink-0" />
          <Ltr>{dateTime(u.publishedAt)}</Ltr>
        </span>
        <StatusChip tone={category.tone} icon={category.icon} label={t(`category.${u.category}`)} />
      </div>
      <h1 className="text-title-md m-0 leading-[1.25] font-extrabold text-pretty wrap-break-word">{u.title}</h1>
      <p className="text-body m-0 leading-[1.55] whitespace-pre-line wrap-break-word">{u.body}</p>
      {u.photos.length > 0 && (
        <>
          <PhotoGrid photos={u.photos} rid={rid} updateId={u.id} />
          <span className="text-meta text-text-2 -mt-1.5 flex items-center gap-1.5">
            <Maximize2 aria-hidden size={14} className="shrink-0" />
            {t('update.tapPhoto')}
          </span>
        </>
      )}
      <InfoBox icon={Building2} className="text-meta">
        <Trans t={t} i18nKey="update.sharedOn" values={{ date: dateTime(u.sharedAt) }} components={{ ltr: <Ltr /> }} />
      </InfoBox>
      <Button asChild variant="secondary" block>
        <Link
          to="/r/$rid/staff/new"
          params={{ rid }}
          search={{ subject: t('update.askSubject', { title: u.title }).slice(0, 200), ref: `update:${u.id}` }}
        >
          <MessageSquarePlus aria-hidden size={20} />
          {t('update.ask')}
        </Link>
      </Button>
    </article>
  )
}

/** 2fr/1fr grid of two 96px rows (design `resUpdate`); one or two photos fill the width. */
function PhotoGrid({ photos, rid, updateId }: { photos: Photo[]; rid: string; updateId: string }) {
  const { t } = useTranslation('resident')
  const shown = photos.slice(0, 3)
  const extra = photos.length - shown.length
  return (
    <div
      className={cn(
        'grid gap-2',
        shown.length === 1 && 'grid-cols-1 grid-rows-[200px]',
        shown.length === 2 && 'grid-cols-2 grid-rows-[200px]',
        shown.length === 3 && 'grid-cols-[2fr_1fr] grid-rows-[96px_96px]',
      )}
    >
      {shown.map((p, i) => (
        <Link
          key={p.id}
          to="/r/$rid/resident/updates/$updateId/photos/$index"
          params={{ rid, updateId, index: String(i + 1) }}
          aria-label={t('update.openPhoto', { index: i + 1, count: photos.length })}
          className={cn('relative block min-w-0', shown.length === 3 && i === 0 && 'row-span-2')}
        >
          <PhotoImage photo={p} className="rounded-input size-full" />
          {i === shown.length - 1 && extra > 0 && (
            <span className="rounded-input text-title-sm absolute inset-0 flex items-center justify-center bg-black/45 font-extrabold text-white">
              <Ltr>{t('updates.morePhotos', { count: extra })}</Ltr>
            </span>
          )}
        </Link>
      ))}
    </div>
  )
}

function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Skeleton className="size-12 rounded-full" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-1/3 opacity-70" />
        </div>
      </div>
      <Skeleton className="h-6 w-4/5" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="rounded-input h-[200px] w-full" />
    </div>
  )
}
