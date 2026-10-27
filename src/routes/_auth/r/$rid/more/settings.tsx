import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { SettingsScreen } from '@/features/settings/SettingsScreen'

export const Route = createFileRoute('/_auth/r/$rid/more/settings')({
  validateSearch: z.object({ view: z.enum(['password']).optional().catch(undefined) }),
  component: function SettingsScreenRoute() {
    const { rid } = Route.useParams()
    const search = Route.useSearch()
    return <SettingsScreen rid={rid} view={search.view} />
  },
})
