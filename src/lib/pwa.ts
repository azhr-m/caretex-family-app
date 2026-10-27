/**
 * Registers the app-shell service worker (pwa/sw.js, built to /sw.js). Skipped with mocks on:
 * MSW's worker owns the same scope, and a second registration would replace it.
 */
export function registerAppServiceWorker(open: (url: string) => void) {
  if (!import.meta.env.PROD || import.meta.env.VITE_USE_MOCKS === 'true' || !('serviceWorker' in navigator)) return
  navigator.serviceWorker.addEventListener('message', (event: MessageEvent<{ type?: string; url?: string }>) => {
    if (event.data?.type === 'caretex:open' && event.data.url?.startsWith('/')) open(event.data.url)
  })
  const register = () => void navigator.serviceWorker.register('/sw.js').catch(() => undefined)
  if (document.readyState === 'complete') register()
  else window.addEventListener('load', register, { once: true })
}
