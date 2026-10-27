import { appNow } from '@/lib/clock'
import { addDays, isoDay } from '@/lib/format'

/** "+03:00" / "+02:00" for that calendar day in Asia/Jerusalem. */
function israelOffset(day: string) {
  const noonUtc = new Date(`${day}T12:00:00Z`)
  const hour = Number(
    new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Jerusalem', hour: '2-digit', hourCycle: 'h23' }).format(
      noonUtc,
    ),
  )
  const diff = hour - 12
  return `+${String(diff).padStart(2, '0')}:00`
}

/** ISO instant for a wall-clock time on a day in Israel: at('2026-10-14', '09:41'). */
export const at = (day: string, hhmm: string) => `${day}T${hhmm}:00${israelOffset(day)}`

export const mockToday = () => isoDay(appNow())

export const mockDay = (deltaDays: number) => addDays(mockToday(), deltaDays)
