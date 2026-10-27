import { createFileRoute } from '@tanstack/react-router'
import { RsvpDoneScreen } from '@/features/feed/EventScreens'

export const Route = createFileRoute('/_auth/r/$rid/more/events/$eventId/rsvp/done')({
  component: function RsvpDoneScreenRoute() {
    const { rid, eventId } = Route.useParams()
    return <RsvpDoneScreen rid={rid} eventId={eventId} />
  },
})
