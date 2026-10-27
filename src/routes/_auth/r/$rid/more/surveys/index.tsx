import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { SurveysListScreen } from '@/features/surveys/SurveysListScreen'

export const Route = createFileRoute('/_auth/r/$rid/more/surveys/')({
  validateSearch: z.object({ tab: z.enum(['active', 'completed']).optional().catch(undefined) }),
  component: function SurveysListScreenRoute() {
    const { rid } = Route.useParams()
    const search = Route.useSearch()
    return <SurveysListScreen rid={rid} tab={search.tab ?? 'active'} />
  },
})
