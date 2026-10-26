import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { sessionJSON } from './storage'

export type LockInfo = { lockedUntil: string; attemptsAllowed: number; lockMinutes: number }

export type OtpSession = {
  otpSessionId: string
  maskedPhone: string
  codeLength: number
  resendAvailableAt: number
  expiresAt: number
}

type AuthFlowState = {
  lock: LockInfo | null
  otp: OtpSession | null
  resetToken: string | null
  changedAt: string | null
  /** Shown on the phone step after OTP_TOO_MANY_ATTEMPTS sends the user back. */
  forgotNotice: 'tooManyAttempts' | null
  setLock: (lock: LockInfo | null) => void
  setOtp: (otp: OtpSession | null) => void
  setResetToken: (token: string | null) => void
  setChangedAt: (changedAt: string | null) => void
  setForgotNotice: (notice: AuthFlowState['forgotNotice']) => void
  resetForgot: () => void
}

/** Transient state for sign-in side flows. Only lock info survives a reload (per tab); tokens stay in memory. */
export const useAuthFlowStore = create<AuthFlowState>()(
  persist(
    (set) => ({
      lock: null,
      otp: null,
      resetToken: null,
      changedAt: null,
      forgotNotice: null,
      setLock: (lock) => set({ lock }),
      setOtp: (otp) => set({ otp }),
      setResetToken: (resetToken) => set({ resetToken }),
      setChangedAt: (changedAt) => set({ changedAt }),
      setForgotNotice: (forgotNotice) => set({ forgotNotice }),
      resetForgot: () => set({ otp: null, resetToken: null, changedAt: null, forgotNotice: null }),
    }),
    { name: 'caretex.authFlow', storage: sessionJSON, partialize: ({ lock }) => ({ lock }) },
  ),
)
