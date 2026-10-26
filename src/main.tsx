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
import '@/lib/i18n'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from '@/app/providers'
import { createQueryClient, wireOnlineManager } from '@/app/queryClient'
import { createAppRouter } from '@/app/router'
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

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App router={router} queryClient={queryClient} />
    </StrictMode>,
  )
}

void boot()
