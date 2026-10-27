import { z } from 'zod'
import { memberSchema } from './me'

export const tokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresAt: z.string(),
  mustChangePassword: z.boolean(),
})

export const loginResponseSchema = tokensSchema.extend({ member: memberSchema })

export const reauthResponseSchema = z.object({ accessToken: z.string(), expiresAt: z.string() })

export const passwordPolicySchema = z.object({
  minLength: z.number(),
  requireUppercase: z.boolean(),
  requireDigit: z.boolean(),
  requireSpecial: z.boolean(),
  specialChars: z.string(),
  disallowPrevious: z.number(),
})

export const forgotResponseSchema = z.object({
  otpSessionId: z.string(),
  maskedPhone: z.string(),
  resendAvailableInSec: z.number(),
  expiresInSec: z.number(),
  codeLength: z.number(),
})

export const verifyOtpResponseSchema = z.object({ resetToken: z.string(), expiresInSec: z.number() })

export const resetPasswordResponseSchema = z.object({ changedAt: z.string() })

export type Tokens = z.infer<typeof tokensSchema>
export type LoginResponse = z.infer<typeof loginResponseSchema>
export type PasswordPolicy = z.infer<typeof passwordPolicySchema>
export type ForgotResponse = z.infer<typeof forgotResponseSchema>

export type LoginErrorDetails = {
  attemptsLeft?: number
  lockedUntil?: string
  attemptsAllowed?: number
  lockMinutes?: number
  reason?: 'deactivated' | 'guardian_request' | 'other'
}
