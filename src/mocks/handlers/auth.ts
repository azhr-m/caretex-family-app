import { HttpResponse, http } from 'msw'
import { DEFAULT_PASSWORD_POLICY } from '@/api/queries/auth'
import { meetsPolicy } from '@/lib/validation'
import {
  ATTEMPTS_ALLOWED,
  OTP_ATTEMPTS,
  authState,
  lockAccount,
  lockDetails,
  rememberPassword,
} from '../authState'
import { DANA_PHONE, DANA_USERNAME, DEMO_OTP, memberFixture } from '../fixtures/member'
import { apiError, langOf, url } from '../http'
import { currentScenario } from '../scenarios'

const inOneHour = () => new Date(Date.now() + 60 * 60_000).toISOString()
const token = (p: string) => `${p}_${crypto.randomUUID()}`
const body = async <T>(request: Request) => ((await request.json().catch(() => ({}))) ?? {}) as Partial<T>

function maskPhone(e164: string) {
  const local = `0${e164.replace(/^\+972/, '')}`
  return `${local.slice(0, 3)}-***-${local.slice(-4)}`
}

function loginOk(request: Request, mustChangePassword: boolean) {
  const scenario = currentScenario()
  return HttpResponse.json({
    accessToken: token('at'),
    refreshToken: token('rt'),
    expiresAt: inOneHour(),
    mustChangePassword,
    member: memberFixture(langOf(request), { singleResident: scenario === 'singleResident' }),
  })
}

function policyError(pw: string) {
  if (!meetsPolicy(DEFAULT_PASSWORD_POLICY, pw)) {
    return apiError(422, 'VALIDATION_FAILED', 'Password does not meet the policy', {
      fields: { newPassword: 'policy' },
    })
  }
  if (authState.previous.includes(pw)) {
    return apiError(422, 'VALIDATION_FAILED', 'Password was used recently', {
      fields: { newPassword: 'reused' },
    })
  }
  return null
}

export const authHandlers = [
  http.post(url('/auth/login'), async ({ request }) => {
    const { identifier = '', password = '' } = await body<{ identifier: string; password: string }>(request)
    const scenario = currentScenario()

    if (scenario === 'blocked')
      return apiError(403, 'ACCOUNT_BLOCKED', 'Account blocked', { details: { reason: 'deactivated' } })
    if (scenario === 'locked' && !authState.lockedUntil) lockAccount()
    if (authState.lockedUntil && authState.lockedUntil > Date.now()) {
      return apiError(423, 'ACCOUNT_LOCKED', 'Account locked', { details: lockDetails() })
    }
    authState.lockedUntil = null

    if (scenario === 'wrongPassword') {
      return apiError(401, 'INVALID_CREDENTIALS', 'Invalid credentials', { details: { attemptsLeft: 2 } })
    }

    const known = identifier === DANA_PHONE || identifier.toLowerCase() === DANA_USERNAME
    if (!known || password !== authState.password) {
      authState.failedLogins += 1
      if (authState.failedLogins >= ATTEMPTS_ALLOWED) {
        lockAccount()
        return apiError(423, 'ACCOUNT_LOCKED', 'Account locked', { details: lockDetails() })
      }
      return apiError(401, 'INVALID_CREDENTIALS', 'Invalid credentials', {
        details: { attemptsLeft: ATTEMPTS_ALLOWED - authState.failedLogins },
      })
    }

    authState.failedLogins = 0
    return loginOk(request, scenario === 'firstLogin')
  }),

  http.post(url('/auth/refresh'), async ({ request }) => {
    const { refreshToken } = await body<{ refreshToken: string }>(request)
    if (!refreshToken) return apiError(401, 'SESSION_REVOKED', 'Session expired')
    return HttpResponse.json({
      accessToken: token('at'),
      refreshToken,
      expiresAt: inOneHour(),
      mustChangePassword: false,
    })
  }),

  http.post(url('/auth/logout'), () => new HttpResponse(null, { status: 204 })),

  http.post(url('/auth/reauth'), async ({ request }) => {
    const { password } = await body<{ password: string }>(request)
    if (password === authState.password) {
      authState.failedReauth = 0
      return HttpResponse.json({ accessToken: token('at'), expiresAt: inOneHour() })
    }
    authState.failedReauth += 1
    if (authState.failedReauth >= ATTEMPTS_ALLOWED) {
      lockAccount()
      return apiError(423, 'ACCOUNT_LOCKED', 'Account locked', { details: lockDetails() })
    }
    return apiError(401, 'INVALID_CREDENTIALS', 'Invalid credentials', {
      details: { attemptsLeft: ATTEMPTS_ALLOWED - authState.failedReauth },
    })
  }),

  http.get(url('/auth/password-policy'), () => HttpResponse.json(DEFAULT_PASSWORD_POLICY)),

  http.post(url('/auth/password/first'), async ({ request }) => {
    const { newPassword = '' } = await body<{ newPassword: string }>(request)
    const err = policyError(newPassword)
    if (err) return err
    rememberPassword(newPassword)
    return loginOk(request, false)
  }),

  http.post(url('/auth/password/forgot'), async ({ request }) => {
    const { phone = '' } = await body<{ phone: string }>(request)
    const otpSessionId = token('otp')
    // Same response for unknown numbers (no account enumeration); only Dana's number gets a usable code.
    authState.otp.set(otpSessionId, {
      code: phone === DANA_PHONE ? DEMO_OTP : '',
      attemptsLeft: OTP_ATTEMPTS,
      expiresAt: Date.now() + 600_000,
      phone,
    })
    return HttpResponse.json({
      otpSessionId,
      maskedPhone: maskPhone(phone),
      resendAvailableInSec: 60,
      expiresInSec: 600,
      codeLength: 6,
    })
  }),

  http.post(url('/auth/password/forgot/resend'), async ({ request }) => {
    const { otpSessionId = '' } = await body<{ otpSessionId: string }>(request)
    const s = authState.otp.get(otpSessionId)
    if (!s) return apiError(400, 'OTP_EXPIRED', 'Code expired')
    s.attemptsLeft = OTP_ATTEMPTS
    s.expiresAt = Date.now() + 600_000
    return HttpResponse.json({
      otpSessionId,
      maskedPhone: maskPhone(s.phone),
      resendAvailableInSec: 60,
      expiresInSec: 600,
      codeLength: 6,
    })
  }),

  http.post(url('/auth/password/verify-otp'), async ({ request }) => {
    const { otpSessionId = '', code = '' } = await body<{ otpSessionId: string; code: string }>(request)
    const s = authState.otp.get(otpSessionId)
    if (!s || s.expiresAt < Date.now()) return apiError(400, 'OTP_EXPIRED', 'Code expired')
    if (s.attemptsLeft <= 0) return apiError(400, 'OTP_TOO_MANY_ATTEMPTS', 'Too many attempts')
    if (!s.code || code !== s.code) {
      s.attemptsLeft -= 1
      if (s.attemptsLeft <= 0) {
        authState.otp.delete(otpSessionId)
        return apiError(400, 'OTP_TOO_MANY_ATTEMPTS', 'Too many attempts')
      }
      return apiError(400, 'OTP_INVALID', 'Invalid code', { details: { attemptsLeft: s.attemptsLeft } })
    }
    authState.otp.delete(otpSessionId)
    const resetToken = token('reset')
    authState.resetTokens.add(resetToken)
    return HttpResponse.json({ resetToken, expiresInSec: 900 })
  }),

  http.post(url('/auth/password/reset'), async ({ request }) => {
    const { resetToken = '', newPassword = '' } = await body<{ resetToken: string; newPassword: string }>(
      request,
    )
    if (!authState.resetTokens.has(resetToken)) return apiError(400, 'OTP_EXPIRED', 'Reset session expired')
    const err = policyError(newPassword)
    if (err) return err
    authState.resetTokens.delete(resetToken)
    rememberPassword(newPassword)
    authState.lockedUntil = null
    authState.failedLogins = 0
    return HttpResponse.json({ changedAt: new Date().toISOString() })
  }),
]
