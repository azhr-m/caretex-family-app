import { createFileRoute } from '@tanstack/react-router'
import { StubScreen } from '@/components/app/ComingSoon'

export const Route = createFileRoute('/_auth/r/$rid/resident/updates/$updateId/')({
  component: () => <StubScreen phase={2} route="/r/$rid/resident/updates/$updateId" />,
})
