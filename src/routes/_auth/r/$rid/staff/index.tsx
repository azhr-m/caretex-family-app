import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { departmentCodeSchema } from '@/api/schemas/common'
import { inquiryStatusSchema } from '@/api/schemas/inquiries'
import { InquiryListScreen } from '@/features/staff/InquiryListScreen'

export const Route = createFileRoute('/_auth/r/$rid/staff/')({
  validateSearch: z.object({
    q: z.string().max(100).optional().catch(undefined),
    dept: departmentCodeSchema.optional().catch(undefined),
    status: inquiryStatusSchema.optional().catch(undefined),
    sort: z.enum(['newest', 'oldest']).optional().catch(undefined),
  }),
  staticData: { tabs: true },
  component: function StaffRoute() {
    const { rid } = Route.useParams()
    const search = Route.useSearch()
    return <InquiryListScreen rid={rid} search={search} />
  },
})
