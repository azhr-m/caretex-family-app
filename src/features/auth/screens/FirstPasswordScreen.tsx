import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { Check, KeyRound } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { isApiError } from '@/api/errors'
import { keys } from '@/api/keys'
import { useFirstPasswordMutation } from '@/api/queries/auth'
import { appTarget, useLogout } from '@/app/session'
import { Alert } from '@/components/common/Alert'
import { IconTile } from '@/components/common/IconTile'
import { toast } from '@/components/ui/toast'
import { useSessionStore } from '@/stores/session'
import { AuthScreen, ScreenTitle } from '../components/AuthScreen'
import { NewPasswordForm, passwordErrorKey } from '../components/NewPasswordForm'

export function FirstPasswordScreen() {
  const { t } = useTranslation('auth')
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const logout = useLogout()
  const mutation = useFirstPasswordMutation()
  const [fieldKey, setFieldKey] = useState<string>()
  const [failed, setFailed] = useState(false)

  const submit = (password: string) => {
    setFieldKey(undefined)
    setFailed(false)
    mutation.mutate(password, {
      onSuccess: async (res) => {
        useSessionStore.getState().login(res)
        queryClient.setQueryData(keys.me(), res.member)
        toast.success({ title: t('firstPw.saved') })
        await navigate({ ...appTarget(), replace: true })
      },
      onError: (e) => {
        const key = isApiError(e) ? passwordErrorKey(e.fields) : undefined
        if (key) setFieldKey(key)
        else setFailed(true)
      },
    })
  }

  return (
    <AuthScreen
      className="gap-[18px] pt-4"
      topBar={{
        title: t('firstPw.topTitle'),
        backLabel: t('common:actions.back'),
        onBack: () => void logout(),
      }}
    >
      <div className="flex flex-col gap-2">
        <IconTile icon={KeyRound} tone="violet" size={56} className="rounded-btn" />
        <ScreenTitle size="xl" title={t('firstPw.title')} sub={t('firstPw.sub')} />
      </div>
      <NewPasswordForm
        submitLabel={t('firstPw.save')}
        submitIcon={Check}
        pending={mutation.isPending}
        defaultVisible
        showStrength
        fieldError={fieldKey ? t(fieldKey) : undefined}
        onEdit={() => setFieldKey(undefined)}
        alert={failed && <Alert title={t('states:mutationError.title')}>{t('states:error.body')}</Alert>}
        onSubmit={submit}
      />
    </AuthScreen>
  )
}
