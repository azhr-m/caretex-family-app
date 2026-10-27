import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import {
  Archive,
  Clock,
  Heart,
  Info,
  LoaderCircle,
  MessageSquarePlus,
  Paperclip,
  RefreshCcwDot,
  Send,
} from 'lucide-react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { isApiError } from '@/api/errors'
import { useMember } from '@/api/queries/me'
import {
  inquiryQuery,
  useMarkInquiryRead,
  usePendingReplies,
  useReply,
  type ReplyVars,
} from '@/api/queries/inquiries'
import type { InquiryDetail, TimelineEntry, TimelineMessage } from '@/api/schemas/inquiries'
import { AppFrame, ScreenContent } from '@/components/app/AppFrame'
import { TopBar } from '@/components/app/TopBar'
import { Alert } from '@/components/common/Alert'
import { AttachmentRow } from '@/components/common/AttachmentRow'
import { Avatar } from '@/components/common/Avatar'
import { IconTile } from '@/components/common/IconTile'
import { Ltr } from '@/components/common/Ltr'
import { StatusChip } from '@/components/common/StatusChip'
import { Stepper } from '@/components/common/Stepper'
import { QueryBoundary } from '@/components/states/QueryBoundary'
import { Banner } from '@/components/ui/banner'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { MEMBER_TONE } from '@/lib/avatar'
import { DEPARTMENT_META } from '@/lib/departments'
import { date, dateTime } from '@/lib/format'
import { INQUIRY_CHIP, INQUIRY_STEPS, stepIndex } from '@/lib/inquiry'
import { firstName } from '@/lib/names'
import { ROLE_META } from '@/lib/staff'
import { STATUS } from '@/lib/status'
import { cn, uuid } from '@/lib/utils'
import { selectOnline, useNetworkStore } from '@/stores/network'
import { UploadList, useAttachmentUploads } from './attachments'

const REPLY_MAX = 1000
const ACTION_BAR_TOAST_OFFSET = '128px'

export function InquiryThreadScreen({ rid, inquiryId }: { rid: string; inquiryId: string }) {
  const { t } = useTranslation(['staff', 'common'])
  const query = useQuery(inquiryQuery(inquiryId))
  return (
    <AppFrame>
      <TopBar title={t('thread.title')} backLabel={t('thread.back')} fallbackHref={`/r/${rid}/staff`} />
      <QueryBoundary query={query} skeleton={<ThreadSkeleton />}>
        {(q) => <Thread inquiry={q} rid={rid} onRefresh={() => void query.refetch()} />}
      </QueryBoundary>
    </AppFrame>
  )
}

function Thread({ inquiry: q, rid, onRefresh }: { inquiry: InquiryDetail; rid: string; onRefresh: () => void }) {
  const { t } = useTranslation(['staff', 'common'])
  const deptLabel = t(`departments.${q.department}`)
  const meta = DEPARTMENT_META[q.department]
  const pending = usePendingReplies(q.id)
  const markRead = useMarkInquiryRead(rid)
  const [changed, setChanged] = useState(false)
  const { mutate: markAsRead } = markRead

  useEffect(() => {
    if (q.hasUnreadReply) markAsRead(q.id)
  }, [q.id, q.hasUnreadReply, markAsRead])

  const closed = q.status === 'closed'

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
                setChanged(false)
                onRefresh()
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
              <h1 className="text-title-xs m-0 leading-[1.3] font-extrabold text-pretty wrap-break-word">{q.subject}</h1>
              <span className="text-meta text-text-2 wrap-break-word">
                {deptLabel} · <Ltr>{q.ref}</Ltr> ·{' '}
                <Trans t={t} i18nKey="thread.opened" values={{ date: date(q.createdAt) }} components={{ ltr: <Ltr /> }} />
              </span>
            </div>
          </div>
          <div>
            <StatusChip status={INQUIRY_CHIP[q.status]} />
          </div>
          <p className="text-secondary text-text-2 m-0">{t(`thread.desc.${q.status}`)}</p>
        </section>

        <nav aria-label={t('thread.stepsLabel')}>
          <Stepper
            current={stepIndex(q.status)}
            steps={INQUIRY_STEPS.map((s) => ({
              label: t(`common:status.${INQUIRY_CHIP[s]}`),
              icon: STATUS[INQUIRY_CHIP[s]].icon,
            }))}
          />
        </nav>

        <ol className="m-0 flex list-none flex-col gap-3 p-0">
          {q.timeline.map((e) => (
            <li key={e.id}>
              {e.type === 'message' ? <MessageCard message={e} /> : <StatusEvent entry={e} deptLabel={deptLabel} />}
            </li>
          ))}
          {pending.map((p) => (
            <li key={p.vars.key}>
              <PendingCard vars={p.vars} paused={p.paused} />
            </li>
          ))}
        </ol>

        {closed && <ClosedBox inquiry={q} rid={rid} />}
      </ScreenContent>
      {!closed && (
        <ReplyBar
          inquiry={q}
          rid={rid}
          deptLabel={deptLabel}
          onConflict={() => setChanged(true)}
          onClosed={onRefresh}
        />
      )}
    </>
  )
}

function MessageCard({ message: m }: { message: TimelineMessage }) {
  const { t } = useTranslation('staff')
  const you = m.author.isYou
  const RoleIcon = you ? Heart : ROLE_META[m.author.roleCode].icon
  return (
    <article
      className={cn(
        'rounded-card border-border flex flex-col gap-2.5 border p-3.5',
        you ? 'bg-mine' : 'bg-surface shadow-card',
      )}
    >
      <header className="flex items-center gap-2.5">
        <Avatar
          initials={m.author.initials}
          photoUrl={m.author.photoUrl}
          tone={you ? MEMBER_TONE : ROLE_META[m.author.roleCode].tone}
          size={38}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="text-body-sm font-extrabold wrap-break-word">
            {you ? t('thread.you', { name: m.author.name }) : m.author.name}
          </span>
          <span className="text-tag text-text-2 flex items-center gap-1">
            <RoleIcon aria-hidden size={13} className="shrink-0" />
            <span className="min-w-0 wrap-break-word">{m.author.role}</span>
          </span>
        </div>
        <Ltr className="text-tag text-text-2 shrink-0 self-start">{dateTime(m.sentAt)}</Ltr>
      </header>
      <p className="text-body-sm m-0 leading-normal whitespace-pre-line wrap-break-word">{m.text}</p>
      {m.attachments.map((a) => (
        <AttachmentRow key={a.id} attachment={a} />
      ))}
    </article>
  )
}

function StatusEvent({ entry, deptLabel }: { entry: Extract<TimelineEntry, { type: 'status' }>; deptLabel: string }) {
  const { t } = useTranslation(['staff', 'common'])
  const status = INQUIRY_CHIP[entry.status]
  const Icon = STATUS[status].icon
  const text =
    entry.status === 'read'
      ? t('thread.eventRead', { dept: deptLabel })
      : entry.status === 'new'
        ? t('thread.eventNew')
        : entry.status === 'closed'
          ? t('thread.eventClosed')
          : t('thread.eventStatus', { status: t(`common:status.${status}`) })
  return (
    <div className="text-tag text-text-2 flex items-center gap-2 font-bold">
      <span aria-hidden className="bg-border h-px min-w-3 flex-1" />
      <Icon aria-hidden size={14} className="shrink-0" />
      <span className="text-center">{text}</span>
      <Ltr className="shrink-0">{dateTime(entry.at)}</Ltr>
      <span aria-hidden className="bg-border h-px min-w-3 flex-1" />
    </div>
  )
}

/** A reply that hasn't reached the server yet: paused offline ("Waiting to send") or in flight. */
function PendingCard({ vars, paused }: { vars: ReplyVars; paused: boolean }) {
  const { t } = useTranslation(['staff', 'states', 'common'])
  const member = useMember()
  return (
    <article className="rounded-card border-amber-bd bg-mine flex flex-col gap-2.5 border border-dashed p-3.5" aria-live="polite">
      <header className="flex items-center gap-2.5">
        <Avatar initials={member?.initials ?? ''} tone={MEMBER_TONE} size={38} />
        <span className="text-body-sm min-w-0 flex-1 font-extrabold wrap-break-word">
          {t('thread.you', { name: member?.displayName ?? '' })}
        </span>
        {paused ? (
          <StatusChip status="waiting_to_send" size="sm" />
        ) : (
          <span className="text-tag text-text-2 flex items-center gap-1 font-bold">
            <LoaderCircle aria-hidden size={14} className="animate-spin" />
            {t('states:stillSending')}
          </span>
        )}
      </header>
      <p className="text-body-sm m-0 leading-normal whitespace-pre-line wrap-break-word">{vars.text}</p>
      {vars.attachments.map((a) => (
        <AttachmentRow key={a.id} attachment={a} />
      ))}
      {paused && (
        <p className="text-meta text-amber-fg m-0 flex items-center gap-1.5 font-bold">
          <Clock aria-hidden size={15} />
          {t('states:queued')}
        </p>
      )}
    </article>
  )
}

function ClosedBox({ inquiry: q, rid }: { inquiry: InquiryDetail; rid: string }) {
  const { t } = useTranslation('staff')
  return (
    <section className="rounded-card bg-slate-bg border-slate-bd flex flex-col gap-3 border p-3.5">
      <div className="text-slate-fg flex items-start gap-3">
        <Archive aria-hidden size={22} className="mt-px shrink-0" />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <h2 className="text-body-sm m-0 font-extrabold">{t('thread.closedTitle')}</h2>
          <p className="text-secondary text-text m-0">
            <Trans
              t={t}
              i18nKey={q.closedBy ? 'thread.closedBody' : 'thread.closedBodyNoBy'}
              values={{ by: q.closedBy, date: dateTime(q.closedAt ?? q.lastMessageAt) }}
              components={{ ltr: <Ltr /> }}
            />
          </p>
        </div>
      </div>
      <Button asChild variant="secondary" block>
        <Link to="/r/$rid/staff/new" params={{ rid }} search={{ dept: q.department, subject: q.subject.slice(0, 80) }}>
          <MessageSquarePlus aria-hidden size={19} />
          {t('thread.newOnTopic')}
        </Link>
      </Button>
    </section>
  )
}

function ReplyBar({
  inquiry,
  rid,
  deptLabel,
  onConflict,
  onClosed,
}: {
  inquiry: InquiryDetail
  rid: string
  deptLabel: string
  onConflict: () => void
  onClosed: () => void
}) {
  const { t } = useTranslation(['staff', 'validation', 'common'])
  const reply = useReply(rid, inquiry.id, deptLabel)
  const uploads = useAttachmentUploads('inquiry')
  const online = useNetworkStore(selectOnline)
  const name = firstName(useMember()?.residents.find((r) => r.id === rid)?.name ?? '')
  const [text, setText] = useState('')
  const [error, setError] = useState<'required' | 'closed' | 'failed' | null>(null)
  const area = useRef<HTMLTextAreaElement>(null)
  const file = useRef<HTMLInputElement>(null)

  useEffect(() => {
    document.documentElement.style.setProperty('--toast-offset', ACTION_BAR_TOAST_OFFSET)
    return () => {
      document.documentElement.style.removeProperty('--toast-offset')
    }
  }, [])

  // Auto-grow up to 5 lines, then scroll inside.
  useLayoutEffect(() => {
    const el = area.current
    if (!el) return
    el.style.height = 'auto'
    const line = parseFloat(getComputedStyle(el).lineHeight) || 22
    el.style.height = `${Math.min(el.scrollHeight, line * 5 + 20)}px`
  }, [text])

  const send = () => {
    const value = text.trim()
    if (!value) {
      setError('required')
      area.current?.focus()
      return
    }
    setError(null)
    const vars: ReplyVars = {
      text: value,
      attachments: uploads.attachments,
      key: uuid(),
      queuedAt: new Date().toISOString(),
    }
    setText('')
    uploads.reset()
    reply.mutate(vars, {
      onError: (e) => {
        // Keep what the family wrote: put it back in the box.
        setText(value)
        if (isApiError(e) && e.code === 'VERSION_CONFLICT') onConflict()
        else if (isApiError(e) && e.code === 'DEADLINE_PASSED') {
          setError('closed')
          onClosed()
        } else setError('failed')
      },
      onSuccess: () => requestAnimationFrame(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })),
    })
    requestAnimationFrame(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }))
  }

  return (
    <div
      className="bg-surface border-border sticky bottom-0 z-20 flex flex-col gap-2 border-t px-3 pt-2.5"
      style={{ paddingBottom: 'max(10px, env(safe-area-inset-bottom))' }}
    >
      {error === 'closed' && <Alert title={t('thread.closedMeanwhile')} />}
      {error === 'failed' && <Alert title={t('thread.sendFailed')}>{t('states:mutationError.body')}</Alert>}
      <UploadList uploads={uploads} compact />
      <div className="flex items-end gap-2">
        <button
          type="button"
          onClick={() => file.current?.click()}
          disabled={!online || uploads.items.length >= 5}
          className="text-text-2 disabled:text-disabled-text flex min-h-11 min-w-12 shrink-0 flex-col items-center justify-center gap-0.5"
        >
          <Paperclip aria-hidden size={19} />
          <span className="text-micro font-extrabold">{t('thread.attach')}</span>
        </button>
        <input
          ref={file}
          type="file"
          accept="image/*,application/pdf,.heic"
          multiple
          hidden
          onChange={(e) => {
            if (e.target.files?.length) uploads.add(e.target.files)
            e.target.value = ''
          }}
        />
        <textarea
          ref={area}
          rows={1}
          value={text}
          maxLength={REPLY_MAX}
          onChange={(e) => {
            setText(e.target.value)
            if (error === 'required') setError(null)
          }}
          aria-label={t('thread.replyLabel')}
          aria-invalid={error === 'required' || undefined}
          aria-describedby={error === 'required' ? 'reply-error' : undefined}
          placeholder={t('thread.replyPlaceholder')}
          className={cn(
            'rounded-input bg-surface text-body-sm placeholder:text-text-2 min-h-11 min-w-0 flex-1 resize-none border-[1.5px] px-3 py-2.5 leading-normal outline-none',
            'focus:border-primary',
            error === 'required' ? 'border-danger' : 'border-border',
          )}
        />
        <Button size="compact" icon={Send} onClick={send} disabled={uploads.uploading > 0} className="shrink-0 px-3.5">
          {t('thread.send')}
        </Button>
      </div>
      {error === 'required' ? (
        <p id="reply-error" role="alert" className="text-meta text-danger m-0">
          {t('validation:replyRequired')}
        </p>
      ) : text.length >= 900 ? (
        <Ltr className={cn('text-meta self-end tabular-nums', text.length >= REPLY_MAX ? 'text-danger' : 'text-amber-fg')}>
          {t('common:field.counter', { count: text.length, max: REPLY_MAX })}
        </Ltr>
      ) : (
        <p className="text-tag text-text-2 m-0 flex items-center gap-1.5">
          <Info aria-hidden size={13} className="shrink-0" />
          {t('thread.replyNote', { dept: deptLabel, name })}
        </p>
      )}
    </div>
  )
}

function ThreadSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <Skeleton className="h-32 w-full rounded-[18px]" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-28 w-full rounded-[18px]" />
      <Skeleton className="h-28 w-full rounded-[18px]" />
    </div>
  )
}
