import { useQuery } from '@tanstack/react-query'
import { CircleX, FileText, MessageSquarePlus, RefreshCcwDot, Send, Sunrise, Timer, UserCheck } from 'lucide-react'
import { useRef, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { isApiError } from '@/api/errors'
import { serviceQuery, useCancelService, useCommentService } from '@/api/queries/account'
import type { ServiceDetail } from '@/api/schemas/account'
import { AppFrame, ScreenContent } from '@/components/app/AppFrame'
import { TopBar } from '@/components/app/TopBar'
import { AttachmentRow } from '@/components/common/AttachmentRow'
import { IconTile } from '@/components/common/IconTile'
import { Ltr } from '@/components/common/Ltr'
import { SectionHeader } from '@/components/common/SectionHeader'
import { Stepper } from '@/components/common/Stepper'
import { QueryBoundary } from '@/components/states/QueryBoundary'
import { Banner } from '@/components/ui/banner'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { Button } from '@/components/ui/button'
import { TextArea } from '@/components/ui/fields'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/components/ui/toast'
import { DetailRows, type DetailRow } from '@/features/calendar/DetailRows'
import { date, dateTime } from '@/lib/format'
import { toneClasses } from '@/lib/status'
import { cn, uuid } from '@/lib/utils'
import { SERVICE_STEPS, STATUS_META, TYPE_META, serviceStepIndex } from './meta'
import { ServiceStatusChip } from './ServicesScreens'

export function ServiceDetailScreen({ rid, requestId }: { rid: string; requestId: string }) {
  const { t } = useTranslation('services')
  const query = useQuery(serviceQuery(requestId))
  return (
    <AppFrame>
      <TopBar title={t('detail.title')} backLabel={t('detail.back')} fallbackHref={`/r/${rid}/more/services`} />
      <QueryBoundary query={query} skeleton={<Skeleton className="m-4 h-96 rounded-[18px]" />}>
        {(latest) => <Detail latest={latest} rid={rid} />}
      </QueryBoundary>
    </AppFrame>
  )
}

/**
 * Keeps showing what the family opened; when the server has a newer version (staff changed the
 * request), an amber banner offers Refresh instead of swapping the content under them.
 */
function Detail({ latest, rid }: { latest: ServiceDetail; rid: string }) {
  const { t } = useTranslation(['services', 'states'])
  const [shown, setShown] = useState<ServiceDetail>(latest)
  const [adoptNext, setAdoptNext] = useState(false)
  if (latest !== shown && (latest.version <= shown.version || adoptNext)) {
    // Same version (e.g. our own comment) or a change we caused ourselves: show it directly.
    setShown(latest)
    if (adoptNext) setAdoptNext(false)
  }
  const changed = latest.version > shown.version
  const s = shown
  const meta = TYPE_META[s.type]
  const cancelled = s.status === 'cancelled'

  const rows: DetailRow[] = [
    { icon: FileText, label: t('detail.yourRequest'), value: s.description },
    ...(s.preferredTime ? [{ icon: Sunrise, label: t('detail.preferredTime'), value: s.preferredTime }] : []),
    ...(s.assignee ? [{ icon: UserCheck, label: t('detail.assignedTo'), value: `${s.assignee.name}, ${s.assignee.role}` }] : []),
    ...(s.expected ? [{ icon: Timer, label: t('detail.expected'), value: s.expected }] : []),
  ]

  return (
    <>
      {changed && (
        <Banner
          variant="changed"
          icon={RefreshCcwDot}
          title={t('states:changed.title')}
          action={
            <Button
              size="compact"
              onClick={() => {
                setShown(latest)
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
            >
              {t('states:changed.refresh')}
            </Button>
          }
        />
      )}
      <ScreenContent className="flex flex-col gap-4">
        <section className="rounded-card border-border bg-surface shadow-card flex flex-col gap-2.5 border p-3.5">
          <div className="flex items-start gap-3">
            <IconTile icon={meta.icon} tone={meta.tone} size={44} />
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <h1 className="text-title-xs m-0 leading-[1.3] font-extrabold text-pretty wrap-break-word">{s.title}</h1>
              <span className="text-meta text-text-2 wrap-break-word">
                {t(`types.${s.type}`)} · <Ltr>{s.ref}</Ltr> ·{' '}
                <Trans t={t} i18nKey="detail.opened" values={{ date: date(s.createdAt) }} components={{ ltr: <Ltr /> }} />
              </span>
            </div>
          </div>
          <div>
            <ServiceStatusChip status={s.status} />
          </div>
        </section>

        {cancelled ? (
          <div className="rounded-input bg-slate-bg border-slate-bd text-slate-fg text-body-sm flex items-center gap-2.5 border p-3.5 font-bold">
            <CircleX aria-hidden size={20} className="shrink-0" />
            {t('detail.cancelledNote')}
          </div>
        ) : (
          <nav aria-label={t('detail.stepsLabel')}>
            <Stepper
              current={serviceStepIndex(s.status)}
              steps={SERVICE_STEPS.map((x) => ({ label: t(`status.${x}`), icon: STATUS_META[x].icon }))}
            />
          </nav>
        )}

        <DetailRows rows={rows} />
        {s.attachments.map((a) => (
          <AttachmentRow key={a.id} attachment={a} />
        ))}

        <section className="flex flex-col gap-2.5">
          <SectionHeader>{t('detail.activity')}</SectionHeader>
          <ol className="rounded-card border-border bg-surface m-0 flex list-none flex-col border p-0">
            {s.log.map((e) => {
              const m = STATUS_META[e.status]
              return (
                <li key={e.id} className="border-border flex items-start gap-3 border-b px-3.5 py-3 last:border-b-0">
                  <IconTile icon={m.icon} tone={m.tone} size={36} />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="text-body-sm font-bold whitespace-pre-line wrap-break-word">{e.text}</span>
                    <span className="text-tag text-text-2">
                      {e.by && `${e.by} · `}
                      <Ltr>{dateTime(e.at)}</Ltr>
                    </span>
                  </div>
                </li>
              )
            })}
          </ol>
        </section>

        {!cancelled && s.status !== 'closed' && <CommentButton rid={rid} id={s.id} />}
        {s.canCancel && <CancelButton rid={rid} id={s.id} onCancelled={() => setAdoptNext(true)} />}
      </ScreenContent>
    </>
  )
}

function CommentButton({ rid, id }: { rid: string; id: string }) {
  const { t } = useTranslation(['services', 'common', 'states'])
  const comment = useCommentService(rid, id)
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [tried, setTried] = useState(false)
  const key = useRef(uuid())
  const send = () => {
    setTried(true)
    if (!text.trim()) return
    comment.mutate(
      { text: text.trim(), key: key.current },
      {
        onSuccess: () => {
          setOpen(false)
          setText('')
          setTried(false)
          key.current = uuid()
          toast.success({ title: t('states:toast.sent'), body: t('detail.commentSent') })
        },
        onError: () => toast.error({ title: t('states:mutationError.title'), body: t('states:mutationError.body') }),
      },
    )
  }
  return (
    <>
      <Button variant="secondary" block icon={MessageSquarePlus} onClick={() => setOpen(true)}>
        {t('detail.addComment')}
      </Button>
      <BottomSheet open={open} onOpenChange={(o) => !comment.isPending && setOpen(o)} dismissible={!comment.isPending} title={t('detail.addComment')}>
        <div className="flex flex-col gap-3.5">
          <TextArea
            label={t('detail.comment')}
            value={text}
            maxLength={500}
            minHeight={110}
            onChange={(e) => setText(e.target.value)}
            error={tried && !text.trim() ? t('validation:commentRequired') : undefined}
          />
          <div className="flex gap-2.5">
            <Button variant="secondary" className="flex-1" disabled={comment.isPending} onClick={() => setOpen(false)}>
              {t('common:actions.cancel')}
            </Button>
            <Button icon={Send} className="flex-[1.6]" loading={comment.isPending} onClick={send}>
              {t('detail.sendComment')}
            </Button>
          </div>
        </div>
      </BottomSheet>
    </>
  )
}

function CancelButton({ rid, id, onCancelled }: { rid: string; id: string; onCancelled: () => void }) {
  const { t } = useTranslation(['services', 'states'])
  const cancel = useCancelService(rid, id)
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const r = toneClasses.red
  const confirm = () => {
    onCancelled()
    cancel.mutate(reason.trim() || undefined, {
      onSuccess: () => {
        setOpen(false)
        toast.success({ title: t('detail.cancelledToast') })
      },
      onError: (e) => {
        setOpen(false)
        toast.error({
          title: isApiError(e) && e.code === 'VERSION_CONFLICT' ? t('detail.cannotCancel') : t('states:mutationError.title'),
        })
      },
    })
  }
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn('text-body-sm flex min-h-11 items-center justify-center gap-1.5 font-extrabold', r.fg)}
      >
        <CircleX aria-hidden size={18} />
        {t('detail.cancel')}
      </button>
      <BottomSheet
        open={open}
        onOpenChange={(o) => !cancel.isPending && setOpen(o)}
        dismissible={!cancel.isPending}
        title={t('detail.cancelTitle')}
        description={t('detail.cancelBody')}
      >
        <div className="flex flex-col gap-3.5">
          <TextArea label={t('detail.cancelReason')} value={reason} maxLength={300} minHeight={90} onChange={(e) => setReason(e.target.value)} />
          <div className="flex gap-2.5">
            <Button variant="secondary" className="flex-1" disabled={cancel.isPending} onClick={() => setOpen(false)}>
              {t('detail.keep')}
            </Button>
            <Button variant="dangerSolid" icon={CircleX} className="flex-[1.6]" loading={cancel.isPending} onClick={confirm}>
              {t('detail.cancelConfirm')}
            </Button>
          </div>
        </div>
      </BottomSheet>
    </>
  )
}
