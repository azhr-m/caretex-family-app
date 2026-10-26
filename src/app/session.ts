import { useQueryClient, type QueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { useCallback } from 'react'
import { refreshSession } from '@/api/client'
import { logout as logoutRequest } from '@/api/endpoints/auth'
import { isApiError } from '@/api/errors'
import { meQuery } from '@/api/queries/me'
import type { Member } from '@/api/schemas/me'
import { sessionRaw } from '@/stores/storage'
import { useAuthFlowStore } from '@/stores/authFlow'
import { useSessionStore } from '@/stores/session'
import { useSurveyDraftsStore } from '@/stores/surveyDrafts'

const LAST_ROUTE_KEY = 'caretex.lastRoute'

let booting: Promise<void> | null = null

/**
 * Restores a session from the refresh token once per page load (refresh → GET /me).
 * A rejected refresh clears the session; an offline failure keeps the refresh token for later.
 */
export function bootstrapSession(queryClient: QueryClient) {
  booting ??= (async () => {
    const s = useSessionStore.getState()
    if (s.accessToken || !s.refreshToken) return
    try {
      if (!(await refreshSession())) {
        s.logout()
        return
      }
      await queryClient.fetchQuery(meQuery())
    } catch (e) {
      if (isApiError(e) && e.code === 'NETWORK') booting = null
      else s.logout()
    }
  })()
  return booting
}

export function rememberRoute(pathname: string) {
  if (pathname.startsWith('/r/')) sessionRaw.setItem(LAST_ROUTE_KEY, pathname)
}

export type AppTarget =
  | { to: '/select-resident' }
  | { to: '/r/$rid/home'; params: { rid: string } }
  | { to: '/login/first-password' }
  | { to: '/' }

// A stored in-app path (last route / login redirect) that was already checked to belong to a
// linked resident. Typed routes can't express arbitrary paths, so it's passed as a concrete `to`.
const storedPath = (href: string) => ({ to: href.split(/[?#]/)[0] as '/' })

const ridOf = (href: string) => href.match(/^\/r\/([^/?#]+)/)?.[1]
const isLinked = (member: Member | undefined, rid: string | undefined) =>
  !!rid && !!member?.residents.some((r) => r.id === rid)

/** Where a signed-in member should land: the requested route, their only resident, or the picker. */
export function appTarget(opts: { redirect?: string; preferLast?: boolean } = {}): AppTarget {
  const { member, activeResidentId, mustChangePassword, setActiveResident } = useSessionStore.getState()
  if (mustChangePassword) return { to: '/login/first-password' }
  if (opts.redirect && isLinked(member, ridOf(opts.redirect))) return storedPath(opts.redirect)
  if (opts.preferLast) {
    const last = sessionRaw.getItem(LAST_ROUTE_KEY)
    if (last && isLinked(member, ridOf(last))) return storedPath(last)
    if (isLinked(member, activeResidentId)) return { to: '/r/$rid/home', params: { rid: activeResidentId! } }
  }
  const residents = member?.residents ?? []
  if (residents.length === 1) {
    setActiveResident(residents[0]!.id)
    return { to: '/r/$rid/home', params: { rid: residents[0]!.id } }
  }
  return { to: '/select-resident' }
}

/** Clears everything except preferences and returns to sign-in (or another public route). */
export function useLogout() {
  const router = useRouter()
  const queryClient = useQueryClient()
  return useCallback(
    async (to: '/login' | '/locked' | '/blocked' = '/login') => {
      const { refreshToken, logout } = useSessionStore.getState()
      if (refreshToken) void logoutRequest(refreshToken).catch(() => undefined)
      logout()
      sessionRaw.removeItem(LAST_ROUTE_KEY)
      useSurveyDraftsStore.getState().clear()
      useAuthFlowStore.getState().resetForgot()
      await router.navigate({ to, replace: true })
      await queryClient.cancelQueries()
      queryClient.clear()
    },
    [router, queryClient],
  )
}
