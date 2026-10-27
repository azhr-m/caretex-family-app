import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { CalendarScreen } from '@/features/calendar/CalendarScreen'

export const Route = createFileRoute('/_auth/r/$rid/calendar/')({
  validateSearch: z.object({
    view: z.enum(['month', 'week', 'list']).optional().catch(undefined),
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional()
      .catch(undefined),
  }),
  staticData: { tabs: true },
  component: function CalendarRoute() {
    const { rid } = Route.useParams()
    const search = Route.useSearch()
    return <CalendarScreen rid={rid} search={search} />
  },
})
