import { createFileRoute, redirect } from '@tanstack/react-router'
import { appTarget, bootstrapSession } from '@/app/session'
import { FirstPasswordScreen } from '@/features/auth/screens/FirstPasswordScreen'
import { useSessionStore } from '@/stores/session'

export const Route = createFileRoute('/login/first-password')({
  beforeLoad: async ({ context }) => {
    await bootstrapSession(context.queryClient)
    const { accessToken, mustChangePassword } = useSessionStore.getState()
    if (!accessToken) throw redirect({ to: '/login', replace: true })
    if (!mustChangePassword) throw redirect({ ...appTarget(), replace: true })
  },
  component: FirstPasswordScreen,
})
