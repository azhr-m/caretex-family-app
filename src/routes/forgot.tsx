import { createFileRoute, redirect } from '@tanstack/react-router'
import { z } from 'zod'
import { appTarget, bootstrapSession } from '@/app/session'
import { ForgotScreen } from '@/features/auth/screens/ForgotScreen'
import { useAuthFlowStore } from '@/stores/authFlow'
import { useSessionStore } from '@/stores/session'

export const Route = createFileRoute('/forgot')({
  validateSearch: z.object({
    step: z.enum(['phone', 'code', 'password', 'done']).optional().catch(undefined),
  }),
  beforeLoad: async ({ context, search }) => {
    await bootstrapSession(context.queryClient)
    if (useSessionStore.getState().accessToken)
      throw redirect({ ...appTarget({ preferLast: true }), replace: true })
    // Step state lives in memory; a reload mid-flow restarts at the phone step.
    const { otp, resetToken, changedAt } = useAuthFlowStore.getState()
    const step = search.step ?? 'phone'
    const ok =
      step === 'phone' ||
      (step === 'code' && otp) ||
      (step === 'password' && resetToken) ||
      (step === 'done' && changedAt)
    if (!ok || !search.step) throw redirect({ to: '/forgot', search: { step: 'phone' }, replace: true })
  },
  component: ForgotRoute,
})

function ForgotRoute() {
  const { step = 'phone' } = Route.useSearch()
  return <ForgotScreen step={step} />
}
