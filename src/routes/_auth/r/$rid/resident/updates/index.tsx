import { createFileRoute } from '@tanstack/react-router'
import { UpdatesScreen } from '@/features/resident/screens/UpdatesScreen'

export const Route = createFileRoute('/_auth/r/$rid/resident/updates/')({
  staticData: { tabs: true },
  component: function UpdatesRoute() {
    const { rid } = Route.useParams()
    return <UpdatesScreen rid={rid} />
  },
})
