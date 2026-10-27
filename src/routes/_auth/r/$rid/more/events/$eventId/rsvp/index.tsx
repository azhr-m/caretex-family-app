import { createFileRoute } from '@tanstack/react-router'
import { RsvpScreen } from '@/features/feed/EventScreens'

export const Route = createFileRoute('/_auth/r/$rid/more/events/$eventId/rsvp/')({
  component: function RsvpScreenRoute() {
    const { rid, eventId } = Route.useParams()
    return <RsvpScreen rid={rid} eventId={eventId} />
  },
})
