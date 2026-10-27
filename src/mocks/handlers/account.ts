import { HttpResponse, http } from 'msw'
import { serviceTypeCodeSchema } from '@/api/schemas/account'
import type { Preferences } from '@/api/schemas/me'
import { appNow } from '@/lib/clock'
import {
  advanceStaffUpdate,
  allocateServiceRef,
  canCancel,
  centerFixture,
  notificationRecords,
  serviceDetail,
  serviceRecords,
  serviceSummary,
  serviceTypesFixture,
  toNotification,
  type ServiceRecord,
} from '../fixtures/account'
import { authState, rememberPassword } from '../authState'
import { files } from '../fixtures/files'
import { memberFixture, savedPreferences } from '../fixtures/member'
import { apiError, authed, langOf, url } from '../http'
import { currentScenario } from '../scenarios'
import { policyError } from './auth'
import { guard, sectionGate } from './residents'

const PAGE_SIZE = 20
const nowIso = () => new Date(appNow()).toISOString()
const body = async <T>(request: Request) => ((await request.json().catch(() => ({}))) ?? {}) as Partial<T>
const unauth = () => apiError(401, 'TOKEN_EXPIRED', 'Access token expired')
const empty = () => currentScenario() === 'emptyEverything'
const idempotent = new Map<string, Record<string, unknown>>()

const findService = (id: string) => serviceRecords().find((s) => s.id === id)

export const accountHandlers = [
  http.get(url('/service-request-types'), ({ request }) =>
    authed(request) ? HttpResponse.json(serviceTypesFixture(langOf(request))) : unauth(),
  ),

  http.get(url('/residents/:rid/service-requests'), ({ request, params }) => {
    const rid = String(params.rid)
    const lang = langOf(request)
    const res = guard(request, rid) ?? sectionGate(rid, 'serviceRequests', lang)
    if (res) return res
    const start = Number(new URL(request.url).searchParams.get('cursor') ?? 0) || 0
    const list = (empty() ? [] : serviceRecords())
      .filter((s) => s.rid === rid)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .map((s) => serviceSummary(s, lang))
    return HttpResponse.json({
      items: list.slice(start, start + PAGE_SIZE),
      nextCursor: start + PAGE_SIZE < list.length ? String(start + PAGE_SIZE) : null,
    })
  }),

  http.get(url('/service-requests/:id'), ({ request, params }) => {
    if (!authed(request)) return unauth()
    const s = findService(String(params.id))
    if (!s) return apiError(404, 'NOT_FOUND', 'Request not found')
    return guard(request, s.rid) ?? HttpResponse.json(serviceDetail(s, langOf(request)))
  }),

  http.post(url('/residents/:rid/service-requests'), async ({ request, params }) => {
    const rid = String(params.rid)
    const res = guard(request, rid)
    if (res) return res
    const key = request.headers.get('Idempotency-Key')
    if (key && idempotent.has(key)) return HttpResponse.json(idempotent.get(key), { status: 201 })
    const b = await body<{ type: string; description: string; preferredTime: string | null; attachmentIds: string[] }>(request)
    const type = serviceTypeCodeSchema.safeParse(b.type).data
    const description = (b.description ?? '').trim()
    const fields: Record<string, string> = {}
    if (!type) fields.type = 'required'
    if (description.length < 5 || description.length > 500) fields.description = 'length'
    if ((b.attachmentIds?.length ?? 0) > 3) fields.attachmentIds = 'too_many'
    if (Object.keys(fields).length || !type) return apiError(422, 'VALIDATION_FAILED', 'Invalid request', { fields })
    const { id, ref } = allocateServiceRef()
    const at = nowIso()
    const record: ServiceRecord = {
      id,
      rid,
      ref,
      title: description.length > 48 ? `${description.slice(0, 47)}…` : description,
      type,
      status: 'opened',
      createdAt: at,
      updatedAt: at,
      scheduledAt: null,
      description,
      preferredTime: b.preferredTime ?? null,
      assignee: null,
      expected: null,
      attachments: (b.attachmentIds ?? []).flatMap((a) => files.get(a)?.attachment ?? []),
      log: [{ id: 'l1', status: 'opened', text: { en: 'Request opened by you', he: 'הבקשה נפתחה על ידכם' }, at, by: null }],
      version: 1,
    }
    serviceRecords().push(record)
    const summary = serviceSummary(record, langOf(request))
    if (key) idempotent.set(key, summary)
    return HttpResponse.json(summary, { status: 201 })
  }),

  http.post(url('/service-requests/:id/comments'), async ({ request, params }) => {
    if (!authed(request)) return unauth()
    const s = findService(String(params.id))
    if (!s) return apiError(404, 'NOT_FOUND', 'Request not found')
    const key = request.headers.get('Idempotency-Key')
    if (key && idempotent.has(key)) return HttpResponse.json(idempotent.get(key), { status: 201 })
    const { text = '' } = await body<{ text: string }>(request)
    if (text.trim().length < 1 || text.length > 500) {
      return apiError(422, 'VALIDATION_FAILED', 'Invalid comment', { fields: { text: 'length' } })
    }
    const at = nowIso()
    s.log.push({ id: `l${s.log.length + 1}`, status: 'comment', text: text.trim(), at, by: { en: 'You', he: 'אתם' } })
    s.updatedAt = at
    const out = serviceDetail(s, langOf(request)).log[0]!
    if (key) idempotent.set(key, out)
    return HttpResponse.json(out, { status: 201 })
  }),

  http.post(url('/service-requests/:id/cancel'), async ({ request, params }) => {
    if (!authed(request)) return unauth()
    const s = findService(String(params.id))
    if (!s) return apiError(404, 'NOT_FOUND', 'Request not found')
    if (!canCancel(s)) return apiError(409, 'VERSION_CONFLICT', 'The request is already in progress')
    const { reason } = await body<{ reason: string }>(request)
    const at = nowIso()
    s.status = 'cancelled'
    s.updatedAt = at
    s.version += 1
    s.log.push({
      id: `l${s.log.length + 1}`,
      status: 'cancelled',
      text: reason?.trim() ? reason.trim() : { en: 'Cancelled by you', he: 'בוטלה על ידכם' },
      at,
      by: null,
    })
    return HttpResponse.json({ status: 'cancelled' })
  }),

  http.get(url('/center'), ({ request }) => (authed(request) ? HttpResponse.json(centerFixture(langOf(request))) : unauth())),

  http.get(url('/notifications'), ({ request }) => {
    if (!authed(request)) return unauth()
    const lang = langOf(request)
    const start = Number(new URL(request.url).searchParams.get('cursor') ?? 0) || 0
    const all = empty() ? [] : [...notificationRecords()].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    return HttpResponse.json({
      items: all.slice(start, start + PAGE_SIZE).map((r) => toNotification(r, lang)),
      nextCursor: start + PAGE_SIZE < all.length ? String(start + PAGE_SIZE) : null,
      unreadCount: all.filter((r) => !r.readAt).length,
    })
  }),

  http.post(url('/notifications/read-all'), ({ request }) => {
    if (!authed(request)) return unauth()
    const at = nowIso()
    for (const r of notificationRecords()) r.readAt ??= at
    return HttpResponse.json({ unreadCount: 0 })
  }),

  http.get(url('/notifications/:id'), ({ request, params }) => {
    if (!authed(request)) return unauth()
    const r = notificationRecords().find((x) => x.id === String(params.id))
    return r ? HttpResponse.json(toNotification(r, langOf(request))) : apiError(404, 'NOT_FOUND', 'Notification not found')
  }),

  http.post(url('/notifications/:id/read'), ({ request, params }) => {
    if (!authed(request)) return unauth()
    const r = notificationRecords().find((x) => x.id === String(params.id))
    if (!r) return apiError(404, 'NOT_FOUND', 'Notification not found')
    r.readAt ??= nowIso()
    return new HttpResponse(null, { status: 204 })
  }),

  http.patch(url('/me/preferences'), async ({ request }) => {
    if (!authed(request)) return unauth()
    const patch = await body<Preferences>(request)
    const { notifications, ...rest } = patch
    Object.assign(savedPreferences, rest)
    if (notifications) savedPreferences.notifications = { ...savedPreferences.notifications, ...notifications }
    return HttpResponse.json(memberFixture(langOf(request)).preferences)
  }),

  http.put(url('/me/password'), async ({ request }) => {
    if (!authed(request)) return unauth()
    const { currentPassword = '', newPassword = '' } = await body<{ currentPassword: string; newPassword: string }>(request)
    if (currentPassword !== authState.password) {
      return apiError(401, 'INVALID_CREDENTIALS', 'Current password is incorrect', { fields: { currentPassword: 'invalid' } })
    }
    const err = policyError(newPassword)
    if (err) return err
    rememberPassword(newPassword)
    return new HttpResponse(null, { status: 204 })
  }),

  http.get(url('/residents/:rid/billing'), ({ request, params }) => {
    const rid = String(params.rid)
    return guard(request, rid) ?? HttpResponse.json({ state: 'coming_soon' })
  }),

  http.post(url('/me/devices'), ({ request }) => (authed(request) ? new HttpResponse(null, { status: 204 }) : unauth())),

  http.post(url('/dev/service-update'), () => HttpResponse.json({ changed: advanceStaffUpdate(nowIso()) })),
]
