import { api, API_BASE } from '../client'
import { ApiError } from '../errors'
import { calendarItemDetailSchema, calendarRangeSchema, confirmResultSchema, eventSchema } from '../schemas/calendar'
import { useSessionStore } from '@/stores/session'

export const getCalendar = (rid: string, from: string, to: string, signal?: AbortSignal) =>
  api(`/residents/${encodeURIComponent(rid)}/calendar?from=${from}&to=${to}`, { schema: calendarRangeSchema, signal })

export const getCalendarItem = (id: string, signal?: AbortSignal) =>
  api(`/calendar/items/${encodeURIComponent(id)}`, { schema: calendarItemDetailSchema, signal })

export const confirmCalendarItem = (id: string, idempotencyKey: string) =>
  api(`/calendar/items/${encodeURIComponent(id)}/confirm`, {
    method: 'POST',
    schema: confirmResultSchema,
    idempotencyKey,
  })

export const getEvent = (id: string, signal?: AbortSignal) =>
  api(`/events/${encodeURIComponent(id)}`, { schema: eventSchema, signal })

/** Fetches the .ics with the session token and hands it to the browser as a download. */
export async function downloadIcs(id: string, filename: string) {
  const token = useSessionStore.getState().accessToken
  const res = await fetch(`${API_BASE}/calendar/items/${encodeURIComponent(id)}/ics`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  }).catch(() => null)
  if (!res?.ok) {
    throw new ApiError({
      status: res?.status ?? 0,
      code: res ? 'INTERNAL' : 'NETWORK',
      message: 'Download failed',
      retryable: true,
      requestId: '',
    })
  }
  const url = URL.createObjectURL(await res.blob())
  const a = Object.assign(document.createElement('a'), { href: url, download: filename })
  document.body.append(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
