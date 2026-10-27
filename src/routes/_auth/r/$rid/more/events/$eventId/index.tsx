import { createFileRoute } from '@tanstack/react-router'
import { EventScreen } from '@/features/feed/EventScreens'

export const Route = createFileRoute('/_auth/r/$rid/more/events/$eventId/')({
  component: function EventScreenRoute() {
    const { rid, eventId } = Route.useParams()
    return <EventScreen key={eventId} rid={rid} eventId={eventId} />
  },
})
