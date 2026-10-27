import { useInfiniteQuery } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import {
  Archive,
  BookOpen,
  CalendarCheck,
  CircleCheck,
  Eye,
  LayoutList,
  Megaphone,
  Newspaper,
  Palette,
  PartyPopper,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { feedQuery } from '@/api/queries/more'
import type { FeedItem } from '@/api/schemas/feed'
import { AppFrame, ScreenContent } from '@/components/app/AppFrame'
import { PullToRefresh, refetchAll } from '@/components/app/PullToRefresh'
import { TopBar } from '@/components/app/TopBar'
import { IconTile } from '@/components/common/IconTile'
import { LoadMore } from '@/components/common/LoadMore'
import { Ltr } from '@/components/common/Ltr'
import { StatusChip } from '@/components/common/StatusChip'
import { QueryBoundary } from '@/components/states/QueryBoundary'
import { EmptyState } from '@/components/states/states'
import { Button } from '@/components/ui/button'
import { FilterChips } from '@/components/ui/filter-chips'
import { ListSkeleton } from '@/components/ui/skeleton'
import { date } from '@/lib/format'
import { toneClasses } from '@/lib/status'
import { cn } from '@/lib/utils'
import { CHIP_TO_CATEGORY, KIND_META, feedTarget, type FeedChip } from './meta'

export function FeedScreen({ rid, cat }: { rid: string; cat: FeedChip }) {
  const { t } = useTranslation(['feed', 'common'])
  const navigate = useNavigate()
  const query = useInfiniteQuery(feedQuery({ category: CHIP_TO_CATEGORY[cat] }))
  return (
    <AppFrame>
      <TopBar title={t('title')} backLabel={t('common:tabs.more')} fallbackHref={`/r/${rid}/more`} />
      <ScreenContent className="flex flex-col gap-3.5">
        <FilterChips
          label={t('title')}
          value={cat}
          onChange={(v) =>
            void navigate({ to: '/r/$rid/more/feed', params: { rid }, search: v === 'all' ? {} : { cat: v }, replace: true })
          }
          options={[
            { value: 'all', label: t('categories.all'), icon: LayoutList },
            { value: 'updates', label: t('categories.updates'), icon: Megaphone },
            { value: 'news', label: t('categories.newsletters'), icon: Newspaper },
            { value: 'activities', label: t('categories.activities'), icon: Palette },
            { value: 'events', label: t('categories.events'), icon: PartyPopper },
          ]}
        />
        <PullToRefresh onRefresh={() => refetchAll(query.refetch)}>
          <QueryBoundary
            query={query}
            skeleton={<ListSkeleton rows={3} />}
            isEmpty={(d) => d.pages[0]?.items.length === 0}
            empty={<EmptyState icon={Newspaper} title={t('empty')} />}
          >
            {(d) => (
              <div className="flex flex-col gap-2.5">
                {d.pages
                  .flatMap((p) => p.items)
                  .map((item) => (
                    <FeedCard key={item.id} item={item} rid={rid} />
                  ))}
                <LoadMore
                  hasNext={query.hasNextPage}
                  loading={query.isFetchingNextPage}
                  onLoad={() => void query.fetchNextPage()}
                  loadingLabel={t('loadingMore')}
                />
              </div>
            )}
          </QueryBoundary>
        </PullToRefresh>
        <Button asChild variant="secondary" block>
          <Link to="/r/$rid/more/feed/archive" params={{ rid }}>
            <Archive aria-hidden size={20} />
            {t('viewArchive')}
          </Link>
        </Button>
      </ScreenContent>
    </AppFrame>
  )
}

export function FeedStatusChip({ item }: { item: FeedItem }) {
  const { t } = useTranslation(['feed', 'calendar'])
  if (item.requiresReadConfirmation) {
    return item.readConfirmedAt ? (
      <StatusChip tone="green" icon={CircleCheck} label={t('chips.readConfirmed')} />
    ) : (
      <StatusChip tone="violet" icon={Eye} label={t('chips.confirmReading')} />
    )
  }
  if (item.category === 'event' && item.eventId) {
    return item.rsvp ? (
      <StatusChip
        tone={item.rsvp === 'attending' ? 'green' : item.rsvp === 'not_attending' ? 'slate' : 'amber'}
        icon={CalendarCheck}
        label={t(`calendar:event.answer.${item.rsvp}`)}
      />
    ) : (
      <StatusChip status="awaiting_rsvp" />
    )
  }
  return null
}

function FeedCard({ item, rid }: { item: FeedItem; rid: string }) {
  const { t } = useTranslation('feed')
  const meta = KIND_META[item.category]
  const isEvent = item.category === 'event' && !!item.eventId
  const cta = isEvent ? (item.rsvp ? t('cta.viewEvent') : t('cta.rsvp')) : item.category === 'activity' ? t('cta.view') : t('cta.read')
  return (
    <Link
      {...feedTarget(item, rid)}
      className="rounded-card border-border bg-surface shadow-card flex flex-col gap-2.5 border p-3.5 text-start"
    >
      <div className="flex items-start gap-3">
        <IconTile icon={meta.icon} tone={meta.tone} size={44} />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className={cn('text-tag font-extrabold', toneClasses[meta.tone].fg)}>{t(`kinds.${item.category}`)}</span>
          <span className="text-body leading-[1.3] font-extrabold text-pretty wrap-break-word">{item.title}</span>
          <span className="text-meta text-text-2">
            {item.author} · <Ltr>{date(item.publishedAt)}</Ltr>
          </span>
        </div>
      </div>
      <p className="text-secondary text-text-2 m-0 line-clamp-2 wrap-break-word">{item.excerpt}</p>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <FeedStatusChip item={item} />
        <span className="text-secondary text-link ms-auto flex items-center gap-1.5 font-extrabold">
          {isEvent ? <CalendarCheck aria-hidden size={17} /> : <BookOpen aria-hidden size={17} />}
          {cta}
        </span>
      </div>
    </Link>
  )
}
