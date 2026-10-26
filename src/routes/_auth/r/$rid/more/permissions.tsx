import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { StubScreen } from '@/components/app/ComingSoon'

export const Route = createFileRoute('/_auth/r/$rid/more/permissions')({
  validateSearch: z.object({ resident: z.string().optional().catch(undefined) }),
  component: () => <StubScreen phase={5} route="/r/$rid/more/permissions" />,
})
