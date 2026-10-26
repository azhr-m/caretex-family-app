import { z } from 'zod'

export const ERROR_CODES = [
  'VALIDATION_FAILED',
  'INVALID_CREDENTIALS',
  'ACCOUNT_LOCKED',
  'ACCOUNT_BLOCKED',
  'TOKEN_EXPIRED',
  'SESSION_REVOKED',
  'PASSWORD_CHANGE_REQUIRED',
  'OTP_INVALID',
  'OTP_EXPIRED',
  'OTP_TOO_MANY_ATTEMPTS',
  'RATE_LIMITED',
  'PERMISSION_DENIED',
  'NOT_FOUND',
  'VERSION_CONFLICT',
  'DEADLINE_PASSED',
  'FILE_TOO_LARGE',
  'FILE_TYPE_NOT_ALLOWED',
  'SERVICE_UNAVAILABLE',
  'INTERNAL',
] as const

export type ServerErrorCode = (typeof ERROR_CODES)[number]
/** Client-side codes that never come from the server. */
export type ClientErrorCode = 'NETWORK' | 'TIMEOUT' | 'INVALID_RESPONSE'
export type ErrorCode = ServerErrorCode | ClientErrorCode

export const errorEnvelopeSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    retryable: z.boolean(),
    fields: z.record(z.string(), z.string()).optional(),
    details: z.record(z.string(), z.unknown()).optional(),
  }),
  requestId: z.string(),
})

export type ErrorEnvelope = z.infer<typeof errorEnvelopeSchema>

export class ApiError extends Error {
  readonly status: number
  readonly code: ErrorCode
  readonly retryable: boolean
  readonly fields?: Record<string, string>
  readonly details?: Record<string, unknown>
  readonly requestId?: string

  constructor(init: {
    status: number
    code: ErrorCode
    message: string
    retryable: boolean
    fields?: Record<string, string>
    details?: Record<string, unknown>
    requestId?: string
  }) {
    super(init.message)
    this.name = 'ApiError'
    this.status = init.status
    this.code = init.code
    this.retryable = init.retryable
    this.fields = init.fields
    this.details = init.details
    this.requestId = init.requestId
  }

  get isOffline() {
    return this.code === 'NETWORK'
  }
}

export function isApiError(e: unknown): e is ApiError {
  return e instanceof ApiError
}

export function toServerCode(code: string): ServerErrorCode {
  return (ERROR_CODES as readonly string[]).includes(code) ? (code as ServerErrorCode) : 'INTERNAL'
}
