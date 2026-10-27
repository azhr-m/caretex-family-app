import { createFileRoute } from '@tanstack/react-router'
import { MoreMenuScreen } from '@/features/more/MoreMenuScreen'

export const Route = createFileRoute('/_auth/r/$rid/more/')({
  staticData: { tabs: true },
  component: function MoreMenuScreenRoute() {
    const { rid } = Route.useParams()
    return <MoreMenuScreen rid={rid} />
  },
})
