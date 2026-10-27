import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import {
  CircleCheck,
  CircleX,
  Clock,
  Download,
  FileCheck,
  FileText,
  MessageCircleQuestion,
  RefreshCcwDot,
  Send,
  Signature,
  Square,
  SquareCheck,
  WifiOff,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { isApiError } from '@/api/errors'
import { centerPublicQuery } from '@/api/queries/center'
import { useMember } from '@/api/queries/me'
import { documentQuery, useApproveDocument, useConfirmDocumentRead, useSignDocument } from '@/api/queries/more'
import type { DocumentDetail } from '@/api/schemas/documents'
import { ActionBar } from '@/components/app/ActionBar'
import { AppFrame, ScreenContent } from '@/components/app/AppFrame'
import { TopBar } from '@/components/app/TopBar'
import { Alert } from '@/components/common/Alert'
import { Ltr } from '@/components/common/Ltr'
import { QueryBoundary } from '@/components/states/QueryBoundary'
import { Banner } from '@/components/ui/banner'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { Button } from '@/components/ui/button'
import { TextArea } from '@/components/ui/fields'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/components/ui/toast'
import { DEPARTMENT_META } from '@/lib/departments'
import { date, dateTime } from '@/lib/format'
import { toneClasses } from '@/lib/status'
import { cn } from '@/lib/utils'
import { selectOnline, useNetworkStore } from '@/stores/network'
import { SignaturePadField, type SignaturePadHandle } from './SignaturePadField'
import { DocumentStatusChip } from './status'

export function DocumentScreen({ rid, docId }: { rid: string; docId: string }) {
  const { t } = useTranslation('documents')
  const query = useQuery(documentQuery(docId))
  return (
    <AppFrame>
      <TopBar title={t('viewer.title')} backLabel={t('list.title')} fallbackHref={`/r/${rid}/more/documents`} />
      <QueryBoundary query={query} skeleton={<Skeleton className="m-4 h-[480px] rounded-[18px]" />}>
        {(d) => <Viewer doc={d} rid={rid} onRefresh={() => void query.refetch()} />}
      </QueryBoundary>
    </AppFrame>
  )
}

/** Paragraph text from the sanitized HTML preview, without ever inserting HTML into the page. */
function paragraphs(html: string | null) {
  if (!html) return []
  const doc = new DOMParser().parseFromString(html, 'text/html')
  return [...doc.querySelectorAll('p')].map((p) => p.textContent?.trim() ?? '').filter(Boolean)
}

function Viewer({ doc: d, rid, onRefresh }: { doc: DocumentDetail; rid: string; onRefresh: () => void }) {
  const { t } = useTranslation(['documents', 'staff', 'auth', 'states'])
  const member = useMember()
  const resident = member?.residents.find((r) => r.id === rid)
  const center = useQuery(centerPublicQuery()).data
  const [zoom, setZoom] = useState(false)
  const [changed, setChanged] = useState(false)
  const paras = useMemo(() => paragraphs(d.previewHtml), [d.previewHtml])
  const dept = t(`staff:departments.${d.from.department}`)
  const DeptIcon = DEPARTMENT_META[d.from.department].icon
  const done = !!d.completedAt

  return (
    <>
      {changed && (
        <Banner
          variant="changed"
          icon={RefreshCcwDot}
          title={t('states:changed.title')}
          action={
            <Button size="compact" onClick={() => {
              setChanged(false)
              onRefresh()
            }}>
              {t('states:changed.refresh')}
            </Button>
          }
        />
      )}
      <ScreenContent className="flex flex-col gap-3.5">
        <div className="flex flex-col gap-2">
          <h1 className="text-title-sm m-0 leading-[1.25] font-extrabold text-pretty wrap-break-word">{d.title}</h1>
          <div className="flex flex-wrap gap-2">
            <DocumentStatusChip doc={d} />
            <span className="rounded-pill bg-surface-2 text-tag inline-flex items-center gap-[5px] px-2.5 py-1 font-bold">
              <DeptIcon aria-hidden size={14} />
              {dept}
            </span>
            {d.dueAt && !done && (
              <span className="rounded-pill bg-surface-2 text-tag inline-flex items-center gap-[5px] px-2.5 py-1 font-bold">
                <Clock aria-hidden size={14} />
                <Trans
                  t={t}
                  i18nKey={d.status === 'overdue' ? 'viewer.wasDue' : 'list.due'}
                  values={{ date: date(d.dueAt) }}
                  components={{ ltr: <Ltr /> }}
                />
              </span>
            )}
          </div>
        </div>

        {/* The paper is always light, like a printed page, in both themes. */}
        <div className="overflow-x-auto rounded-[14px]">
          <article
            className="flex origin-top-left flex-col gap-3 rounded-[14px] border border-[#E4DED3] bg-[#FFFDF8] px-5 py-[22px] text-[#1A2233] shadow-[0_6px_18px_-10px_rgba(0,0,0,.25)] transition-[width,font-size] rtl:origin-top-right"
            style={{ width: zoom ? '140%' : '100%', fontSize: zoom ? '1.15em' : undefined }}
          >
            <div className="text-micro flex items-center justify-between gap-2 font-extrabold tracking-[.06em] text-[#6B7180] uppercase rtl:tracking-normal">
              <span>{center?.name}</span>
              <Ltr>{d.code}</Ltr>
            </div>
            <h2 className="text-title-xs m-0 font-extrabold">{d.title}</h2>
            {paras.map((p, i) => (
              <p key={i} className="text-secondary m-0 leading-[1.6]">
                {p}
              </p>
            ))}
            <div className="text-meta mt-1.5 flex gap-4 border-t border-dashed border-[#C9C3B8] pt-3">
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="font-bold text-[#6B7180]">{t('viewer.residentL')}</span>
                <span className="font-extrabold wrap-break-word">{resident?.name}</span>
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="font-bold text-[#6B7180]">{t('viewer.familyL')}</span>
                <span className="font-extrabold wrap-break-word">
                  {member?.displayName}
                  {resident && `, ${t(`auth:relation.${resident.relation}`).toLowerCase()}`}
                </span>
              </div>
            </div>
          </article>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="text-meta text-text-2 flex items-center gap-1.5 font-extrabold">
            <FileText aria-hidden size={16} />
            {t('viewer.page', { page: 1, count: d.pages })}
          </span>
          <div className="flex gap-2">
            <Button variant="secondary" size="compact" icon={zoom ? ZoomOut : ZoomIn} onClick={() => setZoom((z) => !z)} className="px-3">
              {zoom ? t('viewer.zoomOut') : t('viewer.zoom')}
            </Button>
            <Button asChild variant="secondary" size="compact" className="px-3">
              <a href={d.fileUrl} target="_blank" rel="noreferrer">
                <Download aria-hidden size={16} />
                PDF
              </a>
            </Button>
          </div>
        </div>
      </ScreenContent>

      <Actions doc={d} rid={rid} onConflict={() => setChanged(true)} />
    </>
  )
}

function Actions({ doc: d, rid, onConflict }: { doc: DocumentDetail; rid: string; onConflict: () => void }) {
  const { t } = useTranslation(['documents', 'states'])
  const online = useNetworkStore(selectOnline)
  const [deadline, setDeadline] = useState(false)

  const onError = (e: unknown) => {
    if (isApiError(e) && e.code === 'VERSION_CONFLICT') onConflict()
    else if (isApiError(e) && e.code === 'DEADLINE_PASSED') setDeadline(true)
    else toast.error({ title: t('states:mutationError.title'), body: t('states:mutationError.body') })
  }

  if (d.completedAt) return <DoneBar doc={d} />

  const offlineHelp = (key: string) =>
    !online && (
      <p className="text-meta text-text-2 m-0 flex items-center justify-center gap-1.5">
        <WifiOff aria-hidden size={15} />
        {t(key)}
      </p>
    )

  return (
    <ActionBar>
      {deadline && d.dueAt && (
        <Alert tone="amber" title={t('states:deadline', { date: date(d.dueAt) })} />
      )}
      {d.requiredAction === 'sign' && <SignActions doc={d} rid={rid} disabled={!online || deadline} onError={onError} />}
      {d.requiredAction === 'confirm_read' && (
        <ConfirmReadActions doc={d} rid={rid} disabled={!online || deadline} onError={onError} />
      )}
      {d.requiredAction === 'approve' && <ApproveActions doc={d} rid={rid} disabled={!online || deadline} onError={onError} />}
      {offlineHelp(d.requiredAction === 'sign' ? 'viewer.offlineSign' : d.requiredAction === 'approve' ? 'viewer.offlineApprove' : 'viewer.offlineConfirm')}
    </ActionBar>
  )
}

function DoneBar({ doc: d }: { doc: DocumentDetail }) {
  const { t } = useTranslation('documents')
  const g = toneClasses.green
  const key =
    d.status === 'signed'
      ? 'viewer.signedOn'
      : d.status === 'approved'
        ? 'viewer.approvedOn'
        : d.status === 'declined'
          ? 'viewer.declinedOn'
          : 'viewer.readConfirmedOn'
  const declined = d.status === 'declined'
  return (
    <ActionBar>
      <div
        role="status"
        className={cn(
          'text-body-sm flex min-h-14 items-center justify-center gap-2 rounded-[14px] border px-3 text-center font-extrabold',
          declined ? 'bg-slate-bg border-slate-bd text-slate-fg' : [g.bg, g.bd, g.fg],
        )}
      >
        {declined ? <CircleX aria-hidden size={20} /> : <CircleCheck aria-hidden size={20} />}
        <span>
          <Trans t={t} i18nKey={key} values={{ date: dateTime(d.completedAt!) }} components={{ ltr: <Ltr /> }} />
        </span>
      </div>
      {d.status === 'signed' && (
        <Button asChild variant="secondary" block>
          <a href={d.fileUrl} target="_blank" rel="noreferrer">
            <Download aria-hidden size={20} />
            {t('result.downloadSigned')}
          </a>
        </Button>
      )}
    </ActionBar>
  )
}

type ActionProps = { doc: DocumentDetail; rid: string; disabled: boolean; onError: (e: unknown) => void }

function SignActions({ doc: d, rid, disabled, onError }: ActionProps) {
  const { t } = useTranslation('documents')
  const [open, setOpen] = useState(false)
  return (
    <>
      <div className="flex gap-2.5">
        <Button asChild variant="tonal" className="min-w-[72px] flex-col gap-0.5 px-2">
          <Link
            to="/r/$rid/staff/new"
            params={{ rid }}
            search={{ dept: d.from.department, subject: t('viewer.askSubject', { title: d.title }).slice(0, 80), ref: `document:${d.id}` }}
          >
            <MessageCircleQuestion aria-hidden size={19} />
            <span className="text-micro">{t('viewer.ask')}</span>
          </Link>
        </Button>
        <Button icon={Signature} className="flex-1" disabled={disabled} onClick={() => setOpen(true)}>
          {t('viewer.signDoc')}
        </Button>
      </div>
      <SignSheet doc={d} rid={rid} open={open} onOpenChange={setOpen} onError={onError} />
    </>
  )
}

function SignSheet({
  doc: d,
  rid,
  open,
  onOpenChange,
  onError,
}: {
  doc: DocumentDetail
  rid: string
  open: boolean
  onOpenChange: (o: boolean) => void
  onError: (e: unknown) => void
}) {
  const { t } = useTranslation(['documents', 'common'])
  const navigate = useNavigate()
  const sign = useSignDocument(rid, d.id)
  const online = useNetworkStore(selectOnline)
  const pad = useRef<SignaturePadHandle>(null)
  const [valid, setValid] = useState(false)
  const [drawn, setDrawn] = useState(false)
  const [consent, setConsent] = useState(false)
  const canSend = valid && consent && online && !sign.isPending

  const submit = async () => {
    const png = pad.current?.toPng()
    if (!png || !canSend) return
    try {
      await sign.mutateAsync({ png, version: d.version })
      onOpenChange(false)
      await navigate({ to: '/r/$rid/more/documents/$docId/done', params: { rid, docId: d.id }, replace: true })
    } catch (e) {
      onOpenChange(false)
      onError(e)
    }
  }

  return (
    <BottomSheet
      open={open}
      onOpenChange={(o) => !sign.isPending && onOpenChange(o)}
      dismissible={!sign.isPending}
      title={d.type === 'consent' ? t('sign.titleConsent') : t('sign.title')}
      description={t('sign.sub')}
    >
      <div className="flex flex-col gap-3.5">
        <SignaturePadField
          ref={pad}
          disabled={sign.isPending}
          onChange={(v, wasDrawn) => {
            setValid(v)
            setDrawn(wasDrawn)
          }}
        />
        {drawn && !valid && (
          <p role="alert" className="text-meta text-danger m-0 font-bold">
            {t('sign.needSignature')}
          </p>
        )}
        {d.signatureConsentText && (
          <button
            type="button"
            role="checkbox"
            aria-checked={consent}
            onClick={() => setConsent((c) => !c)}
            className={cn(
              'text-secondary flex min-h-14 items-start gap-3 rounded-[14px] border-2 p-3 text-start font-bold',
              consent ? 'border-primary bg-pill' : 'border-border bg-surface',
            )}
          >
            {consent ? (
              <SquareCheck aria-hidden size={22} className="text-primary shrink-0" />
            ) : (
              <Square aria-hidden size={22} className="text-text-2 shrink-0" />
            )}
            <span className="min-w-0 flex-1">{d.signatureConsentText}</span>
          </button>
        )}
        <div className="flex gap-2.5">
          <Button variant="secondary" className="flex-1" disabled={sign.isPending} onClick={() => onOpenChange(false)}>
            {t('common:actions.cancel')}
          </Button>
          <Button icon={Send} className="flex-[1.6]" loading={sign.isPending} disabled={!canSend} onClick={() => void submit()}>
            {t('sign.send')}
          </Button>
        </div>
      </div>
    </BottomSheet>
  )
}

function ConfirmReadActions({ doc: d, rid, disabled, onError }: ActionProps) {
  const { t } = useTranslation(['documents', 'staff'])
  const confirm = useConfirmDocumentRead(rid, d.id)
  const [checked, setChecked] = useState(false)
  const [tried, setTried] = useState(false)
  const submit = () => {
    if (!checked) return setTried(true)
    confirm.mutate(undefined, {
      onSuccess: () =>
        toast.success({
          title: t('viewer.readToast'),
          body: t('viewer.readToastBody', { dept: t(`staff:departments.${d.from.department}`) }),
        }),
      onError,
    })
  }
  return (
    <>
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        aria-invalid={tried && !checked}
        onClick={() => {
          setChecked((c) => !c)
          setTried(false)
        }}
        className="text-secondary flex min-h-11 items-center gap-2.5 text-start font-bold"
      >
        {checked ? (
          <SquareCheck aria-hidden size={22} className="text-primary shrink-0" />
        ) : (
          <Square aria-hidden size={22} className={cn('shrink-0', tried ? 'text-danger' : 'text-text-2')} />
        )}
        {t('viewer.iRead')}
      </button>
      {tried && !checked && (
        <p role="alert" className="text-meta text-danger m-0 font-bold">
          {t('viewer.checkFirst')}
        </p>
      )}
      <Button block icon={FileCheck} loading={confirm.isPending} disabled={disabled} onClick={submit}>
        {t('viewer.confirmRead')}
      </Button>
    </>
  )
}

function ApproveActions({ doc: d, rid, disabled, onError }: ActionProps) {
  const { t } = useTranslation(['documents', 'staff', 'common'])
  const navigate = useNavigate()
  const approve = useApproveDocument(rid, d.id)
  const [declineOpen, setDeclineOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [reasonError, setReasonError] = useState(false)
  const dept = t(`staff:departments.${d.from.department}`)

  const accept = () =>
    approve.mutate(
      { decision: 'approved' },
      {
        onSuccess: () =>
          void navigate({ to: '/r/$rid/more/documents/$docId/done', params: { rid, docId: d.id }, replace: true }),
        onError,
      },
    )
  const decline = () => {
    const r = reason.trim()
    if (r.length < 5 || r.length > 300) return setReasonError(true)
    approve.mutate(
      { decision: 'declined', reason: r },
      {
        onSuccess: () => {
          setDeclineOpen(false)
          toast.success({ title: t('viewer.declinedToast'), body: t('viewer.declinedToastBody', { dept }) })
        },
        onError: (e) => {
          setDeclineOpen(false)
          onError(e)
        },
      },
    )
  }

  return (
    <>
      <div className="flex gap-2.5">
        <Button variant="danger" icon={CircleX} className="flex-1" disabled={disabled || approve.isPending} onClick={() => setDeclineOpen(true)}>
          {t('viewer.decline')}
        </Button>
        <Button icon={CircleCheck} className="flex-[1.4]" loading={approve.isPending} disabled={disabled} onClick={accept}>
          {d.approveLabel ?? t('viewer.approve')}
        </Button>
      </div>
      <BottomSheet
        open={declineOpen}
        onOpenChange={(o) => !approve.isPending && setDeclineOpen(o)}
        dismissible={!approve.isPending}
        title={t('decline.title')}
        description={t('decline.body')}
      >
        <div className="flex flex-col gap-3.5">
          <TextArea
            label={t('decline.reason')}
            value={reason}
            maxLength={300}
            minHeight={110}
            onChange={(e) => {
              setReason(e.target.value)
              setReasonError(false)
            }}
            helper={t('decline.reasonHelp')}
            error={reasonError ? t('decline.reasonError') : undefined}
          />
          <div className="flex gap-2.5">
            <Button variant="secondary" className="flex-1" disabled={approve.isPending} onClick={() => setDeclineOpen(false)}>
              {t('common:actions.cancel')}
            </Button>
            <Button variant="dangerSolid" icon={CircleX} className="flex-[1.6]" loading={approve.isPending} onClick={decline}>
              {t('decline.confirm')}
            </Button>
          </div>
        </div>
      </BottomSheet>
    </>
  )
}

