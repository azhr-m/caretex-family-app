import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import {
  Camera,
  ChevronRight,
  Circle,
  CircleCheck,
  Eye,
  Hash,
  List,
  RotateCw,
  Send,
  Wrench,
  WifiOff,
} from 'lucide-react'
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { isApiError } from '@/api/errors'
import { serviceQuery, servicesQuery, serviceTypesQuery, useCreateService } from '@/api/queries/account'
import { useMember } from '@/api/queries/me'
import type { ServiceSummary, ServiceTypeCode } from '@/api/schemas/account'
import { AppFrame, ScreenContent } from '@/components/app/AppFrame'
import { PullToRefresh, refetchAll } from '@/components/app/PullToRefresh'
import { TopBar } from '@/components/app/TopBar'
import { Alert } from '@/components/common/Alert'
import { DirIcon } from '@/components/common/DirIcon'
import { IconTile } from '@/components/common/IconTile'
import { ListGroup } from '@/components/common/ListRow'
import { LoadMore } from '@/components/common/LoadMore'
import { Ltr } from '@/components/common/Ltr'
import { StatusChip } from '@/components/common/StatusChip'
import { SummaryRow } from '@/components/common/SummaryRow'
import { QueryBoundary } from '@/components/states/QueryBoundary'
import { EmptyState, ResultScreen } from '@/components/states/states'
import { Button } from '@/components/ui/button'
import { TextArea } from '@/components/ui/fields'
import { Fab } from '@/components/ui/fab'
import { FilterChips } from '@/components/ui/filter-chips'
import { ListSkeleton, Skeleton } from '@/components/ui/skeleton'
import { UploadList, useAttachmentUploads } from '@/features/staff/attachments'
import { bidiIsolate, date, dateTime } from '@/lib/format'
import { firstName } from '@/lib/names'
import { cn, uuid } from '@/lib/utils'
import { selectOnline, useNetworkStore } from '@/stores/network'
import { STATUS_META, TYPE_META } from './meta'

export function ServiceStatusChip({ status }: { status: ServiceSummary['status'] }) {
  const { t } = useTranslation('services')
  const m = STATUS_META[status]
  return <StatusChip tone={m.tone} icon={m.icon} label={t(`status.${status}`)} />
}

export function ServicesListScreen({ rid }: { rid: string }) {
  const { t } = useTranslation(['services', 'common'])
  const navigate = useNavigate()
  const query = useInfiniteQuery(servicesQuery(rid))
  const name = firstName(useMember()?.residents.find((r) => r.id === rid)?.name ?? '')
  return (
    <AppFrame>
      <TopBar title={t('list.title')} backLabel={t('common:tabs.more')} fallbackHref={`/r/${rid}/more`} />
      <ScreenContent className="flex flex-col gap-3.5 pb-[100px]">
        <p className="text-secondary text-text-2 m-0">{t('list.intro', { name })}</p>
        <PullToRefresh onRefresh={() => refetchAll(query.refetch)}>
          <QueryBoundary
            query={query}
            skeleton={<ListSkeleton rows={3} />}
            isEmpty={(d) => d.pages[0]?.items.length === 0}
            empty={
              <EmptyState
                icon={Wrench}
                title={t('list.empty')}
                action={
                  <Button asChild block>
                    <Link to="/r/$rid/more/services/new" params={{ rid }}>
                      <Wrench aria-hidden size={20} />
                      {t('list.newRequest')}
                    </Link>
                  </Button>
                }
              />
            }
          >
            {(d) => (
              <div className="flex flex-col gap-2.5">
                {d.pages
                  .flatMap((p) => p.items)
                  .map((s) => (
                    <ServiceCard key={s.id} service={s} rid={rid} />
                  ))}
                <LoadMore
                  hasNext={query.hasNextPage}
                  loading={query.isFetchingNextPage}
                  onLoad={() => void query.fetchNextPage()}
                  loadingLabel={t('list.loadingMore')}
                />
              </div>
            )}
          </QueryBoundary>
        </PullToRefresh>
      </ScreenContent>
      <Fab icon={Wrench} label={t('list.newRequest')} onClick={() => void navigate({ to: '/r/$rid/more/services/new', params: { rid } })} />
    </AppFrame>
  )
}

function serviceMeta(s: ServiceSummary, t: (k: string, o?: Record<string, unknown>) => string) {
  if (s.scheduledAt && (s.status === 'assigned' || s.status === 'in_progress')) {
    return t('list.metaScheduled', { date: bidiIsolate(dateTime(s.scheduledAt)) })
  }
  if (s.status === 'handled') return t('list.metaHandled', { date: bidiIsolate(date(s.updatedAt)) })
  if (s.status === 'closed') return t('list.metaClosed', { date: bidiIsolate(date(s.updatedAt)) })
  if (s.status === 'cancelled') return t('list.metaCancelled', { date: bidiIsolate(date(s.updatedAt)) })
  return t('list.metaOpened', { date: bidiIsolate(date(s.createdAt)) })
}

function ServiceCard({ service: s, rid }: { service: ServiceSummary; rid: string }) {
  const { t } = useTranslation('services')
  const meta = TYPE_META[s.type]
  const done = s.status === 'closed' || s.status === 'cancelled'
  return (
    <Link
      to="/r/$rid/more/services/$requestId"
      params={{ rid, requestId: s.id }}
      className={cn('rounded-card border-border bg-surface shadow-card flex flex-col gap-2.5 border p-3.5 text-start', done && 'opacity-80')}
    >
      <div className="flex items-start gap-3">
        <IconTile icon={meta.icon} tone={meta.tone} size={44} />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-body leading-[1.3] font-extrabold text-pretty wrap-break-word">{s.title}</span>
          <span className="text-meta text-text-2">
            {t(`types.${s.type}`)} · <Ltr>{s.ref}</Ltr>
          </span>
          <span className="text-meta text-text-2">{serviceMeta(s, t)}</span>
        </div>
        <DirIcon icon={ChevronRight} size={20} className="text-text-2 mt-1" />
      </div>
      <div>
        <ServiceStatusChip status={s.status} />
      </div>
    </Link>
  )
}

export function NewServiceScreen({ rid }: { rid: string }) {
  const { t } = useTranslation(['services', 'common', 'states'])
  const navigate = useNavigate()
  const types = useQuery(serviceTypesQuery())
  const create = useCreateService(rid)
  const uploads = useAttachmentUploads('service_request', 3)
  const online = useNetworkStore(selectOnline)
  const [type, setType] = useState<ServiceTypeCode | null>(null)
  const [time, setTime] = useState<string | null>(null)
  const [description, setDescription] = useState('')
  const [tried, setTried] = useState(false)
  const [failed, setFailed] = useState(false)
  const key = useRef(uuid())
  const photo = useRef<HTMLInputElement>(null)

  const selected = types.data?.find((x) => x.code === type)
  const descError = description.trim().length < 5 ? (description.trim() ? 'validation:descriptionLength' : 'validation:descriptionRequired') : null

  const submit = async () => {
    setTried(true)
    if (!type || descError) return
    setFailed(false)
    try {
      const created = await create.mutateAsync({
        key: key.current,
        body: {
          type,
          description: description.trim(),
          preferredTime: time ?? selected?.timeOptions[0]?.code ?? null,
          attachmentIds: uploads.attachments.map((a) => a.id),
        },
      })
      uploads.reset()
      await navigate({ to: '/r/$rid/more/services/sent/$requestId', params: { rid, requestId: created.id }, replace: true })
    } catch (e) {
      if (!(isApiError(e) && e.code === 'VALIDATION_FAILED')) setFailed(true)
    }
  }

  return (
    <AppFrame>
      <TopBar title={t('new.title')} backLabel={t('common:actions.cancel')} fallbackHref={`/r/${rid}/more/services`} />
      <ScreenContent className="flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <h1 className="text-title-md m-0 font-extrabold">{t('new.what')}</h1>
          <p className="text-secondary text-text-2 m-0">{t('new.whatSub')}</p>
        </div>
        <QueryBoundary
          query={types}
          skeleton={
            <div className="grid grid-cols-2 gap-2.5">
              {Array.from({ length: 6 }, (_, i) => (
                <Skeleton key={i} className="h-16 rounded-[16px]" />
              ))}
            </div>
          }
        >
          {(list) => (
            <div role="radiogroup" aria-label={t('new.what')} className="grid grid-cols-2 gap-2.5">
              {list.map((x) => {
                const m = TYPE_META[x.code]
                const on = x.code === type
                return (
                  <button
                    key={x.code}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => {
                      setType(x.code)
                      setTime(null)
                    }}
                    className={cn(
                      'flex min-h-16 min-w-0 items-center gap-2.5 rounded-[16px] border-2 p-2.5 text-start',
                      on ? 'border-primary bg-pill' : tried && !type ? 'border-danger bg-surface' : 'border-border bg-surface',
                    )}
                  >
                    <IconTile icon={m.icon} tone={m.tone} size={36} />
                    <span className="text-secondary min-w-0 flex-1 font-extrabold wrap-break-word">{x.name}</span>
                    {on ? (
                      <CircleCheck aria-hidden size={20} className="text-primary shrink-0" />
                    ) : (
                      <Circle aria-hidden size={20} className="text-border shrink-0" />
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </QueryBoundary>
        {tried && !type && (
          <p role="alert" className="text-meta text-danger -mt-3 m-0 font-bold">
            {t('validation:typeRequired')}
          </p>
        )}

        <TextArea
          label={t('new.description')}
          value={description}
          maxLength={500}
          minHeight={120}
          onChange={(e) => setDescription(e.target.value)}
          helper={t('new.descriptionHelp')}
          error={tried && descError ? t(descError) : undefined}
        />

        {selected && selected.timeOptions.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="text-secondary font-bold">{t('new.preferredTime')}</span>
            <FilterChips
              label={t('new.preferredTime')}
              value={time ?? selected.timeOptions[0]!.code}
              onChange={setTime}
              options={selected.timeOptions.map((o) => ({ value: o.code, label: o.label }))}
            />
          </div>
        )}

        <div className="flex flex-col gap-2">
          <UploadList uploads={uploads} />
          <Button variant="secondary" size="compact" icon={Camera} disabled={uploads.items.length >= 3} onClick={() => photo.current?.click()}>
            {t('new.addPhoto')}
          </Button>
          <input
            ref={photo}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              if (e.target.files?.length) uploads.add(e.target.files)
              e.target.value = ''
            }}
          />
        </div>

        {failed && (
          <Alert title={t('states:mutationError.title')}>{t('states:mutationError.body')}</Alert>
        )}
        <div className="flex flex-col gap-2">
          <Button block icon={failed ? RotateCw : Send} loading={create.isPending} disabled={!online || uploads.uploading > 0} onClick={() => void submit()}>
            {failed ? t('common:actions.tryAgain') : t('new.send')}
          </Button>
          {!online && (
            <p className="text-meta text-text-2 m-0 flex items-center justify-center gap-1.5">
              <WifiOff aria-hidden size={15} />
              {t('new.offline')}
            </p>
          )}
        </div>
      </ScreenContent>
    </AppFrame>
  )
}

export function ServiceSentScreen({ rid, requestId }: { rid: string; requestId: string }) {
  const { t } = useTranslation('services')
  const query = useQuery(serviceQuery(requestId))
  return (
    <AppFrame>
      <QueryBoundary query={query} skeleton={<Skeleton className="m-6 h-80 rounded-[18px]" />}>
        {(s) => (
          <ResultScreen
            icon={Send}
            tone="green"
            statusLabel={t('sent.chip', { date: bidiIsolate(dateTime(s.createdAt)) })}
            statusIcon={CircleCheck}
            title={t('sent.title')}
            body={t('sent.body', { type: t(`types.${s.type}`) })}
            actions={
              <>
                <Button asChild block>
                  <Link to="/r/$rid/more/services/$requestId" params={{ rid, requestId }} replace>
                    <Eye aria-hidden size={20} />
                    {t('sent.view')}
                  </Link>
                </Button>
                <Button asChild variant="secondary" block>
                  <Link to="/r/$rid/more/services" params={{ rid }} replace>
                    <List aria-hidden size={20} />
                    {t('sent.all')}
                  </Link>
                </Button>
              </>
            }
          >
            <ListGroup>
              <SummaryRow icon={Hash} label={t('sent.reference')}>
                <Ltr>{s.ref}</Ltr>
              </SummaryRow>
              <SummaryRow icon={TYPE_META[s.type].icon} label={t('sent.type')}>
                {t(`types.${s.type}`)}
              </SummaryRow>
            </ListGroup>
          </ResultScreen>
        )}
      </QueryBoundary>
    </AppFrame>
  )
}
