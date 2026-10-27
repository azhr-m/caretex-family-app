import { createFileRoute } from '@tanstack/react-router'
import { FeedItemScreen } from '@/features/feed/FeedItemScreen'

export const Route = createFileRoute('/_auth/r/$rid/more/feed/$itemId')({
  component: function FeedItemScreenRoute() {
    const { rid, itemId } = Route.useParams()
    return <FeedItemScreen key={itemId} rid={rid} itemId={itemId} />
  },
})
