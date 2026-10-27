import { HttpResponse, http } from 'msw'
import { appNow } from '@/lib/clock'
import { calendarItem, calendarRange, confirmed, eventFixture, icsFor } from '../fixtures/calendar'
import { apiError, authed, langOf, url } from '../http'
import { guard } from './residents'

const DAY = /^\d{4}-\d{2}-\d{2}$/

export const calendarHandlers = [
  http.get(url('/residents/:rid/calendar'), ({ request, params }) => {
    const rid = String(params.rid)
    const res = guard(request, rid)
    if (res) return res
    const s = new URL(request.url).searchParams
    const from = s.get('from') ?? ''
    const to = s.get('to') ?? ''
    if (!DAY.test(from) || !DAY.test(to) || from > to) {
      return apiError(422, 'VALIDATION_FAILED', 'Invalid range', { fields: { from: 'invalid' } })
    }
    return HttpResponse.json({ items: calendarRange(rid, from, to, langOf(request)) })
  }),

  http.get(url('/calendar/items/:id'), ({ request, params }) => {
    if (!authed(request)) return apiError(401, 'TOKEN_EXPIRED', 'Access token expired')
    const item = calendarItem(String(params.id), langOf(request))
    if (!item) return apiError(404, 'NOT_FOUND', 'Calendar item not found')
    const { rid, ...detail } = item
    return (rid && guard(request, rid)) || HttpResponse.json(detail)
  }),

  http.post(url('/calendar/items/:id/confirm'), ({ request, params }) => {
    if (!authed(request)) return apiError(401, 'TOKEN_EXPIRED', 'Access token expired')
    const id = String(params.id)
    const item = calendarItem(id, 'en')
    if (!item) return apiError(404, 'NOT_FOUND', 'Calendar item not found')
    if (!item.requiresConfirmation) return apiError(422, 'VALIDATION_FAILED', 'Nothing to confirm')
    confirmed.add(id)
    return HttpResponse.json({ confirmation: 'confirmed', confirmedAt: new Date(appNow()).toISOString() })
  }),

  http.get(url('/calendar/items/:id/ics'), ({ request, params }) => {
    if (!authed(request)) return apiError(401, 'TOKEN_EXPIRED', 'Access token expired')
    const ics = icsFor(String(params.id), langOf(request))
    if (!ics) return apiError(404, 'NOT_FOUND', 'Calendar item not found')
    return new HttpResponse(ics, { headers: { 'Content-Type': 'text/calendar; charset=utf-8' } })
  }),

  http.get(url('/events/:id'), ({ request, params }) => {
    if (!authed(request)) return apiError(401, 'TOKEN_EXPIRED', 'Access token expired')
    const event = eventFixture(String(params.id), langOf(request))
    return event ? HttpResponse.json(event) : apiError(404, 'NOT_FOUND', 'Event not found')
  }),
]
