import { useForm } from '@tanstack/react-form'
import { useQuery } from '@tanstack/react-query'
import { useBlocker, useNavigate } from '@tanstack/react-router'
import {
  ArrowRight,
  Building2,
  Camera,
  CircleCheck,
  Paperclip,
  Pencil,
  RotateCw,
  Send,
  Siren,
  Trash2,
  Type,
  WifiOff,
} from 'lucide-react'
import { useRef, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { z } from 'zod'
import { isApiError } from '@/api/errors'
import { useMember } from '@/api/queries/me'
import { departmentsQuery, useCreateInquiry } from '@/api/queries/inquiries'
import { residentQuery } from '@/api/queries/residents'
import type { DepartmentCode } from '@/api/schemas/common'
import { AppFrame, ScreenContent } from '@/components/app/AppFrame'
import { TopBar } from '@/components/app/TopBar'
import { Alert } from '@/components/common/Alert'
import { IconTile } from '@/components/common/IconTile'
import { Stepper } from '@/components/common/Stepper'
import { QueryBoundary } from '@/components/states/QueryBoundary'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { Button } from '@/components/ui/button'
import { TextArea, TextField } from '@/components/ui/fields'
import { Skeleton } from '@/components/ui/skeleton'
import { DEPARTMENT_META } from '@/lib/departments'
import { focusFirstInvalid, fieldErrorKey } from '@/lib/form'
import { formatPhone } from '@/lib/format'
import { cn, uuid } from '@/lib/utils'
import { selectOnline, useNetworkStore } from '@/stores/network'
import { UploadList, useAttachmentUploads } from './attachments'

export type NewInquirySearch = {
  step?: 'department' | 'message'
  dept?: DepartmentCode
  subject?: string
  ref?: string
}

const SUBJECT_MAX = 80
const MESSAGE_MAX = 1000

const subjectSchema = z
  .string()
  .trim()
  .min(1, 'validation:subjectRequired')
  .min(3, 'validation:subjectLength')
  .max(SUBJECT_MAX, 'validation:subjectLength')
const messageSchema = z
  .string()
  .trim()
  .min(1, 'validation:messageRequired')
  .min(10, 'validation:messageLength')
  .max(MESSAGE_MAX, 'validation:messageLength')

/**
 * Both steps live in this one component (the step is a search param), so the draft and uploads
 * survive switching steps. Leaving the route with unsaved text asks "Discard this inquiry?".
 */
export function NewInquiryScreen({ rid, search }: { rid: string; search: NewInquirySearch }) {
  const { t } = useTranslation(['staff', 'common'])
  const navigate = useNavigate()
  const step = search.step ?? (search.dept ? 'message' : 'department')
  const [dept, setDept] = useState<DepartmentCode | undefined>(search.dept)
  const uploads = useAttachmentUploads('inquiry')
  const create = useCreateInquiry(rid)
  const online = useNetworkStore(selectOnline)
  const [sendError, setSendError] = useState(false)
  const idempotencyKey = useRef(uuid())
  const submitted = useRef(false)
  const formRef = useRef<HTMLFormElement>(null)
  const prefilledSubject = search.subject ?? ''

  const form = useForm({
    defaultValues: { subject: prefilledSubject, message: '' },
    onSubmitInvalid: () => focusFirstInvalid(formRef.current),
    onSubmit: async ({ value }) => {
      if (!dept) return
      setSendError(false)
      const relatedUpdateId = search.ref?.startsWith('update:') ? search.ref.slice('update:'.length) : undefined
      try {
        const created = await create.mutateAsync({
          key: idempotencyKey.current,
          body: {
            department: dept,
            subject: value.subject.trim(),
            message: value.message.trim(),
            attachmentIds: uploads.attachments.map((a) => a.id),
            ...(relatedUpdateId ? { relatedUpdateId } : {}),
          },
        })
        submitted.current = true
        uploads.reset()
        await navigate({
          to: '/r/$rid/staff/new/sent/$inquiryId',
          params: { rid, inquiryId: created.id },
          replace: true,
        })
      } catch (e) {
        const fields = isApiError(e) ? e.fields : undefined
        if (fields?.subject) form.setFieldMeta('subject', (m) => ({ ...m, errorMap: { onSubmit: 'validation:subjectLength' } }))
        if (fields?.message) form.setFieldMeta('message', (m) => ({ ...m, errorMap: { onSubmit: 'validation:messageLength' } }))
        if (fields?.subject || fields?.message) focusFirstInvalid(formRef.current)
        else setSendError(true)
      }
    },
  })

  const dirty = () => {
    const v = form.state.values
    return !submitted.current && (v.message.trim() !== '' || v.subject.trim() !== prefilledSubject || uploads.items.length > 0)
  }
  const blocker = useBlocker({
    shouldBlockFn: ({ current, next }) => current.pathname !== next.pathname && dirty(),
    enableBeforeUnload: dirty,
    withResolver: true,
  })

  const goStep = (s: 'department' | 'message') =>
    void navigate({ to: '/r/$rid/staff/new', params: { rid }, search: (prev) => ({ ...prev, step: s, dept }) })

  return (
    <AppFrame>
      <TopBar
        title={t('new.title')}
        backLabel={step === 'department' ? t('new.cancel') : t('common:actions.back')}
        fallbackHref={`/r/${rid}/staff`}
      />
      <ScreenContent className="flex flex-col gap-5">
        <Stepper
          current={step === 'department' ? 0 : 1}
          steps={[
            { label: t('new.stepDepartment'), icon: Building2 },
            { label: t('new.stepMessage'), icon: Pencil },
          ]}
          className="mx-auto w-full max-w-[260px]"
        />
        {step === 'department' || !dept ? (
          <DepartmentStep value={dept} onChange={setDept} onContinue={() => goStep('message')} />
        ) : (
          <form
            ref={formRef}
            noValidate
            className="flex flex-col gap-5"
            onSubmit={(e) => {
              e.preventDefault()
              void form.handleSubmit()
            }}
          >
            <SendingTo rid={rid} dept={dept} onChange={() => goStep('department')} />
            <form.Subscribe selector={(s) => s.submissionAttempts > 0}>
              {(attempted) => (
                <>
                  <form.Field name="subject" validators={{ onBlur: subjectSchema, onChange: subjectSchema, onSubmit: subjectSchema }}>
                    {(field) => {
                      const key = fieldErrorKey(field.state.meta, attempted)
                      return (
                        <TextField
                          label={t('new.subject')}
                          icon={Type}
                          value={field.state.value}
                          maxLength={SUBJECT_MAX}
                          onChange={(e) => field.handleChange(e.target.value)}
                          onBlur={field.handleBlur}
                          helper={t('new.subjectHelp')}
                          error={key ? t(key) : undefined}
                        />
                      )
                    }}
                  </form.Field>
                  <form.Field name="message" validators={{ onBlur: messageSchema, onChange: messageSchema, onSubmit: messageSchema }}>
                    {(field) => {
                      const key = fieldErrorKey(field.state.meta, attempted)
                      return (
                        <TextArea
                          label={t('new.message')}
                          value={field.state.value}
                          maxLength={MESSAGE_MAX}
                          warnAt={900}
                          minHeight={140}
                          onChange={(e) => field.handleChange(e.target.value)}
                          onBlur={field.handleBlur}
                          helper={t('new.messageHelp')}
                          error={key ? t(key) : undefined}
                        />
                      )
                    }}
                  </form.Field>
                </>
              )}
            </form.Subscribe>

            <Attachments uploads={uploads} />
            <UrgentNote rid={rid} />

            {sendError && (
              <Alert title={t('states:mutationError.title')}>{t('states:mutationError.body')}</Alert>
            )}
            <div className="flex flex-col gap-2">
              <Button
                type="submit"
                block
                icon={sendError ? RotateCw : Send}
                loading={create.isPending}
                disabled={!online || uploads.uploading > 0}
              >
                {uploads.uploading > 0
                  ? t('new.uploading', { count: uploads.uploading })
                  : sendError
                    ? t('common:actions.tryAgain')
                    : t('new.send')}
              </Button>
              {!online && (
                <p className="text-meta text-text-2 m-0 flex items-center justify-center gap-1.5">
                  <WifiOff aria-hidden size={15} />
                  {t('new.offline')}
                </p>
              )}
            </div>
          </form>
        )}
      </ScreenContent>
      <BottomSheet
        open={blocker.status === 'blocked'}
        onOpenChange={(open) => !open && blocker.reset?.()}
        title={t('new.discardTitle')}
        description={t('new.discardBody')}
      >
        <div className="flex flex-col gap-2.5">
          <Button variant="dangerSolid" icon={Trash2} block onClick={() => blocker.proceed?.()}>
            {t('new.discard')}
          </Button>
          <Button variant="secondary" icon={Pencil} block onClick={() => blocker.reset?.()}>
            {t('new.keep')}
          </Button>
        </div>
      </BottomSheet>
    </AppFrame>
  )
}

function DepartmentStep({
  value,
  onChange,
  onContinue,
}: {
  value?: DepartmentCode
  onChange: (d: DepartmentCode) => void
  onContinue: () => void
}) {
  const { t } = useTranslation(['staff', 'common'])
  const query = useQuery(departmentsQuery())
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-title-md m-0 font-extrabold">{t('new.whoTitle')}</h1>
        <p className="text-secondary text-text-2 m-0">{t('new.whoSub')}</p>
      </div>
      <QueryBoundary
        query={query}
        skeleton={
          <div className="grid grid-cols-2 gap-2.5">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-[104px] rounded-[16px]" />
            ))}
          </div>
        }
      >
        {(departments) => (
          <div role="radiogroup" aria-label={t('new.whoTitle')} className="grid grid-cols-2 gap-2.5">
            {departments.map((d) => {
              const meta = DEPARTMENT_META[d.code]
              const selected = d.code === value
              return (
                <button
                  key={d.code}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => onChange(d.code)}
                  className={cn(
                    'relative flex min-h-[104px] min-w-0 flex-col items-start gap-2 rounded-[16px] border-2 p-3 text-start',
                    selected ? 'border-primary bg-pill' : 'border-border bg-surface',
                  )}
                >
                  <IconTile icon={meta.icon} tone={meta.tone} size={40} />
                  <span className="flex min-w-0 flex-col">
                    <span className="text-body-sm font-extrabold wrap-break-word">{t(`departments.${d.code}`)}</span>
                    <span className="text-tag text-text-2 wrap-break-word">{d.hint}</span>
                  </span>
                  {selected && (
                    <span className="text-tag text-green-fg absolute end-2 top-2 flex items-center gap-1 font-extrabold">
                      <CircleCheck aria-hidden size={18} />
                      {t('common:actions.selected')}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </QueryBoundary>
      <Button block iconEnd={ArrowRight} disabled={!value} onClick={onContinue}>
        {t('new.continue')}
      </Button>
    </div>
  )
}

function SendingTo({ rid, dept, onChange }: { rid: string; dept: DepartmentCode; onChange: () => void }) {
  const { t } = useTranslation('staff')
  const ward = useMember()?.residents.find((r) => r.id === rid)?.ward
  const meta = DEPARTMENT_META[dept]
  return (
    <div className="rounded-card border-border bg-surface flex items-center gap-3 border p-3">
      <IconTile icon={meta.icon} tone={meta.tone} size={40} />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="text-tag text-text-2 font-bold">{t('new.sendingTo')}</span>
        <span className="text-body-sm font-extrabold wrap-break-word">
          {t(`departments.${dept}`)}
          {ward && ` · ${ward}`}
        </span>
      </div>
      <button
        type="button"
        onClick={onChange}
        className="border-border bg-surface-2 text-meta flex min-h-11 shrink-0 items-center gap-1.5 rounded-[12px] border px-3 font-extrabold"
      >
        <Pencil aria-hidden size={15} />
        {t('new.change')}
      </button>
    </div>
  )
}

function Attachments({ uploads }: { uploads: ReturnType<typeof useAttachmentUploads> }) {
  const { t } = useTranslation('staff')
  const photo = useRef<HTMLInputElement>(null)
  const file = useRef<HTMLInputElement>(null)
  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) uploads.add(e.target.files)
    e.target.value = ''
  }
  const full = uploads.items.length >= 5
  return (
    <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
      <legend className="text-secondary mb-1.5 p-0 font-bold">{t('new.attachments')}</legend>
      <UploadList uploads={uploads} />
      <div className="grid grid-cols-2 gap-2.5">
        <Button variant="secondary" size="compact" icon={Camera} disabled={full} onClick={() => photo.current?.click()}>
          {t('new.addPhoto')}
        </Button>
        <Button variant="secondary" size="compact" icon={Paperclip} disabled={full} onClick={() => file.current?.click()}>
          {t('new.addFile')}
        </Button>
      </div>
      <input ref={photo} type="file" accept="image/*" capture="environment" hidden onChange={onPick} />
      <input ref={file} type="file" accept="image/*,application/pdf,.heic" multiple hidden onChange={onPick} />
      <span className="text-meta text-text-2">{t('new.attachHelp')}</span>
    </fieldset>
  )
}

function UrgentNote({ rid }: { rid: string }) {
  const { t } = useTranslation('staff')
  const phone = useQuery(residentQuery(rid)).data?.wardPhone.phone
  if (!phone) return null
  return (
    <div className="rounded-input border-amber-bd bg-amber-bg text-secondary flex items-start gap-2.5 border p-3.5">
      <Siren aria-hidden size={19} className="text-amber-fg mt-px shrink-0" />
      <span className="min-w-0 flex-1 wrap-break-word">
        <Trans
          t={t}
          i18nKey="new.urgent"
          values={{ phone: formatPhone(phone) }}
          components={{ ltr: <a href={`tel:${phone}`} className="text-link font-extrabold" dir="ltr" /> }}
        />
      </span>
    </div>
  )
}
