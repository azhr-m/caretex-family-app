import { useQuery } from '@tanstack/react-query'
import { CircleCheck, Dot, FileCheck, Square, SquareCheck, WifiOff } from 'lucide-react'
import { useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { feedItemQuery, useConfirmFeedRead } from '@/api/queries/more'
import type { FeedDetail } from '@/api/schemas/feed'
import { AppFrame, ScreenContent } from '@/components/app/AppFrame'
import { TopBar } from '@/components/app/TopBar'
import { AttachmentRow } from '@/components/common/AttachmentRow'
import { Ltr } from '@/components/common/Ltr'
import { StatusChip } from '@/components/common/StatusChip'
import { QueryBoundary } from '@/components/states/QueryBoundary'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/components/ui/toast'
import { dateTime } from '@/lib/format'
import { toneClasses } from '@/lib/status'
import { cn } from '@/lib/utils'
import { selectOnline, useNetworkStore } from '@/stores/network'
import { FeedStatusChip } from './FeedScreen'
import { KIND_META } from './meta'

export function FeedItemScreen({ rid, itemId }: { rid: string; itemId: string }) {
  const { t } = useTranslation(['feed', 'common'])
  const query = useQuery(feedItemQuery(itemId))
  const kind = query.data?.category ?? 'update'
  return (
    <AppFrame>
      <TopBar title={t(`detail.title.${kind}`)} backLabel={t('common:actions.back')} fallbackHref={`/r/${rid}/more/feed`} />
      <ScreenContent>
        <QueryBoundary query={query} skeleton={<Skeleton className="h-96 w-full rounded-[18px]" />}>
          {(item) => <Detail item={item} rid={rid} />}
        </QueryBoundary>
      </ScreenContent>
    </AppFrame>
  )
}

function Detail({ item, rid }: { item: FeedDetail; rid: string }) {
  const { t } = useTranslation('feed')
  const meta = KIND_META[item.category]
  return (
    <article className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <StatusChip tone={meta.tone} icon={meta.icon} label={t(`kinds.${item.category}`)} />
        <FeedStatusChip item={item} />
      </div>
      <h1 className="text-title-md m-0 leading-[1.25] font-extrabold text-pretty wrap-break-word">{item.title}</h1>
      <span className="text-meta text-text-2">
        {item.author} · <Ltr>{dateTime(item.publishedAt)}</Ltr>
      </span>
      {item.coverUrl && <img src={item.coverUrl} alt="" className="rounded-input h-[180px] w-full object-cover" />}
      <p className="text-body m-0 leading-[1.55] whitespace-pre-line wrap-break-word">{item.body}</p>
      {item.highlights.length > 0 && (
        <ul className="rounded-card border-border bg-surface m-0 flex list-none flex-col gap-1 border p-3.5">
          {item.highlights.map((h) => (
            <li key={h} className="text-body-sm flex items-start gap-1.5 font-bold">
              <Dot aria-hidden size={22} className={cn('-mt-px shrink-0', toneClasses[meta.tone].fg)} />
              <span className="min-w-0 flex-1 wrap-break-word">{h}</span>
            </li>
          ))}
        </ul>
      )}
      {item.attachments.map((a) => (
        <AttachmentRow key={a.id} attachment={a} />
      ))}
      {item.requiresReadConfirmation && <ConfirmRead item={item} rid={rid} />}
    </article>
  )
}

function ConfirmRead({ item, rid }: { item: FeedDetail; rid: string }) {
  const { t } = useTranslation('feed')
  const confirm = useConfirmFeedRead(rid, item.id)
  const online = useNetworkStore(selectOnline)
  const [checked, setChecked] = useState(false)
  const [tried, setTried] = useState(false)
  const g = toneClasses.green

  if (item.readConfirmedAt) {
    return (
      <div role="status" className={cn('rounded-card text-body-sm flex items-center gap-2.5 border p-3.5 font-extrabold', g.bg, g.bd, g.fg)}>
        <CircleCheck aria-hidden size={22} className="shrink-0" />
        <span>
          <Trans t={t} i18nKey="detail.confirmedOn" values={{ date: dateTime(item.readConfirmedAt) }} components={{ ltr: <Ltr /> }} />
        </span>
      </div>
    )
  }

  const submit = () => {
    if (!checked) return setTried(true)
    confirm.mutate(undefined, {
      onSuccess: () => toast.success({ title: t('detail.toast'), body: t('detail.toastBody', { author: item.author }) }),
      onError: () => toast.error({ title: t('detail.failed') }),
    })
  }

  return (
    <section className="rounded-card border-border bg-surface flex flex-col gap-3 border p-3.5">
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        aria-invalid={tried && !checked}
        onClick={() => {
          setChecked((c) => !c)
          setTried(false)
        }}
        className="text-secondary flex min-h-11 items-start gap-2.5 text-start font-bold"
      >
        {checked ? (
          <SquareCheck aria-hidden size={22} className="text-primary shrink-0" />
        ) : (
          <Square aria-hidden size={22} className={cn('shrink-0', tried ? 'text-danger' : 'text-text-2')} />
        )}
        <span>{t('detail.iRead')}</span>
      </button>
      {tried && !checked && (
        <p role="alert" className="text-meta text-danger m-0 font-bold">
          {t('detail.checkFirst')}
        </p>
      )}
      <Button block icon={FileCheck} loading={confirm.isPending} disabled={!online} onClick={submit}>
        {t('detail.confirm')}
      </Button>
      {!online && (
        <p className="text-meta text-text-2 m-0 flex items-center justify-center gap-1.5">
          <WifiOff aria-hidden size={15} />
          {t('detail.offline')}
        </p>
      )}
    </section>
  )
}
