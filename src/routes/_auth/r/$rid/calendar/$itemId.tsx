import { createFileRoute } from '@tanstack/react-router'
import { CalendarItemScreen } from '@/features/calendar/CalendarItemScreen'

export const Route = createFileRoute('/_auth/r/$rid/calendar/$itemId')({
  component: function CalendarItemRoute() {
    const { rid, itemId } = Route.useParams()
    return <CalendarItemScreen key={itemId} rid={rid} itemId={itemId} />
  },
})
