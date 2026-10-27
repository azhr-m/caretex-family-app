import { useInfiniteQuery } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { Archive, ChevronRight, SearchX, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { feedQuery } from '@/api/queries/more'
import type { FeedItem } from '@/api/schemas/feed'
import { AppFrame, ScreenContent } from '@/components/app/AppFrame'
import { TopBar } from '@/components/app/TopBar'
import { DirIcon } from '@/components/common/DirIcon'
import { IconTile } from '@/components/common/IconTile'
import { LoadMore } from '@/components/common/LoadMore'
import { Ltr } from '@/components/common/Ltr'
import { SectionHeader } from '@/components/common/SectionHeader'
import { QueryBoundary } from '@/components/states/QueryBoundary'
import { EmptyState } from '@/components/states/states'
import { StateView } from '@/components/states/StateView'
import { Button } from '@/components/ui/button'
import { SearchField } from '@/components/ui/search-field'
import { ListSkeleton } from '@/components/ui/skeleton'
import { date, monthYear } from '@/lib/format'
import { useLang } from '@/lib/hooks'
import { KIND_META, feedTarget } from './meta'

export function ArchiveScreen({ rid, q }: { rid: string; q: string }) {
  const { t } = useTranslation(['feed', 'common'])
  const navigate = useNavigate()
  const lang = useLang()
  const query = useInfiniteQuery(feedQuery({ category: 'all', archive: true, q: q || undefined }))
  const setQ = (value: string) =>
    void navigate({ to: '/r/$rid/more/feed/archive', params: { rid }, search: value ? { q: value } : {}, replace: true })

  const groups = (items: FeedItem[]) => {
    const map = new Map<string, FeedItem[]>()
    for (const i of items) {
      const k = i.publishedAt.slice(0, 7)
      map.set(k, [...(map.get(k) ?? []), i])
    }
    return [...map]
  }

  return (
    <AppFrame>
      <TopBar title={t('archive.title')} backLabel={t('common:actions.back')} fallbackHref={`/r/${rid}/more/feed`} />
      <ScreenContent className="flex flex-col gap-4">
        <SearchField
          committed={q}
          onSearch={setQ}
          label={t('archive.searchLabel')}
          placeholder={t('archive.search')}
          clearLabel={t('archive.clear')}
        />
        <QueryBoundary
          query={query}
          skeleton={<ListSkeleton rows={4} />}
          isEmpty={(d) => d.pages[0]?.items.length === 0}
          empty={
            q ? (
              <StateView
                icon={SearchX}
                title={t('archive.noResults', { q })}
                body={t('archive.noResultsBody')}
                actions={
                  <Button variant="secondary" block icon={X} onClick={() => setQ('')}>
                    {t('archive.clear')}
                  </Button>
                }
              />
            ) : (
              <EmptyState icon={Archive} title={t('archive.empty')} />
            )
          }
        >
          {(d) => (
            <div className="flex flex-col gap-4">
              {groups(d.pages.flatMap((p) => p.items)).map(([month, items]) => (
                <section key={month} className="flex flex-col gap-2">
                  <SectionHeader>{monthYear(`${month}-15T12:00:00+03:00`, lang)}</SectionHeader>
                  <div className="rounded-card border-border bg-surface flex flex-col border">
                    {items.map((item) => {
                      const meta = KIND_META[item.category]
                      return (
                        <Link
                          key={item.id}
                          {...feedTarget(item, rid)}
                          className="border-border flex min-h-14 items-center gap-3 border-b px-3.5 py-2.5 text-start last:border-b-0"
                        >
                          <IconTile icon={meta.icon} tone={meta.tone} size={36} />
                          <span className="flex min-w-0 flex-1 flex-col">
                            <span className="text-body-sm font-extrabold wrap-break-word">{item.title}</span>
                            <span className="text-tag text-text-2">
                              {t(`archive.kinds.${item.category}`)} · <Ltr>{date(item.publishedAt)}</Ltr>
                            </span>
                          </span>
                          <DirIcon icon={ChevronRight} size={18} className="text-text-2" />
                        </Link>
                      )
                    })}
                  </div>
                </section>
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
      </ScreenContent>
    </AppFrame>
  )
}
