import { HttpResponse, http } from 'msw'
import type { PermissionKey } from '@/api/schemas/resident'
import { PREVIOUS_VISIT, dashboardFixture } from '../fixtures/dashboard'
import { memberFixture } from '../fixtures/member'
import { photoSvg } from '../fixtures/photos'
import {
  carePlanFixture,
  medicalFixture,
  permissionsFixture,
  residentFixture,
  scheduleFixture,
} from '../fixtures/resident'
import { findUpdate, seenUpdates, toSummary, updatesFor } from '../fixtures/updates'
import { apiError, authed, langOf, url, type MockLang } from '../http'
import { currentScenario } from '../scenarios'
import { mockToday } from '../time'

const PAGE_SIZE = 20

const empty = () => currentScenario() === 'emptyEverything'

/** Checks the token and that the resident is linked to the member; returns an error response if not. */
function guard(request: Request, rid: string) {
  if (!authed(request)) return apiError(401, 'TOKEN_EXPIRED', 'Access token expired')
  const linked = memberFixture('en', { singleResident: currentScenario() === 'singleResident' }).residents
  if (!linked.some((r) => r.id === rid)) return apiError(403, 'PERMISSION_DENIED', 'Resident not linked')
  return null
}

/** `denied` → 403, `not_shared` → 200 `{ state: "not_shared" }`, `hidden` → 404, else null. */
function sectionGate(rid: string, key: PermissionKey, lang: MockLang) {
  const value = permissionsFixture(rid, lang)[key]
  if (value === 'denied') return apiError(403, 'PERMISSION_DENIED', 'You do not have permission to view this')
  if (value === 'not_shared') return HttpResponse.json({ state: 'not_shared' })
  if (value === 'hidden') return apiError(404, 'NOT_FOUND', 'Not found')
  return null
}

export const residentHandlers = [
  http.get(url('/residents/:rid'), ({ request, params }) => {
    const rid = String(params.rid)
    const lang = langOf(request)
    const res = guard(request, rid) ?? sectionGate(rid, 'general', lang)
    if (res) return res
    const resident = residentFixture(rid, lang)
    return resident ? HttpResponse.json(resident) : apiError(404, 'NOT_FOUND', 'Not found')
  }),

  http.get(url('/residents/:rid/permissions'), ({ request, params }) => {
    const rid = String(params.rid)
    return guard(request, rid) ?? HttpResponse.json(permissionsFixture(rid, langOf(request)))
  }),

  http.get(url('/residents/:rid/dashboard'), ({ request, params }) => {
    const rid = String(params.rid)
    return guard(request, rid) ?? HttpResponse.json(dashboardFixture(rid, langOf(request), empty()))
  }),

  http.post(url('/me/visits'), async ({ request }) => {
    if (!authed(request)) return apiError(401, 'TOKEN_EXPIRED', 'Access token expired')
    const { residentId = '' } = ((await request.json().catch(() => ({}))) ?? {}) as { residentId?: string }
    return HttpResponse.json({ previousVisitAt: PREVIOUS_VISIT[residentId] ?? null })
  }),

  http.get(url('/residents/:rid/updates'), ({ request, params }) => {
    const rid = String(params.rid)
    const lang = langOf(request)
    const res = guard(request, rid) ?? sectionGate(rid, 'updates', lang)
    if (res) return res
    const search = new URL(request.url).searchParams
    const limit = Math.min(Number(search.get('limit')) || PAGE_SIZE, 50)
    const start = Number(search.get('cursor') ?? 0) || 0
    const all = empty() ? [] : updatesFor(rid, lang)
    const items = all.slice(start, start + limit).map(toSummary)
    const next = start + limit < all.length ? String(start + limit) : null
    return HttpResponse.json({ items, nextCursor: next })
  }),

  http.get(url('/updates/:id'), ({ request, params }) => {
    if (!authed(request)) return apiError(401, 'TOKEN_EXPIRED', 'Access token expired')
    const found = findUpdate(String(params.id), langOf(request))
    if (!found) return apiError(404, 'NOT_FOUND', 'Update not found')
    return guard(request, found.rid) ?? HttpResponse.json(found.update)
  }),

  http.post(url('/updates/:id/seen'), ({ request, params }) => {
    if (!authed(request)) return apiError(401, 'TOKEN_EXPIRED', 'Access token expired')
    seenUpdates.add(String(params.id))
    return new HttpResponse(null, { status: 204 })
  }),

  http.get(url('/residents/:rid/medical'), ({ request, params }) => {
    const rid = String(params.rid)
    const lang = langOf(request)
    return (
      guard(request, rid) ??
      sectionGate(rid, 'medical', lang) ??
      HttpResponse.json(medicalFixture(rid, lang, empty()))
    )
  }),

  http.get(url('/residents/:rid/care-plan'), ({ request, params }) => {
    const rid = String(params.rid)
    const lang = langOf(request)
    return guard(request, rid) ?? sectionGate(rid, 'carePlan', lang) ?? HttpResponse.json(carePlanFixture(lang))
  }),

  http.get(url('/residents/:rid/schedule'), ({ request, params }) => {
    const rid = String(params.rid)
    const lang = langOf(request)
    const res = guard(request, rid) ?? sectionGate(rid, 'schedule', lang)
    if (res) return res
    const date = new URL(request.url).searchParams.get('date') ?? mockToday()
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return apiError(422, 'VALIDATION_FAILED', 'Invalid date', { fields: { date: 'invalid' } })
    }
    const schedule = scheduleFixture(rid, date, mockToday(), lang)
    return HttpResponse.json(empty() ? { ...schedule, items: [] } : schedule)
  }),

  http.get(url('/media/photos/:id'), ({ request, params }) => {
    const thumb = new URL(request.url).searchParams.get('size') === 'thumb'
    return new HttpResponse(photoSvg(String(params.id), thumb), {
      headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'private, max-age=3600' },
    })
  }),
]
