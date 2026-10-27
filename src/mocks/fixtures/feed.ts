import type { Attachment } from '@/api/schemas/common'
import type { FeedCategory, FeedDetail, FeedItem } from '@/api/schemas/feed'
import type { MockLang } from '../http'
import { rsvps } from './calendar'
import { fixtureAttachment } from './files'
import type { L } from './staff'

type FeedRecord = {
  id: string
  category: FeedCategory
  title: L
  excerpt: L
  body: L
  highlights: L[]
  publishedAt: string
  author: L
  requiresReadConfirmation: boolean
  eventId: string | null
  /** Invitations count toward "1 invitation" on Home; other events are just listed. */
  invitation: boolean
  archived: boolean
  attachments: () => Attachment[]
}

const T = (d: string, hm = '08:00') => `${d}T${hm}:00+03:00`
const MGMT: L = { en: 'Management', he: 'הנהלה' }
const ACT: L = { en: 'Activities', he: 'פעילויות' }

const rec = (r: Omit<FeedRecord, 'highlights' | 'requiresReadConfirmation' | 'eventId' | 'invitation' | 'archived' | 'attachments' | 'body'> & Partial<FeedRecord>): FeedRecord => ({
  highlights: [],
  requiresReadConfirmation: false,
  eventId: null,
  invitation: false,
  archived: false,
  attachments: () => [],
  body: r.excerpt,
  ...r,
})

const RECORDS: FeedRecord[] = [
  rec({
    id: 'nl_october',
    category: 'newsletter',
    title: { en: 'October family newsletter', he: 'עלון המשפחות לאוקטובר' },
    excerpt: {
      en: 'New visiting hours, the holiday program and a welcome to our new dietitian.',
      he: 'שעות ביקור חדשות, תוכנית החגים וברכות לדיאטנית החדשה שלנו.',
    },
    body: {
      en: "A summary of what's happening at Beit Hadar this month. The full newsletter is attached as a PDF.",
      he: 'סיכום של מה שקורה בבית הדר החודש. העלון המלא מצורף כקובץ PDF.',
    },
    highlights: [
      {
        en: 'New visiting hours from 01.11.2026: every day 09:00–20:00',
        he: 'שעות ביקור חדשות החל מ-01.11.2026: בכל יום 09:00–20:00',
      },
      { en: 'Hanukkah family evening on 10.12.2026', he: 'ערב חנוכה למשפחות ב-10.12.2026' },
      { en: 'Meet Michal, our new dietitian', he: 'הכירו את מיכל, הדיאטנית החדשה שלנו' },
    ],
    publishedAt: T('2026-10-12'),
    author: MGMT,
    requiresReadConfirmation: true,
    attachments: () => [fixtureAttachment('att_nl_october', 'october-newsletter.pdf', 'application/pdf', 1_200_000)],
  }),
  rec({
    id: 'fi_hanukkah',
    category: 'event',
    title: { en: 'Hanukkah family evening', he: 'ערב חנוכה למשפחות' },
    excerpt: {
      en: "Candle lighting, the residents' choir and sufganiyot in the courtyard.",
      he: 'הדלקת נרות, מקהלת הדיירים וסופגניות בחצר.',
    },
    publishedAt: T('2026-10-11', '12:00'),
    author: ACT,
    eventId: 'ev_hanukkah',
    invitation: true,
  }),
  rec({
    id: 'fi_pumpkin',
    category: 'activity',
    title: { en: 'Pumpkin painting workshop', he: 'סדנת ציור על דלעות' },
    excerpt: {
      en: '14 residents took part. Photos from the workshop are in the gallery.',
      he: '14 דיירים השתתפו. תמונות מהסדנה נמצאות בגלריה.',
    },
    body: {
      en: '14 residents took part in the pumpkin painting workshop in the garden lounge. Miriam painted a sunflower and asked to keep her pumpkin in her room.',
      he: '14 דיירים השתתפו בסדנת ציור על דלעות בפינת הגן. מרים ציירה חמנייה וביקשה לשמור את הדלעת שלה בחדר.',
    },
    publishedAt: T('2026-10-09', '15:00'),
    author: ACT,
  }),
  rec({
    id: 'fi_parking',
    category: 'update',
    title: { en: 'New parking arrangement from 01.11.2026', he: 'הסדר חניה חדש החל מ-01.11.2026' },
    excerpt: {
      en: 'Visitor parking moves to the north gate on HaRimon St.',
      he: 'חניית המבקרים עוברת לשער הצפוני ברחוב הרימון.',
    },
    body: {
      en: 'From 01.11.2026, visitor parking moves to the north gate on HaRimon St. The south lot will be reserved for ambulances and deliveries.',
      he: 'החל מ-01.11.2026 חניית המבקרים עוברת לשער הצפוני ברחוב הרימון. החניון הדרומי ישמש אמבולנסים ומשלוחים בלבד.',
    },
    publishedAt: T('2026-10-08'),
    author: MGMT,
  }),
  rec({
    id: 'fi_music',
    category: 'event',
    title: { en: 'Family music afternoon', he: 'אחר צהריים של מוזיקה עם המשפחה' },
    excerpt: {
      en: "The residents' choir performs autumn songs, followed by coffee and cake.",
      he: 'מקהלת הדיירים מופיעה בשירי סתיו, ולאחר מכן קפה ועוגה.',
    },
    publishedAt: T('2026-10-01', '10:00'),
    author: ACT,
    eventId: 'ev_music',
  }),
  rec({
    id: 'fi_rosh',
    category: 'event',
    title: { en: 'Rosh Hashanah family event', he: 'אירוע ראש השנה למשפחות' },
    excerpt: { en: 'Thank you to all the families who joined us.', he: 'תודה לכל המשפחות שהצטרפו אלינו.' },
    publishedAt: T('2026-09-10', '18:00'),
    author: ACT,
    archived: true,
  }),
  rec({
    id: 'nl_september',
    category: 'newsletter',
    title: { en: 'September family newsletter', he: 'עלון המשפחות לספטמבר' },
    excerpt: { en: 'The holiday program and the new autumn menu.', he: 'תוכנית החגים ותפריט הסתיו החדש.' },
    publishedAt: T('2026-09-01'),
    author: MGMT,
    archived: true,
  }),
  rec({
    id: 'fi_honey',
    category: 'activity',
    title: { en: 'Honey cake baking with grandchildren', he: 'אפיית עוגות דבש עם הנכדים' },
    excerpt: { en: 'A sweet morning in the activity room.', he: 'בוקר מתוק בחדר הפעילות.' },
    publishedAt: T('2026-09-08', '11:00'),
    author: ACT,
    archived: true,
  }),
  rec({
    id: 'fi_ac',
    category: 'update',
    title: { en: 'Air conditioning upgrade in Ward B', he: 'שדרוג מיזוג האוויר במחלקה ב׳' },
    excerpt: { en: 'The new units were installed in all rooms.', he: 'היחידות החדשות הותקנו בכל החדרים.' },
    publishedAt: T('2026-08-18'),
    author: MGMT,
    archived: true,
  }),
  rec({
    id: 'nl_august',
    category: 'newsletter',
    title: { en: 'August family newsletter', he: 'עלון המשפחות לאוגוסט' },
    excerpt: { en: 'Summer activities and staff news.', he: 'פעילויות הקיץ וחדשות הצוות.' },
    publishedAt: T('2026-08-01'),
    author: MGMT,
    archived: true,
  }),
]

/** Newsletter read confirmations this session. */
export const readConfirmations = new Map<string, string>()

export const findFeed = (id: string) => RECORDS.find((r) => r.id === id)

export function toItem(r: FeedRecord, lang: MockLang): FeedItem {
  return {
    id: r.id,
    category: r.category,
    title: r.title[lang],
    excerpt: r.excerpt[lang],
    publishedAt: r.publishedAt,
    author: r.author[lang],
    coverUrl: null,
    requiresReadConfirmation: r.requiresReadConfirmation,
    readConfirmedAt: readConfirmations.get(r.id) ?? null,
    eventId: r.eventId,
    rsvp: r.eventId ? (rsvps.get(r.eventId)?.status ?? null) : null,
  }
}

export function toDetail(r: FeedRecord, lang: MockLang): FeedDetail {
  return {
    ...toItem(r, lang),
    body: r.body[lang],
    highlights: r.highlights.map((h) => h[lang]),
    attachments: r.attachments(),
    version: 1,
  }
}

const CATEGORY: Record<string, FeedCategory | undefined> = {
  updates: 'update',
  newsletters: 'newsletter',
  activities: 'activity',
  events: 'event',
}

export function feedList(lang: MockLang, opts: { category: string; archive: boolean; q: string }) {
  const cat = CATEGORY[opts.category]
  const q = opts.q.trim().toLowerCase()
  return RECORDS.filter((r) => r.archived === opts.archive)
    .filter((r) => !cat || r.category === cat)
    .filter((r) => !q || `${r.title[lang]} ${r.excerpt[lang]}`.toLowerCase().includes(q))
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .map((r) => toItem(r, lang))
}

/** Invitations still waiting for an answer, for Home and the More menu. */
export const pendingInvitations = () => RECORDS.filter((r) => r.invitation && r.eventId && !rsvps.has(r.eventId)).length

