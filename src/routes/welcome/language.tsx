import { createFileRoute, redirect } from '@tanstack/react-router'
import { appTarget, bootstrapSession } from '@/app/session'
import { LanguageScreen } from '@/features/auth/screens/LanguageScreen'
import { useSessionStore } from '@/stores/session'

export const Route = createFileRoute('/welcome/language')({
  beforeLoad: async ({ context }) => {
    await bootstrapSession(context.queryClient)
    if (useSessionStore.getState().accessToken)
      throw redirect({ ...appTarget({ preferLast: true }), replace: true })
  },
  component: LanguageScreen,
})
