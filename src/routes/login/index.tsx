import { createFileRoute, redirect } from '@tanstack/react-router'
import { z } from 'zod'
import { appTarget, bootstrapSession } from '@/app/session'
import { LoginScreen } from '@/features/auth/screens/LoginScreen'
import { useSessionStore } from '@/stores/session'

export const Route = createFileRoute('/login/')({
  validateSearch: z.object({ redirect: z.string().optional().catch(undefined) }),
  beforeLoad: async ({ context, search }) => {
    await bootstrapSession(context.queryClient)
    if (useSessionStore.getState().accessToken) {
      throw redirect({ ...appTarget({ redirect: search.redirect, preferLast: true }), replace: true })
    }
  },
  component: LoginRoute,
})

function LoginRoute() {
  const { redirect } = Route.useSearch()
  return <LoginScreen redirect={redirect} />
}
