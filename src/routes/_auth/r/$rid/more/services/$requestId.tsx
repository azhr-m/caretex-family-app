import { createFileRoute } from '@tanstack/react-router'
import { StubScreen } from '@/components/app/ComingSoon'

export const Route = createFileRoute('/_auth/r/$rid/more/services/$requestId')({
  component: () => <StubScreen phase={5} route="/r/$rid/more/services/$requestId" />,
})
