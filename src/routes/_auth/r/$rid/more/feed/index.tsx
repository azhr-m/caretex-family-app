import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { StubScreen } from '@/components/app/ComingSoon'

export const Route = createFileRoute('/_auth/r/$rid/more/feed/')({
  validateSearch: z.object({
    cat: z.enum(['all', 'updates', 'news', 'activities', 'events']).optional().catch(undefined),
  }),
  component: () => <StubScreen phase={4} route="/r/$rid/more/feed" />,
})
