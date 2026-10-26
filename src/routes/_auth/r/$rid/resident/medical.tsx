import { createFileRoute } from '@tanstack/react-router'
import { StubScreen } from '@/components/app/ComingSoon'

export const Route = createFileRoute('/_auth/r/$rid/resident/medical')({
  staticData: { tabs: true },
  component: () => <StubScreen phase={2} route="/r/$rid/resident/medical" tabs />,
})
