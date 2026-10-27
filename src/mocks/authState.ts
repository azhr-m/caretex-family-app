import { DEMO_PASSWORD } from './fixtures/member'

export const ATTEMPTS_ALLOWED = 5
export const LOCK_MINUTES = 15
export const OTP_ATTEMPTS = 3

type OtpSession = { code: string; attemptsLeft: number; expiresAt: number; phone: string }

/** Server-side auth state for the mock backend; lives until reload. */
export const authState = {
  password: DEMO_PASSWORD,
  previous: [DEMO_PASSWORD] as string[],
  failedLogins: 0,
  failedReauth: 0,
  lockedUntil: null as number | null,
  otp: new Map<string, OtpSession>(),
  resetTokens: new Set<string>(),
}

export function rememberPassword(pw: string) {
  authState.password = pw
  authState.previous = [pw, ...authState.previous].slice(0, 3)
}

export function lockAccount() {
  authState.lockedUntil = Date.now() + LOCK_MINUTES * 60_000
  authState.failedLogins = 0
  authState.failedReauth = 0
}

export const lockDetails = () => ({
  lockedUntil: new Date(authState.lockedUntil ?? Date.now()).toISOString(),
  attemptsAllowed: ATTEMPTS_ALLOWED,
  lockMinutes: LOCK_MINUTES,
})
