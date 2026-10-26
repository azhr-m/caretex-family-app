import {
  age,
  date,
  dateTime,
  dayGroupLabel,
  fileSize,
  formatPhone,
  isoDay,
  relativeGreeting,
  time,
  count,
} from './format'

const at = '2026-10-14T09:41:00+03:00'

describe('format', () => {
  it('formats dates and times in Asia/Jerusalem', () => {
    expect(date(at)).toBe('14.10.2026')
    expect(time(at)).toBe('09:41')
    expect(dateTime(at)).toBe('14.10.2026 09:41')
    expect(time('2026-10-14T21:30:00Z')).toBe('00:30')
    expect(isoDay('2026-10-14T21:30:00Z')).toBe('2026-10-15')
  })

  it('labels day groups', () => {
    const labels = { today: 'TODAY', yesterday: 'YESTERDAY' }
    expect(dayGroupLabel(at, labels, at)).toBe('TODAY · 14.10.2026')
    expect(dayGroupLabel('2026-10-13T16:00:00+03:00', labels, at)).toBe('YESTERDAY · 13.10.2026')
    expect(dayGroupLabel('2026-10-01T16:00:00+03:00', labels, at)).toBe('01.10.2026')
  })

  it('formats sizes, phones, counts, ages, greetings', () => {
    expect(fileSize(320000)).toBe('320 KB')
    expect(fileSize(2_400_000)).toBe('2.4 MB')
    expect(formatPhone('+97235550100')).toBe('03-555-0100')
    expect(formatPhone('+972501234567')).toBe('050-123-4567')
    expect(count(120)).toBe('99+')
    expect(age('1940-10-15', at)).toBe(85)
    expect(age('1940-10-14', at)).toBe(86)
    expect(relativeGreeting(at)).toBe('morning')
  })
})
