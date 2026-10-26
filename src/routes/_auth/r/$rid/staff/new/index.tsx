import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { StubScreen } from '@/components/app/ComingSoon'

export const Route = createFileRoute('/_auth/r/$rid/staff/new/')({
  validateSearch: z.object({ step: z.enum(['department', 'message']).optional().catch(undefined) }),
  component: () => <StubScreen phase={3} route="/r/$rid/staff/new" />,
})
