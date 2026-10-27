import '@fontsource/nunito/400.css'
import '@fontsource/nunito/600.css'
import '@fontsource/nunito/700.css'
import '@fontsource/nunito/800.css'
import '@fontsource/nunito/900.css'
import '@fontsource/rubik/400.css'
import '@fontsource/rubik/500.css'
import '@fontsource/rubik/600.css'
import '@fontsource/rubik/700.css'
import '@fontsource/rubik/800.css'
import './styles/index.css'
import { i18nReady } from '@/lib/i18n'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from '@/app/providers'
import { createQueryClient, wireOnlineManager } from '@/app/queryClient'
import { createAppRouter } from '@/app/router'
import { registerAppServiceWorker } from '@/lib/pwa'
import { watchDeviceConnectivity } from '@/stores/network'

async function boot() {
  if (import.meta.env.VITE_USE_MOCKS === 'true') {
    const { startMocks } = await import('./mocks/browser')
    await startMocks()
  }
  watchDeviceConnectivity()
  wireOnlineManager()

  const queryClient = createQueryClient()
  const router = createAppRouter(queryClient)
  // The language file and the first screen's code download in parallel instead of one after the other.
  const firstScreen = router
    .matchRoutes(router.state.location)
    .map((m) => router.loadRouteChunk(router.routesById[m.routeId as keyof typeof router.routesById]))
  await Promise.all([i18nReady(), ...firstScreen])
  registerAppServiceWorker((href) => void router.navigate({ href }))

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App router={router} queryClient={queryClient} />
    </StrictMode>,
  )
}

void boot()
