import { createFileRoute } from '@tanstack/react-router'
import { HomeScreen } from '@/features/home/HomeScreen'

export const Route = createFileRoute('/_auth/r/$rid/home')({
  staticData: { tabs: true },
  component: function HomeRoute() {
    const { rid } = Route.useParams()
    return <HomeScreen rid={rid} />
  },
})
