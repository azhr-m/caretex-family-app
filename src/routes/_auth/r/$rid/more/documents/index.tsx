import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { DocumentsListScreen } from '@/features/documents/DocumentsListScreen'

export const Route = createFileRoute('/_auth/r/$rid/more/documents/')({
  validateSearch: z.object({
    tab: z.enum(['sign', 'confirm', 'done']).optional().catch(undefined),
    type: z.string().optional().catch(undefined),
    year: z.coerce.number().int().optional().catch(undefined),
  }),
  component: function DocumentsListScreenRoute() {
    const { rid } = Route.useParams()
    const search = Route.useSearch()
    return <DocumentsListScreen rid={rid} search={search} />
  },
})
