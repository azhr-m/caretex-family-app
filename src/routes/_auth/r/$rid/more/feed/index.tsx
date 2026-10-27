import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { FeedScreen } from '@/features/feed/FeedScreen'

export const Route = createFileRoute('/_auth/r/$rid/more/feed/')({
  validateSearch: z.object({
    cat: z.enum(['all', 'updates', 'news', 'activities', 'events']).optional().catch(undefined),
  }),
  component: function FeedScreenRoute() {
    const { rid } = Route.useParams()
    const search = Route.useSearch()
    return <FeedScreen rid={rid} cat={search.cat ?? 'all'} />
  },
})
