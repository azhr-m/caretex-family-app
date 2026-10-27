import { createFileRoute, redirect } from '@tanstack/react-router'
import { LockedScreen } from '@/features/auth/screens/LockedScreen'
import { useAuthFlowStore } from '@/stores/authFlow'

export const Route = createFileRoute('/locked')({
  beforeLoad: () => {
    if (!useAuthFlowStore.getState().lock) throw redirect({ to: '/login', replace: true })
  },
  component: LockedScreen,
})
