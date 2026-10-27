import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { LoginResponse, Tokens } from '@/api/schemas/auth'
import type { Member } from '@/api/schemas/me'
import { localJSON, sessionRaw } from './storage'

const REFRESH_KEY = 'caretex.rt'

type SessionState = {
  accessToken?: string
  refreshToken?: string
  expiresAt?: string
  member?: Member
  activeResidentId?: string
  locked: boolean
  lastActivityAt: number
  mustChangePassword: boolean
  login: (res: LoginResponse) => void
  setTokens: (tokens: Partial<Tokens> & { accessToken: string; expiresAt: string }) => void
  setMember: (member: Member) => void
  logout: () => void
  lock: () => void
  unlock: (accessToken: string, expiresAt: string) => void
  setActiveResident: (id: string) => void
  touch: () => void
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      refreshToken: sessionRaw.getItem(REFRESH_KEY) ?? undefined,
      locked: false,
      lastActivityAt: Date.now(),
      mustChangePassword: false,
      login: (res) => {
        sessionRaw.setItem(REFRESH_KEY, res.refreshToken)
        set({
          accessToken: res.accessToken,
          refreshToken: res.refreshToken,
          expiresAt: res.expiresAt,
          mustChangePassword: res.mustChangePassword,
          member: res.member,
          locked: false,
          lastActivityAt: Date.now(),
        })
      },
      setTokens: (t) => {
        if (t.refreshToken) sessionRaw.setItem(REFRESH_KEY, t.refreshToken)
        set((s) => ({
          accessToken: t.accessToken,
          expiresAt: t.expiresAt,
          refreshToken: t.refreshToken ?? s.refreshToken,
          mustChangePassword: t.mustChangePassword ?? s.mustChangePassword,
        }))
      },
      setMember: (member) => set({ member }),
      logout: () => {
        sessionRaw.removeItem(REFRESH_KEY)
        set({
          accessToken: undefined,
          refreshToken: undefined,
          expiresAt: undefined,
          member: undefined,
          activeResidentId: undefined,
          locked: false,
          mustChangePassword: false,
        })
      },
      lock: () => set((s) => (s.accessToken || s.refreshToken ? { locked: true } : s)),
      unlock: (accessToken, expiresAt) =>
        set({ accessToken, expiresAt, locked: false, lastActivityAt: Date.now() }),
      setActiveResident: (activeResidentId) => set({ activeResidentId }),
      touch: () => set({ lastActivityAt: Date.now() }),
    }),
    {
      name: 'caretex.session',
      storage: localJSON,
      partialize: ({ activeResidentId }) => ({ activeResidentId }),
    },
  ),
)

export const isAuthenticated = () => !!useSessionStore.getState().accessToken
