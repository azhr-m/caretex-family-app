import type { Member } from '@/api/schemas/me'
import type { MockLang } from '../http'

type L = { en: string; he: string }

const RESIDENTS: (Omit<Member['residents'][number], 'name' | 'initials' | 'ward' | 'room'> & {
  name: L
  initials: L
  ward: L
  room: L
})[] = [
  {
    id: 'res_miriam',
    name: { en: 'Miriam Levi', he: 'מרים לוי' },
    initials: { en: 'ML', he: 'מל' },
    photoUrl: null,
    ward: { en: 'Ward B', he: 'מחלקה ב׳' },
    room: { en: 'Room 12', he: 'חדר 12' },
    relation: 'daughter',
    isPrimaryContact: true,
    newItemsCount: 3,
  },
  {
    id: 'res_avraham',
    name: { en: 'Avraham Cohen', he: 'אברהם כהן' },
    initials: { en: 'AC', he: 'אכ' },
    photoUrl: null,
    ward: { en: 'Ward D', he: 'מחלקה ד׳' },
    room: { en: 'Room 4', he: 'חדר 4' },
    relation: 'daughter',
    isPrimaryContact: false,
    newItemsCount: 0,
  },
]

export const DANA_PHONE = '+972501234127'
export const DANA_USERNAME = 'dana.cohen'
export const DEMO_PASSWORD = 'Dana!2026'
export const DEMO_OTP = '481927'

/** Preferences changed with PATCH /me/preferences this session. */
export const savedPreferences: Partial<Omit<Member['preferences'], 'notifications'>> & {
  notifications?: Partial<Member['preferences']['notifications']>
} = {}

export function memberFixture(lang: MockLang, opts: { singleResident?: boolean } = {}): Member {
  const residents = (opts.singleResident ? RESIDENTS.slice(0, 1) : RESIDENTS).map((r) => ({
    ...r,
    name: r.name[lang],
    initials: r.initials[lang],
    ward: r.ward[lang],
    room: r.room[lang],
  }))
  return {
    id: 'mem_dana',
    firstName: lang === 'he' ? 'דנה' : 'Dana',
    lastName: lang === 'he' ? 'כהן' : 'Cohen',
    displayName: lang === 'he' ? 'דנה כהן' : 'Dana Cohen',
    initials: lang === 'he' ? 'דכ' : 'DC',
    phone: DANA_PHONE,
    username: DANA_USERNAME,
    lastVisitAt: '2026-10-08T18:00:00+03:00',
    residents,
    preferences: {
      language: lang,
      theme: 'system',
      ...savedPreferences,
      notifications: {
        updates: true,
        inquiries: true,
        documents: true,
        events: true,
        surveys: false,
        ...savedPreferences.notifications,
      },
      notifyPaymentsAvailable: savedPreferences.notifyPaymentsAvailable ?? false,
    },
  }
}
