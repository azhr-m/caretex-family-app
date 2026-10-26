import { createFileRoute } from '@tanstack/react-router'
import { StubScreen } from '@/components/app/ComingSoon'

export const Route = createFileRoute('/_auth/r/$rid/staff/new/sent/$inquiryId')({
  component: () => <StubScreen phase={3} route="/r/$rid/staff/new/sent/$inquiryId" />,
})
