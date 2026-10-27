import { createFileRoute } from '@tanstack/react-router'
import { NotificationsScreen } from '@/features/notifications/NotificationsScreen'

export const Route = createFileRoute('/_auth/r/$rid/notifications')({
  component: function NotificationsScreenRoute() {
    const { rid } = Route.useParams()
    return <NotificationsScreen rid={rid} />
  },
})
