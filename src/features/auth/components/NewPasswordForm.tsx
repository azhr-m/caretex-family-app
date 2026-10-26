import { useQuery } from '@tanstack/react-query'
import { CircleCheck, Lock, type LucideIcon } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { DEFAULT_PASSWORD_POLICY, passwordPolicyQuery } from '@/api/queries/auth'
import { Button } from '@/components/ui/button'
import { PasswordField } from '@/components/ui/fields'
import { passwordRules } from '@/lib/validation'
import { useOnline } from '@/stores/network'
import { PasswordRules, StrengthMeter } from './PasswordRules'

/**
 * New + confirm password with live rules. Submit stays disabled until every rule passes;
 * password changes are never queued, so it is also disabled offline.
 */
export function NewPasswordForm({
  submitLabel,
  submitIcon,
  pending,
  fieldError,
  alert,
  showStrength = false,
  defaultVisible = false,
  onSubmit,
  onEdit,
}: {
  submitLabel: string
  submitIcon: LucideIcon
  pending: boolean
  fieldError?: string
  alert?: ReactNode
  showStrength?: boolean
  defaultVisible?: boolean
  onSubmit: (password: string) => void
  onEdit?: () => void
}) {
  const { t } = useTranslation('auth')
  const online = useOnline()
  const policy = useQuery(passwordPolicyQuery()).data ?? DEFAULT_PASSWORD_POLICY
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const allOk = passwordRules(policy, password, confirm).every((r) => r.ok)
  const matches = confirm.length > 0 && password === confirm

  return (
    <form
      noValidate
      className="flex flex-col gap-[18px]"
      onSubmit={(e) => {
        e.preventDefault()
        if (allOk && online && !pending) onSubmit(password)
      }}
    >
      <PasswordField
        label={t('password.newPw')}
        icon={Lock}
        autoComplete="new-password"
        defaultVisible={defaultVisible}
        value={password}
        onChange={(e) => {
          setPassword(e.target.value)
          onEdit?.()
        }}
        disabled={pending}
        error={fieldError}
      />
      <PasswordField
        label={t('password.confirmPw')}
        icon={Lock}
        autoComplete="new-password"
        value={confirm}
        onChange={(e) => {
          setConfirm(e.target.value)
          onEdit?.()
        }}
        disabled={pending}
        valid={matches}
        helper={
          matches ? (
            <span className="text-green-fg flex items-center gap-1.5 font-bold">
              <CircleCheck aria-hidden size={15} />
              {t('password.match')}
            </span>
          ) : undefined
        }
      />
      {showStrength && <StrengthMeter policy={policy} password={password} />}
      <PasswordRules policy={policy} password={password} confirm={confirm} />
      {alert}
      <div className="flex flex-col gap-2">
        <Button type="submit" block icon={submitIcon} loading={pending} disabled={!allOk || !online}>
          {submitLabel}
        </Button>
        {!online ? (
          <p className="text-meta text-text-2 m-0 text-center">{t('password.offline')}</p>
        ) : (
          !allOk && <p className="text-meta text-text-2 m-0 text-center">{t('firstPw.hint')}</p>
        )}
      </div>
    </form>
  )
}

/** Maps a password-change API error to a field message key or a generic alert. */
export function passwordErrorKey(fields?: Record<string, string>) {
  const code = fields?.newPassword
  if (code === 'reused') return 'validation:passwordReused'
  if (code === 'policy') return 'validation:passwordPolicy'
  return undefined
}
