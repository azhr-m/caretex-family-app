import type { CalendarItemDetail, CalendarItemSummary, EventDetail, Rsvp } from '@/api/schemas/calendar'
import type { MockLang } from '../http'
import { at } from '../time'
import type { L } from './staff'

type ItemFixture = {
  id: string
  rid: string | null
  kind: CalendarItemSummary['kind']
  category: CalendarItemSummary['category']
  title: L
  day: string
  start: string
  end: string | null
  location: L
  requiresConfirmation: boolean
  eventId: string | null
  changed: { from: string; at: string } | null
  with: L | null
  purpose: L | null
  notes: L | null
}

const item = (f: Partial<ItemFixture> & Pick<ItemFixture, 'id' | 'kind' | 'category' | 'title' | 'day' | 'start' | 'location'>): ItemFixture => ({
  rid: null,
  end: null,
  requiresConfirmation: false,
  eventId: null,
  changed: null,
  with: null,
  purpose: null,
  notes: null,
  ...f,
})

const room12: L = { en: 'Room 12', he: 'חדר 12' }

const ITEMS: ItemFixture[] = [
  item({ id: 'cal_call_noam', rid: 'res_miriam', kind: 'personal', category: 'call', day: '2026-10-12', start: '15:00', end: '15:30', title: { en: 'Video call with Noam', he: 'שיחת וידאו עם נועם' }, location: room12 }),
  item({ id: 'cal_physio', rid: 'res_miriam', kind: 'personal', category: 'therapy', day: '2026-10-14', start: '11:30', end: '12:15', title: { en: 'Physiotherapy session', he: 'טיפול פיזיותרפיה' }, location: { en: 'Physiotherapy room', he: 'חדר פיזיותרפיה' }, with: { en: 'Noa Peretz, physiotherapist', he: 'נועה פרץ, פיזיותרפיסטית' } }),
  item({
    id: 'cal_dr_shapiro',
    rid: 'res_miriam',
    kind: 'personal',
    category: 'doctor',
    day: '2026-10-16',
    start: '11:00',
    end: '11:30',
    title: { en: 'Doctor visit · Dr. Avi Shapiro', he: 'ביקור רופא · ד״ר אבי שפירא' },
    location: { en: 'Ward B clinic, 1st floor', he: 'מרפאת מחלקה ב׳, קומה 1' },
    requiresConfirmation: true,
    changed: { from: '2026-10-15T11:00:00+03:00', at: '2026-10-11T14:40:00+03:00' },
    with: { en: 'Dr. Avi Shapiro, family physician', he: 'ד״ר אבי שפירא, רופא משפחה' },
    purpose: { en: 'Routine monthly check', he: 'בדיקה חודשית שגרתית' },
  }),
  item({ id: 'cal_hair', rid: 'res_miriam', kind: 'personal', category: 'hair', day: '2026-10-18', start: '10:00', end: '10:45', title: { en: 'Hairdresser appointment', he: 'תור למספרה' }, location: { en: 'Salon, ground floor', he: 'המספרה, קומת קרקע' } }),
  item({ id: 'cal_flu', rid: 'res_miriam', kind: 'personal', category: 'vaccine', day: '2026-10-20', start: '09:00', end: null, title: { en: 'Flu vaccination', he: 'חיסון שפעת' }, location: { en: 'Ward B clinic, 1st floor', he: 'מרפאת מחלקה ב׳, קומה 1' }, notes: { en: 'Requires the signed consent form.', he: 'נדרש טופס הסכמה חתום.' } }),
  item({ id: 'cal_dental', rid: 'res_miriam', kind: 'personal', category: 'doctor', day: '2026-11-05', start: '10:30', end: '11:00', title: { en: 'Dental check', he: 'בדיקת שיניים' }, location: { en: 'Visiting dentist, clinic', he: 'רופא שיניים מבקר, מרפאה' }, requiresConfirmation: true, with: { en: 'Dr. Lior Ben-Ami', he: 'ד״ר ליאור בן עמי' }, purpose: { en: 'Yearly check', he: 'בדיקה שנתית' } }),
  item({ id: 'cal_av_eye', rid: 'res_avraham', kind: 'personal', category: 'doctor', day: '2026-10-19', start: '10:00', end: '10:30', title: { en: 'Eye examination', he: 'בדיקת עיניים' }, location: { en: 'Ward D clinic', he: 'מרפאת מחלקה ד׳' }, requiresConfirmation: true, with: { en: 'Dr. Avi Shapiro', he: 'ד״ר אבי שפירא' }, purpose: { en: 'Glasses prescription', he: 'התאמת משקפיים' } }),
  item({ id: 'cal_ev_choir', kind: 'center_event', category: 'activity', day: '2026-10-15', start: '17:00', end: '18:00', title: { en: 'Choir rehearsal open to families', he: 'חזרת מקהלה פתוחה למשפחות' }, location: { en: 'Main hall', he: 'האולם הראשי' }, eventId: 'ev_choir' }),
  item({ id: 'cal_ev_music', kind: 'center_event', category: 'event', day: '2026-10-22', start: '16:30', end: '18:00', title: { en: 'Family music afternoon', he: 'אחר צהריים של מוזיקה עם המשפחה' }, location: { en: 'Center courtyard', he: 'חצר המרכז' }, eventId: 'ev_music' }),
  item({ id: 'cal_ev_support', kind: 'center_event', category: 'activity', day: '2026-10-27', start: '18:00', end: '19:30', title: { en: 'Family support group', he: 'קבוצת תמיכה למשפחות' }, location: { en: 'Social work room', he: 'חדר העבודה הסוציאלית' }, eventId: 'ev_support' }),
  item({ id: 'cal_ev_picnic', kind: 'center_event', category: 'event', day: '2026-10-29', start: '12:00', end: '14:00', title: { en: 'Autumn picnic in the garden', he: 'פיקניק סתיו בגן' }, location: { en: 'Garden', he: 'הגן' }, eventId: 'ev_picnic' }),
  item({ id: 'cal_ev_hanukkah', kind: 'center_event', category: 'event', day: '2026-12-10', start: '17:00', end: '19:00', title: { en: 'Hanukkah family evening', he: 'ערב חנוכה למשפחות' }, location: { en: 'Center courtyard', he: 'חצר המרכז' }, eventId: 'ev_hanukkah' }),
]

/** Appointments confirmed this session. */
export const confirmed = new Set<string>()

/** RSVPs saved this session, per event. */
export const rsvps = new Map<string, Rsvp>()

const pick = (l: L | null, lang: MockLang) => (l ? l[lang] : null)

function toSummary(f: ItemFixture, lang: MockLang): CalendarItemSummary {
  return {
    id: f.id,
    kind: f.kind,
    category: f.category,
    title: f.title[lang],
    startsAt: at(f.day, f.start),
    endsAt: f.end ? at(f.day, f.end) : null,
    allDay: false,
    location: f.location[lang],
    requiresConfirmation: f.requiresConfirmation,
    confirmation: f.requiresConfirmation ? (confirmed.has(f.id) ? 'confirmed' : 'pending') : null,
    rsvp: f.eventId ? (rsvps.get(f.eventId)?.status ?? null) : null,
    eventId: f.eventId,
    changed: f.changed,
  }
}

const visibleTo = (rid: string) => (f: ItemFixture) => f.rid === null || f.rid === rid

export function calendarRange(rid: string, from: string, to: string, lang: MockLang) {
  return ITEMS.filter(visibleTo(rid))
    .filter((f) => f.day >= from && f.day <= to)
    .sort((a, b) => (a.day + a.start).localeCompare(b.day + b.start))
    .map((f) => toSummary(f, lang))
}

export function calendarItem(id: string, lang: MockLang): (CalendarItemDetail & { rid: string | null }) | null {
  const f = ITEMS.find((i) => i.id === id)
  if (!f) return null
  return {
    ...toSummary(f, lang),
    with: pick(f.with, lang),
    purpose: pick(f.purpose, lang),
    notes: pick(f.notes, lang),
    version: confirmed.has(f.id) ? 2 : 1,
    rid: f.rid,
  }
}

const EVENTS: Record<string, { body: L; maxGuests: number; accessibility: L; deadline: string; program: { time: string; title: L; icon: string | null }[] }> = {
  ev_music: {
    body: {
      en: "Our residents' choir performs autumn songs, followed by coffee and cake with families. Grandchildren are welcome.",
      he: 'מקהלת הדיירים שלנו מופיעה בשירי סתיו, ולאחר מכן קפה ועוגה עם המשפחות. הנכדים מוזמנים.',
    },
    maxGuests: 4,
    accessibility: { en: 'Wheelchair accessible, seating provided', he: 'נגיש לכיסאות גלגלים, יש מקומות ישיבה' },
    deadline: '2026-10-20T23:59:00+03:00',
    program: [
      { time: '16:30', title: { en: 'Choir performance', he: 'הופעת המקהלה' }, icon: 'mic-vocal' },
      { time: '17:15', title: { en: 'Coffee and cake', he: 'קפה ועוגה' }, icon: 'coffee' },
    ],
  },
  ev_choir: {
    body: { en: 'Join the choir rehearsal and sing along with the residents.', he: 'הצטרפו לחזרת המקהלה ושירו יחד עם הדיירים.' },
    maxGuests: 2,
    accessibility: { en: 'Wheelchair accessible', he: 'נגיש לכיסאות גלגלים' },
    deadline: '2026-10-15T12:00:00+03:00',
    program: [],
  },
  ev_support: {
    body: { en: 'A monthly meeting for families, led by the social work team.', he: 'מפגש חודשי למשפחות בהנחיית צוות העבודה הסוציאלית.' },
    maxGuests: 1,
    accessibility: { en: 'Ground floor, accessible', he: 'קומת קרקע, נגיש' },
    deadline: '2026-10-26T23:59:00+02:00',
    program: [],
  },
  ev_picnic: {
    body: { en: 'Lunch in the garden with music and games for the whole family.', he: 'ארוחת צהריים בגן עם מוזיקה ומשחקים לכל המשפחה.' },
    maxGuests: 4,
    accessibility: { en: 'Paved paths, shaded seating', he: 'שבילים סלולים, ישיבה מוצלת' },
    deadline: '2026-10-27T23:59:00+02:00',
    program: [],
  },
  ev_hanukkah: {
    body: {
      en: "Join us to light the fifth candle together with the residents, followed by a performance by the residents' choir and sufganiyot in the courtyard.",
      he: 'הצטרפו אלינו להדלקת הנר החמישי יחד עם הדיירים, ולאחר מכן הופעה של מקהלת הדיירים וסופגניות בחצר.',
    },
    maxGuests: 4,
    accessibility: { en: 'Wheelchair accessible', he: 'נגיש לכיסאות גלגלים' },
    deadline: '2026-12-06T23:59:00+02:00',
    program: [
      { time: '17:00', title: { en: 'Candle lighting with the residents', he: 'הדלקת נרות עם הדיירים' }, icon: 'flame' },
      { time: '17:20', title: { en: "Residents' choir performance", he: 'הופעה של מקהלת הדיירים' }, icon: 'mic-vocal' },
      { time: '18:00', title: { en: 'Sufganiyot and hot drinks', he: 'סופגניות ושתייה חמה' }, icon: 'cookie' },
    ],
  },
}

export const eventMaxGuests = (id: string) => EVENTS[id]?.maxGuests ?? 0
export const eventDeadline = (id: string) => EVENTS[id]?.deadline ?? null

export function eventFixture(id: string, lang: MockLang): EventDetail | null {
  const e = EVENTS[id]
  const f = ITEMS.find((i) => i.eventId === id)
  if (!e || !f) return null
  return {
    id,
    title: f.title[lang],
    body: e.body[lang],
    startsAt: at(f.day, f.start),
    endsAt: f.end ? at(f.day, f.end) : null,
    location: id === 'ev_music' ? (lang === 'he' ? 'חצר המרכז (באולם הראשי במקרה של גשם)' : 'Center courtyard (main hall if it rains)') : f.location[lang],
    coverUrl: null,
    maxGuests: e.maxGuests,
    accessibility: e.accessibility[lang],
    program: e.program.map((p) => ({ time: p.time, title: p.title[lang], icon: p.icon })),
    rsvpDeadline: e.deadline,
    myRsvp: rsvps.get(id) ?? null,
    version: 1,
  }
}

/** iCalendar text for "Add to my calendar". */
export function icsFor(id: string, lang: MockLang) {
  const d = calendarItem(id, lang)
  if (!d) return null
  const stamp = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const esc = (s: string) => s.replace(/[\\,;]/g, (c) => `\\${c}`).replace(/\n/g, '\\n')
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CARETEX//Family//EN',
    'BEGIN:VEVENT',
    `UID:${d.id}@caretex`,
    `DTSTAMP:${stamp(new Date().toISOString())}`,
    `DTSTART:${stamp(d.startsAt)}`,
    `DTEND:${stamp(d.endsAt ?? new Date(new Date(d.startsAt).getTime() + 3_600_000).toISOString())}`,
    `SUMMARY:${esc(d.title)}`,
    `LOCATION:${esc(d.location)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}
