import { useForm } from '@tanstack/react-form'
import { useNavigate } from '@tanstack/react-router'
import {
  CircleCheck,
  Clock,
  Info,
  KeyRound,
  LogIn,
  MessageSquareText,
  Pencil,
  RotateCw,
  Save,
  ShieldCheck,
  Smartphone,
  Timer,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { isApiError } from '@/api/errors'
import {
  useForgotMutation,
  useResendOtpMutation,
  useResetPasswordMutation,
  useVerifyOtpMutation,
} from '@/api/queries/auth'
import type { ForgotResponse } from '@/api/schemas/auth'
import { Alert } from '@/components/common/Alert'
import { InfoBox } from '@/components/common/Card'
import { Ltr } from '@/components/common/Ltr'
import { Stepper } from '@/components/common/Stepper'
import { ResultScreen } from '@/components/states/states'
import { Button } from '@/components/ui/button'
import { TextField } from '@/components/ui/fields'
import { OtpInput } from '@/components/ui/otp-input'
import { toast } from '@/components/ui/toast'
import { bidiIsolate, dateTime } from '@/lib/format'
import { fieldErrorKey, focusFirstInvalid } from '@/lib/form'
import { mmss, useNow } from '@/lib/hooks'
import { forgotPhoneSchema, toE164 } from '@/lib/validation'
import { useAuthFlowStore, type OtpSession } from '@/stores/authFlow'
import { useOnline } from '@/stores/network'
import { AuthScreen, ScreenTitle } from '../components/AuthScreen'
import { NewPasswordForm, passwordErrorKey } from '../components/NewPasswordForm'

export type ForgotStep = 'phone' | 'code' | 'password' | 'done'
const STEP_INDEX: Record<Exclude<ForgotStep, 'done'>, number> = { phone: 0, code: 1, password: 2 }

const toOtpSession = (r: ForgotResponse): OtpSession => ({
  otpSessionId: r.otpSessionId,
  maskedPhone: r.maskedPhone,
  codeLength: r.codeLength,
  resendAvailableAt: Date.now() + r.resendAvailableInSec * 1000,
  expiresAt: Date.now() + r.expiresInSec * 1000,
})

export function ForgotScreen({ step }: { step: ForgotStep }) {
  const { t } = useTranslation('auth')
  const navigate = useNavigate()
  const go = (s: ForgotStep) => navigate({ to: '/forgot', search: { step: s }, replace: true })

  if (step === 'done') return <DoneStep />

  const back = () => {
    if (step === 'phone') return void navigate({ to: '/login', replace: true })
    void go('phone')
  }

  return (
    <AuthScreen
      className="gap-[18px] pt-5"
      topBar={{ title: t('forgot.topTitle'), backLabel: t('common:actions.back'), onBack: back }}
    >
      <Stepper
        current={STEP_INDEX[step]}
        steps={[
          { label: t('forgot.steps.phone'), icon: Smartphone },
          { label: t('forgot.steps.code'), icon: MessageSquareText },
          { label: t('forgot.steps.password'), icon: KeyRound },
        ]}
      />
      {step === 'phone' && <PhoneStep onSent={() => go('code')} />}
      {step === 'code' && <CodeStep onVerified={() => go('password')} onRestart={() => go('phone')} />}
      {step === 'password' && <PasswordStep onDone={() => go('done')} onRestart={() => go('phone')} />}
    </AuthScreen>
  )
}

function PhoneStep({ onSent }: { onSent: () => void }) {
  const { t } = useTranslation('auth')
  const online = useOnline()
  const forgot = useForgotMutation()
  const notice = useAuthFlowStore((s) => s.forgotNotice)
  const [failed, setFailed] = useState<'generic' | 'rateLimited' | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const form = useForm({
    defaultValues: { phone: '' },
    onSubmitInvalid: () => focusFirstInvalid(formRef.current),
    onSubmit: async ({ value }) => {
      setFailed(null)
      try {
        const res = await forgot.mutateAsync(toE164(value.phone))
        const flow = useAuthFlowStore.getState()
        flow.setOtp(toOtpSession(res))
        flow.setForgotNotice(null)
        onSent()
      } catch (e) {
        setFailed(isApiError(e) && e.code === 'RATE_LIMITED' ? 'rateLimited' : 'generic')
      }
    },
  })

  return (
    <>
      <ScreenTitle title={t('forgot.phoneTitle')} sub={t('forgot.phoneSub')} />
      {notice === 'tooManyAttempts' && <Alert tone="amber" title={t('forgot.tooManyAttempts')} />}
      {failed && (
        <Alert title={t('states:mutationError.title')}>
          {failed === 'rateLimited' ? t('states:rateLimited', { count: 1 }) : t('states:error.body')}
        </Alert>
      )}
      <form
        ref={formRef}
        noValidate
        className="flex flex-col gap-[18px]"
        onSubmit={(e) => {
          e.preventDefault()
          void form.handleSubmit()
        }}
      >
        <form.Subscribe selector={(s) => s.submissionAttempts > 0}>
          {(submitted) => (
            <form.Field
              name="phone"
              validators={{
                onBlur: forgotPhoneSchema,
                onChange: forgotPhoneSchema,
                onSubmit: forgotPhoneSchema,
              }}
            >
              {(field) => {
                const key = fieldErrorKey(field.state.meta, submitted)
                return (
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="forgot-phone" className="text-secondary font-bold">
                      {t('forgot.phone')}
                    </label>
                    <div dir="ltr" className="flex gap-2">
                      <select
                        aria-label={t('forgot.countryCode')}
                        defaultValue="+972"
                        className="rounded-input border-border bg-surface min-h-[54px] shrink-0 border-[1.5px] px-3 text-[17px] font-bold"
                      >
                        <option value="+972">+972</option>
                      </select>
                      <TextField
                        id="forgot-phone"
                        containerClassName="min-w-0 flex-1"
                        ltr
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel-national"
                        placeholder="50-123-4567"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        disabled={forgot.isPending}
                        invalid={!!key}
                        className="text-[17px]"
                      />
                    </div>
                    {key ? (
                      <span role="alert" className="text-meta text-danger">
                        {t(key)}
                      </span>
                    ) : (
                      <span className="text-meta text-text-2">{t('forgot.phoneHelp')}</span>
                    )}
                  </div>
                )
              }}
            </form.Field>
          )}
        </form.Subscribe>
        <Button type="submit" block icon={MessageSquareText} loading={forgot.isPending} disabled={!online}>
          {t('forgot.sendCode')}
        </Button>
      </form>
      <InfoBox icon={Info}>{t('forgot.phoneNote')}</InfoBox>
    </>
  )
}

function CodeStep({ onVerified, onRestart }: { onVerified: () => void; onRestart: () => void }) {
  const { t } = useTranslation('auth')
  const online = useOnline()
  const otp = useAuthFlowStore((s) => s.otp)!
  const verify = useVerifyOtpMutation()
  const resend = useResendOtpMutation()
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const now = useNow(1000)
  const resendIn = Math.max(0, Math.ceil((otp.resendAvailableAt - now) / 1000))

  useEffect(() => inputRef.current?.focus(), [])

  const submit = (value: string) => {
    if (value.length !== otp.codeLength || verify.isPending) return
    setError(null)
    verify.mutate(
      { otpSessionId: otp.otpSessionId, code: value },
      {
        onSuccess: (res) => {
          useAuthFlowStore.getState().setResetToken(res.resetToken)
          onVerified()
        },
        onError: (e) => {
          setCode('')
          inputRef.current?.focus()
          if (!isApiError(e)) return setError(t('states:error.body'))
          if (e.code === 'OTP_INVALID') {
            setError(t('forgot.codeInvalid', { count: Number(e.details?.attemptsLeft ?? 0) }))
          } else if (e.code === 'OTP_EXPIRED') {
            setError(t('forgot.codeExpired'))
          } else if (e.code === 'OTP_TOO_MANY_ATTEMPTS') {
            const flow = useAuthFlowStore.getState()
            flow.setOtp(null)
            flow.setForgotNotice('tooManyAttempts')
            onRestart()
          } else {
            setError(t('states:error.body'))
          }
        },
      },
    )
  }

  const onResend = () =>
    resend.mutate(otp.otpSessionId, {
      onSuccess: (res) => {
        useAuthFlowStore.getState().setOtp(toOtpSession(res))
        setError(null)
        setCode('')
        toast.success({ title: t('forgot.resent') })
      },
      onError: () => toast.error({ title: t('states:mutationError.title'), body: t('states:error.body') }),
    })

  return (
    <>
      <ScreenTitle
        title={t('forgot.codeTitle', { count: otp.codeLength })}
        sub={
          <>
            {t('forgot.codeSub')} <Ltr className="text-text font-extrabold">{otp.maskedPhone}</Ltr>
          </>
        }
      />
      <div className="flex flex-col gap-2">
        <OtpInput
          ref={inputRef}
          value={code}
          length={otp.codeLength}
          onChange={(v) => {
            setCode(v)
            if (error) setError(null)
          }}
          onComplete={submit}
          error={!!error}
          disabled={verify.isPending}
          label={t('forgot.codeLabel')}
          describedBy={error ? 'otp-error' : undefined}
        />
        {error && (
          <span id="otp-error" role="alert" className="text-meta text-danger font-bold">
            {error}
          </span>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        {resendIn > 0 ? (
          <span className="text-secondary text-text-2 flex items-center gap-1.5">
            <Timer aria-hidden size={18} />
            <span>
              {t('forgot.resendIn')}{' '}
              <Ltr className="text-text font-extrabold tabular-nums">{mmss(resendIn)}</Ltr>
            </span>
          </span>
        ) : (
          <span />
        )}
        <Button
          variant="link"
          size="link"
          icon={RotateCw}
          disabled={resendIn > 0 || !online}
          loading={resend.isPending}
          onClick={onResend}
          className="text-secondary"
        >
          {t('forgot.resend')}
        </Button>
      </div>
      <Button
        block
        icon={ShieldCheck}
        loading={verify.isPending}
        disabled={!online || code.length !== otp.codeLength}
        onClick={() => submit(code)}
      >
        {t('forgot.verify')}
      </Button>
      <Button variant="link" size="link" icon={Pencil} onClick={onRestart} className="self-center">
        {t('forgot.wrongNum')}
      </Button>
      <InfoBox icon={Info}>{t('forgot.codeNote')}</InfoBox>
    </>
  )
}

function PasswordStep({ onDone, onRestart }: { onDone: () => void; onRestart: () => void }) {
  const { t } = useTranslation('auth')
  const reset = useResetPasswordMutation()
  const resetToken = useAuthFlowStore((s) => s.resetToken)!
  const [fieldKey, setFieldKey] = useState<string>()
  const [failed, setFailed] = useState(false)

  const submit = (newPassword: string) => {
    setFieldKey(undefined)
    setFailed(false)
    reset.mutate(
      { resetToken, newPassword },
      {
        onSuccess: (res) => {
          const flow = useAuthFlowStore.getState()
          flow.setChangedAt(res.changedAt)
          flow.setResetToken(null)
          flow.setOtp(null)
          flow.setLock(null)
          onDone()
        },
        onError: (e) => {
          if (isApiError(e) && e.code === 'OTP_EXPIRED') {
            useAuthFlowStore.getState().resetForgot()
            return onRestart()
          }
          const key = isApiError(e) ? passwordErrorKey(e.fields) : undefined
          if (key) setFieldKey(key)
          else setFailed(true)
        },
      },
    )
  }

  return (
    <>
      <ScreenTitle title={t('forgot.pwTitle')} sub={t('forgot.pwSub')} />
      <NewPasswordForm
        submitLabel={t('forgot.saveNew')}
        submitIcon={Save}
        pending={reset.isPending}
        fieldError={fieldKey ? t(fieldKey) : undefined}
        onEdit={() => setFieldKey(undefined)}
        alert={failed && <Alert title={t('states:mutationError.title')}>{t('states:error.body')}</Alert>}
        onSubmit={submit}
      />
    </>
  )
}

function DoneStep() {
  const { t } = useTranslation('auth')
  const navigate = useNavigate()
  const changedAt = useAuthFlowStore((s) => s.changedAt)
  return (
    <AuthScreen className="p-0">
      <ResultScreen
        icon={CircleCheck}
        tone="green"
        statusLabel={changedAt ? t('forgot.doneChip', { date: bidiIsolate(dateTime(changedAt)) }) : undefined}
        statusIcon={Clock}
        title={t('forgot.doneTitle')}
        body={t('forgot.doneBody')}
        actions={
          <Button
            block
            icon={LogIn}
            onClick={() => {
              useAuthFlowStore.getState().resetForgot()
              void navigate({ to: '/login', replace: true })
            }}
          >
            {t('forgot.backToSignIn')}
          </Button>
        }
      />
    </AuthScreen>
  )
}
