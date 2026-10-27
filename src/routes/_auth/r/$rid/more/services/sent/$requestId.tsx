import { createFileRoute } from '@tanstack/react-router'
import { ServiceSentScreen } from '@/features/services/ServicesScreens'

export const Route = createFileRoute('/_auth/r/$rid/more/services/sent/$requestId')({
  component: function ServiceSentScreenRoute() {
    const { rid, requestId } = Route.useParams()
    return <ServiceSentScreen rid={rid} requestId={requestId} />
  },
})
