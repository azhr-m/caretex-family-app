import { useQueryClient } from '@tanstack/react-query'
import { KeyRound, LockKeyhole, LockOpen, LogOut } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { isApiError } from '@/api/errors'
import { useReauthMutation } from '@/api/queries/auth'
import { useMember } from '@/api/queries/me'
import type { LoginErrorDetails } from '@/api/schemas/auth'
import { idleTimeoutMs } from '@/app/idle'
import { useLogout } from '@/app/session'
import { Avatar } from '@/components/common/Avatar'
import { IconTile } from '@/components/common/IconTile'
import { Ltr } from '@/components/common/Ltr'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { Button } from '@/components/ui/button'
import { PasswordField } from '@/components/ui/fields'
import { MEMBER_TONE } from '@/lib/avatar'
import { formatPhone } from '@/lib/format'
import { useAuthFlowStore } from '@/stores/authFlow'
import { useDevStore } from '@/stores/dev'
import { useOnline } from '@/stores/network'
import { useSessionStore } from '@/stores/session'

/**
 * Re-authentication over blurred, inert content. Not dismissible; the route and scroll position
 * stay untouched underneath, so unlocking resumes exactly where the user was.
 */
export function SessionLockSheet() {
  const { t } = useTranslation('auth')
  const locked = useSessionStore((s) => s.locked)
  const member = useMember()
  const online = useOnline()
  const queryClient = useQueryClient()
  const logout = useLogout()
  const reauth = useReauthMutation()
  const idleMinutes = Math.max(1, Math.round(idleTimeoutMs(useDevStore((s) => s.idleSeconds)) / 60_000))
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string>()

  const submit = () => {
    if (!password || reauth.isPending) return
    setError(undefined)
    reauth.mutate(password, {
      onSuccess: ({ accessToken, expiresAt }) => {
        setPassword('')
        useSessionStore.getState().unlock(accessToken, expiresAt)
        void queryClient.invalidateQueries()
      },
      onError: (e) => {
        setPassword('')
        if (!isApiError(e)) return setError(t('states:error.body'))
        const details = (e.details ?? {}) as LoginErrorDetails
        if (e.code === 'ACCOUNT_LOCKED' || (e.code === 'INVALID_CREDENTIALS' && details.attemptsLeft === 0)) {
          if (details.lockedUntil) {
            useAuthFlowStore.getState().setLock({
              lockedUntil: details.lockedUntil,
              attemptsAllowed: details.attemptsAllowed ?? 5,
              lockMinutes: details.lockMinutes ?? 15,
            })
            void logout('/locked')
          } else {
            void logout()
          }
          return
        }
        setError(e.code === 'INVALID_CREDENTIALS' ? t('login.errField') : t('states:error.body'))
      },
    })
  }

  return (
    <BottomSheet
      open={locked}
      onOpenChange={() => undefined}
      dismissible={false}
      title={
        <span className="flex flex-col items-center gap-2.5 text-center">
          <IconTile icon={LockKeyhole} tone="violet" size={64} className="rounded-[20px]" />
          <span className="text-title-md">{t('session.title')}</span>
        </span>
      }
      description={<span className="block text-center">{t('session.sub', { count: idleMinutes })}</span>}
    >
      <form
        noValidate
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        {member && (
          <div className="rounded-input border-border bg-surface flex items-center gap-3 border p-3">
            <Avatar initials={member.initials} tone={MEMBER_TONE} size={40} />
            <div className="flex min-w-0 flex-col">
              <span className="font-extrabold wrap-break-word">{member.displayName}</span>
              <Ltr className="text-meta text-text-2">{formatPhone(member.phone)}</Ltr>
            </div>
          </div>
        )}
        <PasswordField
          label={t('login.pwLabel')}
          icon={KeyRound}
          autoComplete="current-password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value)
            setError(undefined)
          }}
          disabled={reauth.isPending}
          error={error}
        />
        <Button type="submit" block icon={LockOpen} loading={reauth.isPending} disabled={!online}>
          {t('continue')}
        </Button>
        {member && (
          <Button
            variant="link"
            size="link"
            icon={LogOut}
            className="text-danger self-center"
            onClick={() => void logout()}
          >
            {t('session.notYou', { name: member.firstName })}
          </Button>
        )}
      </form>
    </BottomSheet>
  )
}
