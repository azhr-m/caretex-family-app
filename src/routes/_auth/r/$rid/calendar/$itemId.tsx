import { createFileRoute } from '@tanstack/react-router'
import { StubScreen } from '@/components/app/ComingSoon'

export const Route = createFileRoute('/_auth/r/$rid/calendar/$itemId')({
  component: () => <StubScreen phase={3} route="/r/$rid/calendar/$itemId" />,
})
