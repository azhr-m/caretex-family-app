import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { StubScreen } from '@/components/app/ComingSoon'

export const Route = createFileRoute('/_auth/r/$rid/staff/')({
  validateSearch: z.object({
    q: z.string().optional().catch(undefined),
    dept: z.string().optional().catch(undefined),
    status: z.string().optional().catch(undefined),
  }),
  staticData: { tabs: true },
  component: () => <StubScreen phase={3} route="/r/$rid/staff" tabs />,
})
