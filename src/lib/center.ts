import type { TFunction } from 'i18next'
import type { OfficeHours } from '@/api/schemas/center'
import { bidiIsolate } from './format'

/** [{ days: 'sun-thu', from: '08:00', to: '16:00' }] → "Sun–Thu 08:00–16:00" (localized day names). */
export function formatOfficeHours(hours: OfficeHours[], t: TFunction) {
  return hours
    .map(({ days, from, to }) => {
      const label = days
        .split('-')
        .map((d) => t(`center:days.${d}`))
        .join('–')
      return t('center:hours', { days: label, range: bidiIsolate(`${from}–${to}`) })
    })
    .join(', ')
}
