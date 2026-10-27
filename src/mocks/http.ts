import { HttpResponse } from 'msw'
import { API_BASE } from '@/api/client'
import type { ServerErrorCode } from '@/api/errors'

export const url = (path: string) => `${API_BASE}${path}`

export type MockLang = 'en' | 'he'

export function langOf(request: Request): MockLang {
  return request.headers.get('Accept-Language')?.startsWith('he') ? 'he' : 'en'
}

export const authed = (request: Request) => request.headers.get('Authorization')?.startsWith('Bearer ') ?? false

/** Pick the localized variant of a fixture string pair. */
export const pick = <T>(lang: MockLang, pair: { en: T; he: T }) => pair[lang]

export function apiError(
  status: number,
  code: ServerErrorCode,
  message: string,
  opts: { retryable?: boolean; fields?: Record<string, string>; details?: Record<string, unknown> } = {},
) {
  return HttpResponse.json(
    {
      error: {
        code,
        message,
        retryable: opts.retryable ?? false,
        fields: opts.fields,
        details: opts.details,
      },
      requestId: `req_${crypto.randomUUID().slice(0, 8)}`,
    },
    { status },
  )
}
