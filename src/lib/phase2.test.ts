import { describe, expect, it } from 'vitest'
import { dashboardSchema } from '@/api/schemas/dashboard'
import { firstPermittedSegment } from '@/features/resident/segments'
import { deepLinkTarget } from './deepLink'
import { addDays, relativeDay, relativeGreeting } from './format'
import { firstName } from './names'

const at = (hhmm: string) => new Date(`2026-10-14T${hhmm}:00+03:00`)

describe('phase 2 helpers', () => {
  it('greets by Israel time: morning 05–12, afternoon 12–17, evening 17–22, night', () => {
    expect(relativeGreeting(at('04:59'))).toBe('night')
    expect(relativeGreeting(at('05:00'))).toBe('morning')
    expect(relativeGreeting(at('12:00'))).toBe('afternoon')
    expect(relativeGreeting(at('17:00'))).toBe('evening')
    expect(relativeGreeting(at('22:00'))).toBe('night')
  })

  it('does calendar arithmetic and relative day names', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
    const now = at('09:41')
    expect(relativeDay('2026-10-13', now)).toBe('yesterday')
    expect(relativeDay('2026-10-14', now)).toBe('today')
    expect(relativeDay('2026-10-15', now)).toBe('tomorrow')
    expect(relativeDay('2026-10-16', now)).toBeNull()
  })

  it('maps deep links to routes, preferring the link resident', () => {
    expect(deepLinkTarget({ type: 'document', id: 'doc_flu', residentId: null }, 'res_a')).toMatchObject({
      to: '/r/$rid/more/documents/$docId',
      params: { rid: 'res_a', docId: 'doc_flu' },
    })
    expect(deepLinkTarget({ type: 'update', id: 'u1', residentId: 'res_b' }, 'res_a').params).toMatchObject({
      rid: 'res_b',
    })
    expect(deepLinkTarget({ type: 'resident_section', id: 'nope', residentId: null }, 'r').to).toBe(
      '/r/$rid/resident/general',
    )
  })

  it('validates dashboard sections independently', () => {
    const parsed = dashboardSchema.parse({
      greetingName: 'Dana',
      sinceLastVisit: { since: null, items: [] },
      attention: [{ broken: true }],
      latestUpdate: null,
      upcoming: null,
      dayPreview: [],
      counts: {
        notificationsUnread: 0,
        tabs: { resident: 0, staff: 0, calendar: 0, more: 0 },
        documentsPending: 0,
        invitationsPending: 0,
      },
    })
    expect(parsed.sinceLastVisit.ok).toBe(true)
    expect(parsed.attention.ok).toBe(false)
    expect(parsed.latestUpdate).toEqual({ ok: true, data: null })
  })

  it('opens the first permitted segment', () => {
    const base = {
      general: 'allowed', updates: 'allowed', medical: 'allowed', carePlan: 'allowed', schedule: 'allowed',
      documents: 'allowed', inquiries: 'allowed', serviceRequests: 'allowed', billing: 'allowed',
      notes: {}, updatedAt: '',
    } as const
    expect(firstPermittedSegment(undefined)).toBe('general')
    expect(firstPermittedSegment({ ...base, general: 'hidden', updates: 'denied' })).toBe('medical')
    expect(firstName('Miriam Levi')).toBe('Miriam')
  })
})
