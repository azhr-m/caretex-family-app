import type { QueryClient } from '@tanstack/react-query'
import { Outlet, createRootRouteWithContext } from '@tanstack/react-router'
import { lazy, Suspense } from 'react'
import { AppFrame, ScreenContent } from '@/components/app/AppFrame'
import { ErrorState } from '@/components/states/states'

const DevPanel = import.meta.env.DEV
  ? lazy(() => import('@/components/app/DevPanel').then((m) => ({ default: m.DevPanel })))
  : () => null

export type RouterContext = { queryClient: QueryClient }

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  notFoundComponent: () => (
    <AppFrame>
      <ScreenContent>
        <ErrorState variant="notFound" />
      </ScreenContent>
    </AppFrame>
  ),
  errorComponent: ({ reset }) => (
    <AppFrame>
      <ScreenContent>
        <ErrorState onRetry={reset} />
      </ScreenContent>
    </AppFrame>
  ),
})

function RootLayout() {
  return (
    <>
      <Outlet />
      <Suspense>
        <DevPanel />
      </Suspense>
    </>
  )
}
