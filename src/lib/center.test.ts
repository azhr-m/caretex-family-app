import i18n from './i18n'
import { formatOfficeHours } from './center'

const strip = (s: string) => s.replace(/[\u2066-\u2069]/g, '')

describe('formatOfficeHours', () => {
  afterEach(() => i18n.changeLanguage('en'))

  it('localizes day ranges and isolates the time range', async () => {
    const hours = [
      { days: 'sun-thu', from: '08:00', to: '16:00' },
      { days: 'fri', from: '08:00', to: '12:00' },
    ]
    expect(strip(formatOfficeHours(hours, i18n.t))).toBe('Sun–Thu 08:00–16:00, Fri 08:00–12:00')
    expect(formatOfficeHours(hours, i18n.t)).toContain('\u206608:00–16:00\u2069')
    await i18n.changeLanguage('he')
    expect(strip(formatOfficeHours(hours, i18n.t))).toBe('א׳–ה׳ 08:00–16:00, ו׳ 08:00–12:00')
  })
})
