import { createFileRoute, redirect } from '@tanstack/react-router'
import { ResidentPickerScreen } from '@/features/auth/screens/ResidentPickerScreen'
import { useSessionStore } from '@/stores/session'

export const Route = createFileRoute('/_auth/select-resident')({
  beforeLoad: () => {
    const { member, setActiveResident } = useSessionStore.getState()
    const only = member?.residents.length === 1 ? member.residents[0] : undefined
    if (only) {
      setActiveResident(only.id)
      throw redirect({ to: '/r/$rid/home', params: { rid: only.id }, replace: true })
    }
  },
  component: ResidentPickerScreen,
})
