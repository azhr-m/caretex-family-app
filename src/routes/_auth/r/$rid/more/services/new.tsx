import { createFileRoute } from '@tanstack/react-router'
import { NewServiceScreen } from '@/features/services/ServicesScreens'

export const Route = createFileRoute('/_auth/r/$rid/more/services/new')({
  component: function NewServiceScreenRoute() {
    const { rid } = Route.useParams()
    return <NewServiceScreen rid={rid} />
  },
})
