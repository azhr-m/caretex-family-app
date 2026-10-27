import { createFileRoute } from '@tanstack/react-router'
import { InquiryThreadScreen } from '@/features/staff/InquiryThreadScreen'

export const Route = createFileRoute('/_auth/r/$rid/staff/$inquiryId')({
  component: function InquiryThreadRoute() {
    const { rid, inquiryId } = Route.useParams()
    return <InquiryThreadScreen key={inquiryId} rid={rid} inquiryId={inquiryId} />
  },
})
