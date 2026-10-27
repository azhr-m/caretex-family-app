import { createFileRoute, redirect } from '@tanstack/react-router'
import { permissionsQuery } from '@/api/queries/residents'
import { firstPermittedSegment } from '@/features/resident/segments'

export const Route = createFileRoute('/_auth/r/$rid/resident/')({
  beforeLoad: async ({ params, context }) => {
    const permissions = await context.queryClient.ensureQueryData(permissionsQuery(params.rid)).catch(() => undefined)
    throw redirect({ to: `/r/$rid/resident/${firstPermittedSegment(permissions)}`, params, replace: true })
  },
})
