import { QueryClientProvider, type QueryClient } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { MotionConfig } from 'framer-motion'
import { Direction } from 'radix-ui'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { authEvents } from '@/api/auth-events'
import { Toaster } from '@/components/ui/toast'
import { dirOf } from '@/lib/i18n'
import { useSurveyDraftsStore } from '@/stores/surveyDrafts'
import { rememberRoute } from './session'
import type { createAppRouter } from './router'
import { useThemeEffect } from './theme'

type Router = ReturnType<typeof createAppRouter>

function useAuthEventNavigation(router: Router, queryClient: QueryClient) {
  useEffect(
    () =>
      authEvents.subscribe((event) => {
        if (event === 'blocked') {
          queryClient.clear()
          useSurveyDraftsStore.getState().clear()
          void router.navigate({ to: '/blocked', replace: true })
        } else if (event === 'passwordChangeRequired') {
          void router.navigate({ to: '/login/first-password', replace: true })
        }
      }),
    [router, queryClient],
  )
}

/** Remembers the last in-app route (splash restores it) and refetches localized data on language change. */
function useAppSync(router: Router, queryClient: QueryClient) {
  const { i18n } = useTranslation()
  useEffect(
    () => router.subscribe('onResolved', ({ toLocation }) => rememberRoute(toLocation.pathname)),
    [router],
  )
  useEffect(() => {
    const onChange = () => void queryClient.invalidateQueries()
    i18n.on('languageChanged', onChange)
    return () => i18n.off('languageChanged', onChange)
  }, [i18n, queryClient])
}

export function App({ router, queryClient }: { router: Router; queryClient: QueryClient }) {
  const { i18n } = useTranslation()
  useThemeEffect()
  useAuthEventNavigation(router, queryClient)
  useAppSync(router, queryClient)

  return (
    <QueryClientProvider client={queryClient}>
      <Direction.Provider dir={dirOf(i18n.language)}>
        <MotionConfig reducedMotion="user">
          <RouterProvider router={router} />
          <Toaster />
        </MotionConfig>
      </Direction.Provider>
    </QueryClientProvider>
  )
}
