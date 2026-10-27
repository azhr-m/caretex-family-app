import { z } from 'zod'
import { api } from '../client'
import {
  forgotResponseSchema,
  loginResponseSchema,
  passwordPolicySchema,
  reauthResponseSchema,
  resetPasswordResponseSchema,
  verifyOtpResponseSchema,
} from '../schemas/auth'

const empty = z.undefined()

export const login = (body: { identifier: string; password: string }) =>
  api('/auth/login', { method: 'POST', body, schema: loginResponseSchema, auth: false })

export const logout = (refreshToken: string) =>
  api('/auth/logout', { method: 'POST', body: { refreshToken }, schema: empty, auth: false })

/** Uses the current (possibly expired) access token to identify the member. */
export const reauth = (password: string) =>
  api('/auth/reauth', { method: 'POST', body: { password }, schema: reauthResponseSchema })

export const getPasswordPolicy = (signal?: AbortSignal) =>
  api('/auth/password-policy', { schema: passwordPolicySchema, auth: false, signal })

export const setFirstPassword = (newPassword: string) =>
  api('/auth/password/first', { method: 'POST', body: { newPassword }, schema: loginResponseSchema })

export const requestPasswordReset = (phone: string) =>
  api('/auth/password/forgot', { method: 'POST', body: { phone }, schema: forgotResponseSchema, auth: false })

export const resendOtp = (otpSessionId: string) =>
  api('/auth/password/forgot/resend', {
    method: 'POST',
    body: { otpSessionId },
    schema: forgotResponseSchema,
    auth: false,
  })

export const verifyOtp = (body: { otpSessionId: string; code: string }) =>
  api('/auth/password/verify-otp', { method: 'POST', body, schema: verifyOtpResponseSchema, auth: false })

export const resetPassword = (body: { resetToken: string; newPassword: string }) =>
  api('/auth/password/reset', { method: 'POST', body, schema: resetPasswordResponseSchema, auth: false })
