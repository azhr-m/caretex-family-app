import { HttpResponse, http } from 'msw'
import { setupServer } from 'msw/node'
import { z } from 'zod'
import { useSessionStore } from '@/stores/session'
import { authEvents } from './auth-events'
import { api } from './client'
import { ApiError } from './errors'

const BASE = '/api'
const server = setupServer()
const okSchema = z.object({ ok: z.boolean() })

const envelope = (code: string, status: number, extra: object = {}) =>
  HttpResponse.json(
    { error: { code, message: code, retryable: false, ...extra }, requestId: 'req_1' },
    { status },
  )

beforeAll(() => {
  // jsdom has no base URL for relative fetches; resolve against localhost.
  const realFetch = globalThis.fetch
  vi.spyOn(globalThis, 'fetch').mockImplementation((input, init) =>
    realFetch(typeof input === 'string' ? new URL(input, 'http://localhost').toString() : input, init),
  )
  server.listen({ onUnhandledRequest: 'error' })
})
afterEach(() => {
  server.resetHandlers()
  useSessionStore.getState().logout()
})
afterAll(() => server.close())

function signIn() {
  useSessionStore
    .getState()
    .setTokens({ accessToken: 'old', refreshToken: 'rt', expiresAt: '2026-10-27T10:00:00Z' })
}

describe('api client', () => {
  it('sends auth, language and request-id headers and validates the response', async () => {
    signIn()
    let headers: Headers | undefined
    server.use(
      http.get(`*${BASE}/thing`, ({ request }) => {
        headers = request.headers
        return HttpResponse.json({ ok: true })
      }),
    )
    await expect(api('/thing', { schema: okSchema })).resolves.toEqual({ ok: true })
    expect(headers?.get('Authorization')).toBe('Bearer old')
    expect(headers?.get('Accept-Language')).toMatch(/^(en|he)$/)
    expect(headers?.get('X-Request-Id')).toBeTruthy()
  })

  it('normalizes error envelopes into ApiError', async () => {
    server.use(http.get(`*${BASE}/thing`, () => envelope('PERMISSION_DENIED', 403)))
    const err = await api('/thing', { schema: okSchema }).catch((e: unknown) => e)
    expect(err).toBeInstanceOf(ApiError)
    expect(err).toMatchObject({ status: 403, code: 'PERMISSION_DENIED', requestId: 'req_1' })
  })

  it('rejects responses that do not match the schema', async () => {
    server.use(http.get(`*${BASE}/thing`, () => HttpResponse.json({ ok: 'yes' })))
    await expect(api('/thing', { schema: okSchema })).rejects.toMatchObject({ code: 'INVALID_RESPONSE' })
  })

  it('refreshes once on TOKEN_EXPIRED (deduplicated) and retries', async () => {
    signIn()
    let refreshCalls = 0
    server.use(
      http.post(`*${BASE}/auth/refresh`, () => {
        refreshCalls++
        return HttpResponse.json({
          accessToken: 'new',
          refreshToken: 'rt2',
          expiresAt: '2026-10-27T11:00:00Z',
          mustChangePassword: false,
        })
      }),
      http.get(`*${BASE}/thing`, ({ request }) =>
        request.headers.get('Authorization') === 'Bearer new'
          ? HttpResponse.json({ ok: true })
          : envelope('TOKEN_EXPIRED', 401),
      ),
    )
    const results = await Promise.all([
      api('/thing', { schema: okSchema }),
      api('/thing', { schema: okSchema }),
    ])
    expect(results).toEqual([{ ok: true }, { ok: true }])
    expect(refreshCalls).toBe(1)
    expect(useSessionStore.getState().accessToken).toBe('new')
  })

  it('locks the session (not logout) when refresh fails', async () => {
    signIn()
    const events: string[] = []
    const off = authEvents.subscribe((e) => events.push(e))
    server.use(
      http.post(`*${BASE}/auth/refresh`, () => envelope('SESSION_REVOKED', 401)),
      http.get(`*${BASE}/thing`, () => envelope('TOKEN_EXPIRED', 401)),
    )
    await expect(api('/thing', { schema: okSchema })).rejects.toMatchObject({ code: 'TOKEN_EXPIRED' })
    expect(useSessionStore.getState().locked).toBe(true)
    expect(useSessionStore.getState().accessToken).toBe('old')
    expect(events).toEqual(['locked'])
    off()
  })

  it('hard-logs-out on ACCOUNT_BLOCKED', async () => {
    signIn()
    const events: string[] = []
    const off = authEvents.subscribe((e) => events.push(e))
    server.use(http.get(`*${BASE}/thing`, () => envelope('ACCOUNT_BLOCKED', 403)))
    await expect(api('/thing', { schema: okSchema })).rejects.toBeInstanceOf(ApiError)
    expect(useSessionStore.getState().accessToken).toBeUndefined()
    expect(events).toEqual(['blocked'])
    off()
  })

  it('maps network failures to a retryable NETWORK error', async () => {
    server.use(http.get(`*${BASE}/thing`, () => HttpResponse.error()))
    await expect(api('/thing', { schema: okSchema })).rejects.toMatchObject({
      code: 'NETWORK',
      retryable: true,
    })
  })
})
