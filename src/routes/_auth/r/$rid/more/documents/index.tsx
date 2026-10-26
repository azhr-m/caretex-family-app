import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { StubScreen } from '@/components/app/ComingSoon'

export const Route = createFileRoute('/_auth/r/$rid/more/documents/')({
  validateSearch: z.object({
    tab: z.enum(['sign', 'confirm', 'done']).optional().catch(undefined),
    type: z.string().optional().catch(undefined),
    year: z.coerce.number().int().optional().catch(undefined),
  }),
  component: () => <StubScreen phase={4} route="/r/$rid/more/documents" />,
})
