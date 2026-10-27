import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { PermissionsScreen } from '@/features/account/PermissionsScreen'

export const Route = createFileRoute('/_auth/r/$rid/more/permissions')({
  validateSearch: z.object({ resident: z.string().optional().catch(undefined) }),
  component: function PermissionsScreenRoute() {
    const { rid } = Route.useParams()
    const search = Route.useSearch()
    return <PermissionsScreen rid={rid} resident={search.resident} />
  },
})
