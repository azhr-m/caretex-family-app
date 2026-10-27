import type { CenterPublic } from '@/api/schemas/center'
import type { MockLang } from '../http'

export function centerPublicFixture(lang: MockLang): CenterPublic {
  return {
    name: lang === 'he' ? 'מרכז סיעודי בית הדר' : 'Beit Hadar Care Center',
    familyOfficeName: lang === 'he' ? 'מחלקת קשרי משפחות' : 'Family relations office',
    phone: '+97235550100',
    email: 'family@beithadar.co.il',
    address: lang === 'he' ? 'רחוב הרימון 12, רמת גן' : '12 HaRimon St., Ramat Gan',
    officeHours: [{ days: 'sun-thu', from: '08:00', to: '16:00' }],
  }
}
