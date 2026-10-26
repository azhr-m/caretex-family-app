import { createFileRoute } from '@tanstack/react-router'
import { StubScreen } from '@/components/app/ComingSoon'

export const Route = createFileRoute('/_auth/r/$rid/home')({
  staticData: { tabs: true },
  component: () => <StubScreen phase={2} route="/r/$rid/home" tabs />,
})
