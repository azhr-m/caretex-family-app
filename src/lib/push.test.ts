import { describe, expect, it } from 'vitest'
import { notificationKindSchema } from '@/api/schemas/account'
import { PUSH_BODIES, buildPushPayload } from './push'

describe('push payload', () => {
  it('always uses a fixed generic body for every kind and language', () => {
    const allowed = new Set([...Object.values(PUSH_BODIES.en), ...Object.values(PUSH_BODIES.he)])
    for (const kind of notificationKindSchema.options) {
      for (const lang of ['en', 'he'] as const) {
        const p = buildPushPayload('n_1', kind, lang)
        expect(p.title).toBe('CARETEX Family')
        expect(p.tag).toBe('caretex')
        expect(p.data).toEqual({ notificationId: 'n_1' })
        expect(allowed.has(p.body)).toBe(true)
      }
    }
  })

  it('maps kinds to the contract set (message / document / event / update / request)', () => {
    expect(buildPushPayload('n', 'inquiry_reply', 'en').body).toBe('You have a new message')
    expect(buildPushPayload('n', 'document', 'en').body).toBe('You have a new document waiting')
    expect(buildPushPayload('n', 'service_request', 'he').body).toBe('יש עדכון בבקשה שלכם')
  })
})
