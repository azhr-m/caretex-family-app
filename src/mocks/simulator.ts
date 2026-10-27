import { HttpResponse, delay, http } from 'msw'
import { useNetworkStore, type SimulatorMode } from '@/stores/network'
import { apiError, url } from './http'

const LATENCY: Record<SimulatorMode, [number, number]> = {
  normal: [250, 600],
  slow: [2000, 4000],
  stall: [10_000, 12_000],
  offline: [0, 0],
  flaky: [250, 600],
  expire: [250, 600],
  forbidden: [250, 600],
}

const RESIDENT_SCOPED = /\/residents\/[^/]+\/.+/

let refreshMustFail = false

const between = ([min, max]: [number, number]) => min + Math.random() * (max - min)

/**
 * Runs before every mock handler. Returning nothing lets MSW fall through to the real handler.
 * `expire` is one-shot: the next request gets 401 TOKEN_EXPIRED, the refresh that follows fails,
 * and the simulator returns to normal.
 */
export const simulatorHandler = http.all(url('/*'), async ({ request }) => {
  const net = useNetworkStore.getState()
  const mode = net.simulator
  const path = new URL(request.url).pathname

  await delay(between(LATENCY[mode]))

  if (mode === 'offline') return HttpResponse.error()

  if (path.endsWith('/auth/refresh') && refreshMustFail) {
    refreshMustFail = false
    return apiError(401, 'SESSION_REVOKED', 'Session expired')
  }

  if (mode === 'flaky' && Math.random() < 0.2) {
    return apiError(503, 'SERVICE_UNAVAILABLE', 'Service temporarily unavailable', { retryable: true })
  }

  // Images and files aren't API calls (no token, no refresh), so they must not consume the one-shot 401.
  if (mode === 'expire' && !path.includes('/auth/') && !path.includes('/media/')) {
    refreshMustFail = true
    net.setSimulator('normal')
    return apiError(401, 'TOKEN_EXPIRED', 'Access token expired')
  }

  if (mode === 'forbidden' && request.method === 'GET' && RESIDENT_SCOPED.test(path)) {
    return apiError(403, 'PERMISSION_DENIED', 'You do not have permission to view this')
  }

  return undefined
})
