import { createFileRoute } from '@tanstack/react-router'
import { MedicalScreen } from '@/features/resident/screens/MedicalScreen'

export const Route = createFileRoute('/_auth/r/$rid/resident/medical')({
  staticData: { tabs: true },
  component: function MedicalRoute() {
    const { rid } = Route.useParams()
    return <MedicalScreen rid={rid} />
  },
})
