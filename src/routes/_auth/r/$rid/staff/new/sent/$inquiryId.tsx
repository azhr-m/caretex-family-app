import { createFileRoute } from '@tanstack/react-router'
import { InquirySentScreen } from '@/features/staff/InquirySentScreen'

export const Route = createFileRoute('/_auth/r/$rid/staff/new/sent/$inquiryId')({
  component: function InquirySentRoute() {
    const { rid, inquiryId } = Route.useParams()
    return <InquirySentScreen rid={rid} inquiryId={inquiryId} />
  },
})
