import { createFileRoute } from '@tanstack/react-router'
import { SplashScreen } from '@/features/auth/screens/SplashScreen'

export const Route = createFileRoute('/splash')({
  component: SplashScreen,
})
