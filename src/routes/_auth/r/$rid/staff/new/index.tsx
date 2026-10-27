import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { departmentCodeSchema } from '@/api/schemas/common'
import { NewInquiryScreen } from '@/features/staff/NewInquiryScreen'

/** `dept`, `subject` and `ref` ("update:<id>") prefill the form when opened from another screen. */
export const Route = createFileRoute('/_auth/r/$rid/staff/new/')({
  validateSearch: z.object({
    step: z.enum(['department', 'message']).optional().catch(undefined),
    dept: departmentCodeSchema.optional().catch(undefined),
    subject: z.string().max(200).optional().catch(undefined),
    ref: z
      .string()
      .regex(/^[a-z_]+:[\w-]+$/)
      .optional()
      .catch(undefined),
  }),
  component: function NewInquiryRoute() {
    const { rid } = Route.useParams()
    const search = Route.useSearch()
    return <NewInquiryScreen rid={rid} search={search} />
  },
})
