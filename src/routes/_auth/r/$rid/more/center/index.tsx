import { createFileRoute } from '@tanstack/react-router'
import { CenterInfoScreen } from '@/features/center/CenterScreens'

export const Route = createFileRoute('/_auth/r/$rid/more/center/')({
  component: function CenterInfoScreenRoute() {
    const { rid } = Route.useParams()
    return <CenterInfoScreen rid={rid} />
  },
})
