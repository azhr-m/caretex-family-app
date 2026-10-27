import { createFileRoute } from '@tanstack/react-router'
import { ServicesListScreen } from '@/features/services/ServicesScreens'

export const Route = createFileRoute('/_auth/r/$rid/more/services/')({
  component: function ServicesListScreenRoute() {
    const { rid } = Route.useParams()
    return <ServicesListScreen rid={rid} />
  },
})
