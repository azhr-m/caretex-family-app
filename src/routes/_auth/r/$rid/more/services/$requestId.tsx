import { createFileRoute } from '@tanstack/react-router'
import { ServiceDetailScreen } from '@/features/services/ServiceDetailScreen'

export const Route = createFileRoute('/_auth/r/$rid/more/services/$requestId')({
  component: function ServiceDetailScreenRoute() {
    const { rid, requestId } = Route.useParams()
    return <ServiceDetailScreen key={requestId} rid={rid} requestId={requestId} />
  },
})
