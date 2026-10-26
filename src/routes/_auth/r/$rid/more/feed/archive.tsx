import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { StubScreen } from '@/components/app/ComingSoon'

export const Route = createFileRoute('/_auth/r/$rid/more/feed/archive')({
  validateSearch: z.object({ q: z.string().optional().catch(undefined) }),
  component: () => <StubScreen phase={4} route="/r/$rid/more/feed/archive" />,
})
