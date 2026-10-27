import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { ArchiveScreen } from '@/features/feed/ArchiveScreen'

export const Route = createFileRoute('/_auth/r/$rid/more/feed/archive')({
  validateSearch: z.object({ q: z.string().max(100).optional().catch(undefined) }),
  component: function ArchiveScreenRoute() {
    const { rid } = Route.useParams()
    const search = Route.useSearch()
    return <ArchiveScreen rid={rid} q={search.q ?? ''} />
  },
})
