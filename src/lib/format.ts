import { appDate } from './clock'

export const TIME_ZONE = 'Asia/Jerusalem'
type Lang = 'en' | 'he'
type DateInput = Date | string | number

const locale = (lang: Lang) => (lang === 'he' ? 'he-IL' : 'en-GB')
const toDate = (d: DateInput) => (d instanceof Date ? d : new Date(d))

function parts(d: DateInput) {
  const p = new Intl.DateTimeFormat('en-GB', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(toDate(d))
  const get = (type: Intl.DateTimeFormatPartTypes) => p.find((x) => x.type === type)?.value ?? ''
  return { year: get('year'), month: get('month'), day: get('day'), hour: get('hour'), minute: get('minute') }
}

export function date(d: DateInput) {
  const { day, month, year } = parts(d)
  return `${day}.${month}.${year}`
}

export function time(d: DateInput) {
  const { hour, minute } = parts(d)
  return `${hour}:${minute}`
}

export function dateTime(d: DateInput) {
  return `${date(d)} ${time(d)}`
}

/** YYYY-MM-DD of the given instant in Asia/Jerusalem. */
export function isoDay(d: DateInput) {
  const { day, month, year } = parts(d)
  return `${year}-${month}-${day}`
}

export function weekday(d: DateInput, lang: Lang, style: 'long' | 'short' | 'narrow' = 'long') {
  return new Intl.DateTimeFormat(locale(lang), { timeZone: TIME_ZONE, weekday: style }).format(toDate(d))
}

export function monthYear(d: DateInput, lang: Lang) {
  return new Intl.DateTimeFormat(locale(lang), {
    timeZone: TIME_ZONE,
    month: 'long',
    year: 'numeric',
  }).format(toDate(d))
}

export type DayGroupLabels = { today: string; yesterday: string }

export function dayGroupLabel(d: DateInput, labels: DayGroupLabels, now: DateInput = appDate()) {
  const day = isoDay(d)
  const today = isoDay(now)
  const yesterday = isoDay(toDate(now).getTime() - 86_400_000)
  const prefix = day === today ? labels.today : day === yesterday ? labels.yesterday : null
  return prefix ? `${prefix} · ${date(d)}` : date(d)
}

export function fileSize(bytes: number) {
  if (bytes < 1000) return `${bytes} B`
  if (bytes < 1_000_000) return `${Math.round(bytes / 1000)} KB`
  return `${(bytes / 1_000_000).toFixed(1).replace(/\.0$/, '')} MB`
}

export function age(dob: string, now: DateInput = appDate()) {
  const [y, m, d] = dob.split('-').map(Number) as [number, number, number]
  const [ny, nm, nd] = isoDay(now).split('-').map(Number) as [number, number, number]
  return ny - y - (nm < m || (nm === m && nd < d) ? 1 : 0)
}

export type Greeting = 'morning' | 'afternoon' | 'evening' | 'night'

/** Morning 05–12, afternoon 12–17, evening 17–22, night otherwise. */
export function relativeGreeting(now: DateInput = appDate()): Greeting {
  const hour = Number(parts(now).hour)
  if (hour >= 5 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 17) return 'afternoon'
  if (hour >= 17 && hour < 22) return 'evening'
  return 'night'
}

/** Day of month and short month name ("16", "Oct" / "אוק׳") for date blocks. */
export function dayMonth(d: DateInput, lang: Lang) {
  const day = String(Number(parts(d).day))
  const month = new Intl.DateTimeFormat(locale(lang), { timeZone: TIME_ZONE, month: 'short' }).format(toDate(d))
  return { day, month }
}

/** Calendar arithmetic on YYYY-MM-DD strings (no time zone involved). */
export function addDays(iso: string, n: number) {
  const [y, m, d] = iso.split('-').map(Number) as [number, number, number]
  const t = new Date(Date.UTC(y, m - 1, d + n))
  return t.toISOString().slice(0, 10)
}

/** Noon in Israel on that calendar day, safe for weekday/date formatting. */
export const dayInstant = (iso: string) => new Date(`${iso}T12:00:00+03:00`)

export type RelativeDay = 'yesterday' | 'today' | 'tomorrow'

export function relativeDay(iso: string, now: DateInput = appDate()): RelativeDay | null {
  const today = isoDay(now)
  if (iso === today) return 'today'
  if (iso === addDays(today, -1)) return 'yesterday'
  if (iso === addDays(today, 1)) return 'tomorrow'
  return null
}

/** "+97235550100" → "03-555-0100", "+972501234567" → "050-123-4567". */
export function formatPhone(e164: string) {
  const digits = e164.replace(/\D/g, '')
  const local = digits.startsWith('972') ? `0${digits.slice(3)}` : digits
  if (local.length === 10) return `${local.slice(0, 3)}-${local.slice(3, 6)}-${local.slice(6)}`
  if (local.length === 9) return `${local.slice(0, 2)}-${local.slice(2, 5)}-${local.slice(5)}`
  return e164
}

/**
 * Wraps a value in LTR isolate marks for plain-string contexts (chips, toasts, aria labels) where
 * <Ltr> can't be used, so "14.10.2026 09:41" never reorders inside Hebrew text.
 */
export const bidiIsolate = (value: string) => `\u2066${value}\u2069`

export function count(n: number, max = 99) {
  return n > max ? `${max}+` : String(n)
}

/** 0 = Sunday … 6 = Saturday for a YYYY-MM-DD day. */
export function weekdayIndex(iso: string) {
  const [y, m, d] = iso.split('-').map(Number) as [number, number, number]
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay()
}

/** The Sunday that starts the week containing `iso` (weeks start on Sunday in Israel). */
export const startOfWeek = (iso: string) => addDays(iso, -weekdayIndex(iso))

export const monthStart = (iso: string) => `${iso.slice(0, 7)}-01`

export function addMonths(iso: string, n: number) {
  const [y, m] = iso.split('-').map(Number) as [number, number]
  const t = new Date(Date.UTC(y, m - 1 + n, 1))
  return t.toISOString().slice(0, 10)
}

/** Whole weeks (Sunday → Saturday) covering the month of `iso`: 35 or 42 days. */
export function monthGrid(iso: string) {
  const first = monthStart(iso)
  const last = addDays(addMonths(first, 1), -1)
  const start = startOfWeek(first)
  const end = addDays(startOfWeek(last), 6)
  const days: string[] = []
  for (let d = start; d <= end; d = addDays(d, 1)) days.push(d)
  return days
}
