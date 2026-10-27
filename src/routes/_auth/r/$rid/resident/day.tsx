import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { DayScreen } from '@/features/resident/screens/DayScreen'

export const Route = createFileRoute('/_auth/r/$rid/resident/day')({
  validateSearch: z.object({
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional()
      .catch(undefined),
  }),
  staticData: { tabs: true },
  component: function DayRoute() {
    const { rid } = Route.useParams()
    const { date } = Route.useSearch()
    return <DayScreen rid={rid} date={date} />
  },
})
