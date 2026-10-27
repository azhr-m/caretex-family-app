import { createFileRoute } from '@tanstack/react-router'
import { CarePlanScreen } from '@/features/resident/screens/CarePlanScreen'

export const Route = createFileRoute('/_auth/r/$rid/resident/care-plan')({
  staticData: { tabs: true },
  component: function CarePlanRoute() {
    const { rid } = Route.useParams()
    return <CarePlanScreen rid={rid} />
  },
})
