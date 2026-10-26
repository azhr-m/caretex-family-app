import type { z } from 'zod'
import i18n from '@/lib/i18n'
import { uuid } from '@/lib/utils'
import { useNetworkStore } from '@/stores/network'
import { useSessionStore } from '@/stores/session'
import { authEvents } from './auth-events'
import { ApiError, errorEnvelopeSchema, toServerCode } from './errors'
import { tokensSchema } from './schemas/auth'

export const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/api'
const APP_VERSION = (import.meta.env.VITE_APP_VERSION as string | undefined) ?? 'dev'
const TIMEOUT_MS = 20_000

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export type RequestOptions<S extends z.ZodType> = {
  method?: Method
  body?: unknown
  schema: S
  signal?: AbortSignal
  /** One key per user action so retries are safe. Required for mutations that create things. */
  idempotencyKey?: string
  ifMatch?: number
  /** Send the access token (default true). */
  auth?: boolean
  timeoutMs?: number
}

let refreshing: Promise<boolean> | null = null

/** Refreshes the access token from the stored refresh token. False = refresh rejected; throws NETWORK when offline. */
export const refreshSession = () => refreshOnce()

/** One refresh at a time; every 401 TOKEN_EXPIRED waits on the same promise. */
function refreshOnce(): Promise<boolean> {
  refreshing ??= doRefresh().finally(() => {
    refreshing = null
  })
  return refreshing
}

async function doRefresh(): Promise<boolean> {
  const { refreshToken } = useSessionStore.getState()
  if (!refreshToken) return false
  try {
    const tokens = await request('/auth/refresh', {
      method: 'POST',
      body: { refreshToken },
      schema: tokensSchema,
      auth: false,
    })
    useSessionStore.getState().setTokens(tokens)
    return true
  } catch (e) {
    if (e instanceof ApiError && e.code === 'NETWORK') throw e
    return false
  }
}

async function request<S extends z.ZodType>(path: string, opts: RequestOptions<S>): Promise<z.infer<S>> {
  const method = opts.method ?? 'GET'
  const requestId = uuid()
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Accept-Language': i18n.language === 'he' ? 'he' : 'en',
    'X-App-Version': APP_VERSION,
    'X-Request-Id': requestId,
  }
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json'
  if (opts.idempotencyKey) headers['Idempotency-Key'] = opts.idempotencyKey
  if (opts.ifMatch !== undefined) headers['If-Match'] = String(opts.ifMatch)
  const token = useSessionStore.getState().accessToken
  if (opts.auth !== false && token) headers.Authorization = `Bearer ${token}`

  const timeout = AbortSignal.timeout(opts.timeoutMs ?? TIMEOUT_MS)
  const signal = opts.signal ? AbortSignal.any([opts.signal, timeout]) : timeout

  let res: Response
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
      signal,
    })
  } catch (e) {
    if (opts.signal?.aborted) throw e
    if (timeout.aborted) {
      throw new ApiError({
        status: 0,
        code: 'TIMEOUT',
        message: 'Request timed out',
        retryable: true,
        requestId,
      })
    }
    throw new ApiError({
      status: 0,
      code: 'NETWORK',
      message: 'Network request failed',
      retryable: true,
      requestId,
    })
  }

  if (res.ok) {
    useNetworkStore.getState().markSuccess()
    const raw: unknown = res.status === 204 ? undefined : await res.json().catch(() => undefined)
    const parsed = opts.schema.safeParse(raw)
    if (!parsed.success) {
      if (import.meta.env.DEV)
        console.error(`[api] ${method} ${path} response did not match schema`, parsed.error)
      throw new ApiError({
        status: res.status,
        code: 'INVALID_RESPONSE',
        message: 'Unexpected response from server',
        retryable: false,
        requestId,
      })
    }
    return parsed.data
  }

  const env = errorEnvelopeSchema.safeParse(await res.json().catch(() => undefined))
  if (!env.success) {
    throw new ApiError({
      status: res.status,
      code: res.status >= 500 ? 'SERVICE_UNAVAILABLE' : 'INTERNAL',
      message: res.statusText || 'Request failed',
      retryable: res.status >= 500,
      requestId,
    })
  }
  const { error } = env.data
  throw new ApiError({
    status: res.status,
    code: toServerCode(error.code),
    message: error.message,
    retryable: error.retryable,
    fields: error.fields,
    details: error.details,
    requestId: env.data.requestId,
  })
}

/**
 * Typed request with session handling: refresh-on-401 once, lock when refresh fails,
 * hard logout on revoked/blocked, redirect when a password change is required.
 */
export async function api<S extends z.ZodType>(path: string, opts: RequestOptions<S>): Promise<z.infer<S>> {
  try {
    return await request(path, opts)
  } catch (e) {
    if (!(e instanceof ApiError) || opts.auth === false) throw e

    if (e.code === 'TOKEN_EXPIRED') {
      const ok = await refreshOnce()
      if (ok) return request(path, opts)
      useSessionStore.getState().lock()
      authEvents.emit('locked')
      throw e
    }
    if (e.code === 'SESSION_REVOKED' || e.code === 'ACCOUNT_BLOCKED') {
      useSessionStore.getState().logout()
      authEvents.emit('blocked')
    } else if (e.code === 'PASSWORD_CHANGE_REQUIRED') {
      authEvents.emit('passwordChangeRequired')
    }
    throw e
  }
}
