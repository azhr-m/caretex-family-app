import { describe, expect, it } from 'vitest'
import { inquiriesPageSchema } from '@/api/schemas/inquiries'
import { addMonths, monthGrid, startOfWeek, weekdayIndex } from './format'
import { INQUIRY_STEPS, stepIndex } from './inquiry'

describe('phase 3 helpers', () => {
  it('builds Sunday-first month grids of whole weeks', () => {
    const oct = monthGrid('2026-10-14')
    expect(oct[0]).toBe('2026-09-27')
    expect(oct.at(-1)).toBe('2026-10-31')
    expect(oct).toHaveLength(35)
    expect(weekdayIndex(oct[0]!)).toBe(0)
    const nov = monthGrid('2026-11-05')
    expect(nov[0]).toBe('2026-11-01')
    expect(nov).toHaveLength(35)
    expect(monthGrid('2026-08-01')).toHaveLength(42)
  })

  it('finds week starts and steps months across years', () => {
    expect(startOfWeek('2026-10-14')).toBe('2026-10-11')
    expect(startOfWeek('2026-10-11')).toBe('2026-10-11')
    expect(addMonths('2026-12-10', 1)).toBe('2027-01-01')
    expect(addMonths('2026-01-31', -1)).toBe('2025-12-01')
  })

  it('maps inquiry status to the stepper (closed = all done)', () => {
    expect(stepIndex('new')).toBe(0)
    expect(stepIndex('waiting_for_family')).toBe(3)
    expect(stepIndex('closed')).toBe(INQUIRY_STEPS.length)
  })

  it('accepts the list page with counts per status', () => {
    const page = inquiriesPageSchema.parse({
      items: [],
      nextCursor: null,
      counts: { all: 0, new: 0, read: 0, in_progress: 0, waiting_for_family: 0, handled: 0, closed: 0 },
    })
    expect(page.counts.all).toBe(0)
  })
})
