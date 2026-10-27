import { createFileRoute } from '@tanstack/react-router'
import { UpdateDetailScreen } from '@/features/resident/screens/UpdateDetailScreen'

export const Route = createFileRoute('/_auth/r/$rid/resident/updates/$updateId/')({
  component: function UpdateDetailRoute() {
    const { rid, updateId } = Route.useParams()
    return <UpdateDetailScreen rid={rid} updateId={updateId} />
  },
})
