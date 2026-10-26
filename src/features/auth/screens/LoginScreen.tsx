import { useForm } from '@tanstack/react-form'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import {
  Building2,
  KeyRound,
  KeySquare,
  Languages,
  LogIn,
  Moon,
  ShieldCheck,
  Smartphone,
  Sun,
} from 'lucide-react'
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { isApiError } from '@/api/errors'
import { keys } from '@/api/keys'
import { useLoginMutation } from '@/api/queries/auth'
import { centerPublicQuery } from '@/api/queries/center'
import type { LoginErrorDetails } from '@/api/schemas/auth'
import { appTarget } from '@/app/session'
import { useResolvedTheme } from '@/app/theme'
import { Alert } from '@/components/common/Alert'
import { Ltr } from '@/components/common/Ltr'
import { IconTile } from '@/components/common/IconTile'
import { Button } from '@/components/ui/button'
import { PasswordField, TextField } from '@/components/ui/fields'
import { formatPhone } from '@/lib/format'
import { fieldErrorKey, focusFirstInvalid } from '@/lib/form'
import { identifierSchema, normalizeIdentifier, passwordRequiredSchema } from '@/lib/validation'
import { useAuthFlowStore } from '@/stores/authFlow'
import { useOnline } from '@/stores/network'
import { usePrefsStore } from '@/stores/prefs'
import { useSessionStore } from '@/stores/session'
import { AuthScreen, BrandRow, ScreenTitle } from '../components/AuthScreen'

type LoginError =
  | { kind: 'credentials'; attemptsLeft: number }
  | { kind: 'rateLimited'; minutes: number }
  | { kind: 'generic' }

const headerBtn =
  'border-border bg-surface text-secondary flex min-h-11 items-center gap-1.5 rounded-tile border px-3.5 font-bold'

export function LoginScreen({ redirect }: { redirect?: string }) {
  const { t, i18n } = useTranslation('auth')
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const online = useOnline()
  const theme = useResolvedTheme()
  const setLanguage = usePrefsStore((s) => s.setLanguage)
  const setTheme = usePrefsStore((s) => s.setTheme)
  const center = useQuery(centerPublicQuery())
  const login = useLoginMutation()
  const [error, setError] = useState<LoginError | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)

  const form = useForm({
    defaultValues: { identifier: '', password: '' },
    onSubmitInvalid: () => focusFirstInvalid(formRef.current),
    onSubmit: async ({ value }) => {
      setError(null)
      try {
        const res = await login.mutateAsync({
          identifier: normalizeIdentifier(value.identifier),
          password: value.password,
        })
        useSessionStore.getState().login(res)
        queryClient.setQueryData(keys.me(), res.member)
        await navigate({ ...appTarget({ redirect }), replace: true })
      } catch (e) {
        if (!isApiError(e)) return setError({ kind: 'generic' })
        const details = (e.details ?? {}) as LoginErrorDetails
        if (e.code === 'INVALID_CREDENTIALS') {
          setError({ kind: 'credentials', attemptsLeft: details.attemptsLeft ?? 0 })
          passwordRef.current?.focus()
          passwordRef.current?.select()
        } else if (e.code === 'ACCOUNT_LOCKED' && details.lockedUntil) {
          useAuthFlowStore.getState().setLock({
            lockedUntil: details.lockedUntil,
            attemptsAllowed: details.attemptsAllowed ?? 5,
            lockMinutes: details.lockMinutes ?? 15,
          })
          await navigate({ to: '/locked', replace: true })
        } else if (e.code === 'ACCOUNT_BLOCKED') {
          await navigate({ to: '/blocked', replace: true })
        } else if (e.code === 'RATE_LIMITED') {
          const retryAfterSec = Number(e.details?.retryAfterSec ?? 60)
          setError({ kind: 'rateLimited', minutes: Math.max(1, Math.ceil(retryAfterSec / 60)) })
        } else {
          setError({ kind: 'generic' })
        }
      }
    },
  })

  const credentialsError = error?.kind === 'credentials'
  const busy = login.isPending

  return (
    <AuthScreen>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          className={headerBtn}
          onClick={() => setLanguage(i18n.language === 'he' ? 'en' : 'he')}
          lang={i18n.language === 'he' ? 'en' : 'he'}
        >
          <Languages aria-hidden size={18} />
          {t('login.otherLang')}
        </button>
        <button
          type="button"
          className={headerBtn}
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {theme === 'dark' ? <Sun aria-hidden size={18} /> : <Moon aria-hidden size={18} />}
          {theme === 'dark' ? t('login.themeLight') : t('login.themeDark')}
        </button>
      </div>

      <BrandRow />
      <ScreenTitle size="display" title={t('login.title')} sub={t('login.sub')} />

      {error && (
        <Alert title={t('login.errTitle')}>
          {error.kind === 'credentials'
            ? t('login.errBody', { count: error.attemptsLeft })
            : error.kind === 'rateLimited'
              ? t('states:rateLimited', { count: error.minutes })
              : t('states:error.body')}
        </Alert>
      )}

      <form
        ref={formRef}
        noValidate
        className="flex flex-col gap-5"
        onSubmit={(e) => {
          e.preventDefault()
          void form.handleSubmit()
        }}
      >
        <form.Subscribe selector={(s) => s.submissionAttempts > 0}>
          {(submitted) => (
            <>
              <form.Field
                name="identifier"
                validators={{
                  onBlur: identifierSchema,
                  onChange: identifierSchema,
                  onSubmit: identifierSchema,
                }}
              >
                {(field) => {
                  const key = fieldErrorKey(field.state.meta, submitted)
                  return (
                    <TextField
                      label={t('login.idLabel')}
                      icon={Smartphone}
                      ltr
                      name="username"
                      autoComplete="username"
                      inputMode="text"
                      value={field.state.value}
                      onChange={(e) => {
                        field.handleChange(e.target.value)
                        if (credentialsError) setError(null)
                      }}
                      onBlur={field.handleBlur}
                      disabled={busy}
                      helper={t('login.idHelp')}
                      error={key ? t(key) : undefined}
                      invalid={credentialsError}
                    />
                  )
                }}
              </form.Field>

              <form.Field
                name="password"
                validators={{
                  onBlur: passwordRequiredSchema,
                  onChange: passwordRequiredSchema,
                  onSubmit: passwordRequiredSchema,
                }}
              >
                {(field) => {
                  const key = fieldErrorKey(field.state.meta, submitted)
                  return (
                    <PasswordField
                      ref={passwordRef}
                      label={t('login.pwLabel')}
                      icon={KeyRound}
                      name="password"
                      value={field.state.value}
                      onChange={(e) => {
                        field.handleChange(e.target.value)
                        if (credentialsError) setError(null)
                      }}
                      onBlur={field.handleBlur}
                      disabled={busy}
                      error={key ? t(key) : credentialsError ? t('login.errField') : undefined}
                    />
                  )
                }}
              </form.Field>
            </>
          )}
        </form.Subscribe>

        <Link
          to="/forgot"
          search={{ step: 'phone' }}
          className="text-body-sm text-link -my-1 flex min-h-11 items-center gap-1.5 self-start font-extrabold"
        >
          <KeySquare aria-hidden size={18} />
          {t('login.forgot')}
        </Link>

        <div className="flex flex-col gap-2">
          <Button type="submit" block icon={LogIn} loading={busy} disabled={!online}>
            {t('login.signIn')}
          </Button>
          {!online && <p className="text-meta text-text-2 m-0 text-center">{t('login.offline')}</p>}
        </div>
      </form>

      <div className="rounded-btn border-border bg-surface flex gap-3 border p-3.5">
        <IconTile icon={Building2} tone="blue" size={40} />
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="text-body-sm font-extrabold">{t('login.acctTitle')}</span>
          <span className="text-secondary text-text-2">
            {t('login.acctBody')}
            {center.data && (
              <>
                {' '}
                <Ltr className="text-text font-bold">{formatPhone(center.data.phone)}</Ltr>
              </>
            )}
          </span>
        </div>
      </div>

      <p className="text-meta text-text-2 m-0 flex items-center justify-center gap-1.5 text-center">
        <ShieldCheck aria-hidden size={16} className="shrink-0" />
        {t('login.secure')}
      </p>
    </AuthScreen>
  )
}
