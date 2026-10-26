import { QueryClient, onlineManager } from '@tanstack/react-query'
import { isApiError } from '@/api/errors'
import { selectOnline, useNetworkStore } from '@/stores/network'

const RETRY_DELAYS = [1000, 3000]

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        retry: (count, err) => count < 2 && isApiError(err) && err.retryable,
        retryDelay: (attempt) => RETRY_DELAYS[attempt] ?? 3000,
        refetchOnWindowFocus: true,
        networkMode: 'online',
      },
      mutations: { networkMode: 'online', retry: false },
    },
  })
}

/** TanStack's online state follows the network store (device + simulator). */
export function wireOnlineManager() {
  onlineManager.setEventListener((setOnline) => {
    setOnline(selectOnline(useNetworkStore.getState()))
    return useNetworkStore.subscribe((s) => setOnline(selectOnline(s)))
  })
}
