import { createFileRoute } from '@tanstack/react-router'
import { GeneralScreen } from '@/features/resident/screens/GeneralScreen'

export const Route = createFileRoute('/_auth/r/$rid/resident/general')({
  staticData: { tabs: true },
  component: function GeneralRoute() {
    const { rid } = Route.useParams()
    return <GeneralScreen rid={rid} />
  },
})
