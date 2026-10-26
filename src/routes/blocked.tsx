import { createFileRoute } from '@tanstack/react-router'
import { BlockedScreen } from '@/features/auth/screens/BlockedScreen'

export const Route = createFileRoute('/blocked')({
  component: BlockedScreen,
})
