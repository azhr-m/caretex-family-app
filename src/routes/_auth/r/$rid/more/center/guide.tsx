import { createFileRoute } from '@tanstack/react-router'
import { CenterGuideScreen } from '@/features/center/CenterScreens'

export const Route = createFileRoute('/_auth/r/$rid/more/center/guide')({
  component: function CenterGuideScreenRoute() {
    const { rid } = Route.useParams()
    return <CenterGuideScreen rid={rid} />
  },
})
