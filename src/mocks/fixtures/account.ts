import type {
  AppNotification,
  Center,
  ServiceDetail,
  ServiceStatus,
  ServiceSummary,
  ServiceType,
  ServiceTypeCode,
} from '@/api/schemas/account'
import type { Attachment, Person } from '@/api/schemas/common'
import type { MockLang } from '../http'
import { person, type L } from './staff'

const T = (d: string, hm: string) => `${d}T${hm}:00+03:00`

type Opt = { code: string; label: L }
const opt = (code: string, en: string, he: string): Opt => ({ code, label: { en, he } })
const ANY = opt('any', 'Any time', 'בכל שעה')

const TYPES: { code: ServiceTypeCode; name: L; times: Opt[] }[] = [
  {
    code: 'maintenance',
    name: { en: 'Maintenance', he: 'אחזקה' },
    times: [ANY, opt('morning', 'Morning', 'בבוקר'), opt('afternoon', 'Afternoon', 'אחר הצהריים')],
  },
  {
    code: 'laundry',
    name: { en: 'Laundry / Clothing', he: 'כביסה / ביגוד' },
    times: [ANY, opt('friday_morning', 'Friday morning', 'שישי בבוקר'), opt('afternoon', 'Afternoon', 'אחר הצהריים')],
  },
  {
    code: 'hairdresser',
    name: { en: 'Hairdresser', he: 'מספרה' },
    times: [opt('tuesday_morning', 'Tuesday morning', 'שלישי בבוקר'), opt('thursday_morning', 'Thursday morning', 'חמישי בבוקר')],
  },
  { code: 'equipment', name: { en: 'Personal equipment', he: 'ציוד אישי' }, times: [ANY] },
  {
    code: 'conversation',
    name: { en: 'Request a conversation', he: 'בקשה לשיחה' },
    times: [ANY, opt('morning', 'Morning', 'בבוקר'), opt('afternoon', 'Afternoon', 'אחר הצהריים')],
  },
  { code: 'finance', name: { en: 'Finance', he: 'כספים' }, times: [ANY] },
  { code: 'other', name: { en: 'Other', he: 'אחר' }, times: [ANY] },
]

export const serviceTypesFixture = (lang: MockLang): ServiceType[] =>
  TYPES.map((t) => ({ code: t.code, name: t.name[lang], timeOptions: t.times.map((o) => ({ code: o.code, label: o.label[lang] })) }))

export const timeLabel = (type: ServiceTypeCode, code: string | null, lang: MockLang) =>
  code ? (TYPES.find((t) => t.code === type)?.times.find((o) => o.code === code)?.label[lang] ?? null) : null

type Text = L | string
const loc = (t: Text, lang: MockLang) => (typeof t === 'string' ? t : t[lang])

type LogRecord = { id: string; status: ServiceStatus | 'comment'; text: Text; at: string; by: Text | null }

export type ServiceRecord = {
  id: string
  rid: string
  ref: string
  title: Text
  type: ServiceTypeCode
  status: ServiceStatus
  createdAt: string
  updatedAt: string
  scheduledAt: string | null
  description: Text
  preferredTime: string | null
  assignee: ((lang: MockLang) => Person) | null
  expected: L | null
  attachments: Attachment[]
  log: LogRecord[]
  version: number
}

const orly = (lang: MockLang): Person => ({
  id: 'st_orly',
  name: lang === 'he' ? 'אורלי כץ' : 'Orly Katz',
  initials: lang === 'he' ? 'אכ' : 'OK',
  role: lang === 'he' ? 'צוות הכביסה' : 'Laundry team',
  roleCode: 'laundry',
  photoUrl: null,
})

function seed(): ServiceRecord[] {
  return [
    {
      id: 'sr_1193',
      rid: 'res_miriam',
      ref: 'SR-1193',
      title: { en: 'Label new winter clothes', he: 'סימון בגדי חורף חדשים' },
      type: 'laundry',
      status: 'assigned',
      createdAt: T('2026-10-14', '09:41'),
      updatedAt: T('2026-10-14', '09:50'),
      scheduledAt: null,
      description: {
        en: "I'm bringing 6 new winter items on Friday. Please label them with Miriam's name and room number.",
        he: 'אביא ביום שישי 6 פריטי חורף חדשים. אבקש לסמן אותם בשם של מרים ובמספר החדר.',
      },
      preferredTime: 'friday_morning',
      assignee: orly,
      expected: { en: 'Within 2 days of receiving the clothes', he: 'תוך יומיים מקבלת הבגדים' },
      attachments: [],
      log: [
        { id: 'l1', status: 'opened', text: { en: 'Request opened by you', he: 'הבקשה נפתחה על ידכם' }, at: T('2026-10-14', '09:41'), by: null },
        { id: 'l2', status: 'assigned', text: { en: 'Assigned to Orly Katz', he: 'שובצה לאורלי כץ' }, at: T('2026-10-14', '09:50'), by: null },
      ],
      version: 2,
    },
    {
      id: 'sr_1190',
      rid: 'res_miriam',
      ref: 'SR-1190',
      title: { en: 'Haircut before the holiday', he: 'תספורת לפני החג' },
      type: 'hairdresser',
      status: 'in_progress',
      createdAt: T('2026-10-11', '10:00'),
      updatedAt: T('2026-10-12', '08:30'),
      scheduledAt: T('2026-10-18', '10:00'),
      description: { en: 'A short haircut before the holiday, please.', he: 'תספורת קצרה לפני החג, בבקשה.' },
      preferredTime: 'thursday_morning',
      assignee: null,
      expected: null,
      attachments: [],
      log: [
        { id: 'l1', status: 'opened', text: { en: 'Request opened by you', he: 'הבקשה נפתחה על ידכם' }, at: T('2026-10-11', '10:00'), by: null },
        { id: 'l2', status: 'in_progress', text: { en: 'Scheduled for 18.10.2026 10:00', he: 'נקבע ל-18.10.2026 10:00' }, at: T('2026-10-12', '08:30'), by: null },
      ],
      version: 2,
    },
    {
      id: 'sr_1182',
      rid: 'res_miriam',
      ref: 'SR-1182',
      title: { en: 'Wardrobe door in Room 12', he: 'דלת הארון בחדר 12' },
      type: 'maintenance',
      status: 'handled',
      createdAt: T('2026-10-07', '18:20'),
      updatedAt: T('2026-10-10', '12:10'),
      scheduledAt: null,
      description: { en: "The wardrobe door doesn't close properly.", he: 'דלת הארון לא נסגרת כמו שצריך.' },
      preferredTime: 'any',
      assignee: null,
      expected: null,
      attachments: [],
      log: [
        { id: 'l1', status: 'opened', text: { en: 'Request opened by you', he: 'הבקשה נפתחה על ידכם' }, at: T('2026-10-07', '18:20'), by: null },
        { id: 'l2', status: 'handled', text: { en: 'The hinge was replaced', he: 'הציר הוחלף' }, at: T('2026-10-10', '12:10'), by: null },
      ],
      version: 3,
    },
    {
      id: 'sr_1175',
      rid: 'res_miriam',
      ref: 'SR-1175',
      title: { en: 'Talk with the social worker', he: 'שיחה עם העובדת הסוציאלית' },
      type: 'conversation',
      status: 'closed',
      createdAt: T('2026-09-20', '11:00'),
      updatedAt: T('2026-09-28', '15:00'),
      scheduledAt: null,
      description: { en: "I'd like to talk about Miriam's routine.", he: 'אשמח לשוחח על השגרה של מרים.' },
      preferredTime: 'afternoon',
      assignee: null,
      expected: null,
      attachments: [],
      log: [
        { id: 'l1', status: 'opened', text: { en: 'Request opened by you', he: 'הבקשה נפתחה על ידכם' }, at: T('2026-09-20', '11:00'), by: null },
        { id: 'l2', status: 'closed', text: { en: 'The conversation took place', he: 'השיחה התקיימה' }, at: T('2026-09-28', '15:00'), by: null },
      ],
      version: 4,
    },
  ]
}

let services: ServiceRecord[] | null = null
export const serviceRecords = () => (services ??= seed())

let nextRef = 1194
export const allocateServiceRef = () => {
  const n = nextRef++
  return { id: `sr_${n}`, ref: `SR-${n}` }
}

export const canCancel = (s: ServiceRecord) => s.status === 'opened' || s.status === 'assigned'

export function serviceSummary(s: ServiceRecord, lang: MockLang): ServiceSummary {
  return {
    id: s.id,
    ref: s.ref,
    title: loc(s.title, lang),
    type: s.type,
    status: s.status,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
    scheduledAt: s.scheduledAt,
  }
}

export function serviceDetail(s: ServiceRecord, lang: MockLang): ServiceDetail {
  return {
    ...serviceSummary(s, lang),
    description: loc(s.description, lang),
    preferredTime: timeLabel(s.type, s.preferredTime, lang),
    assignee: s.assignee ? s.assignee(lang) : null,
    expected: s.expected ? s.expected[lang] : null,
    attachments: s.attachments,
    log: [...s.log]
      .sort((a, b) => b.at.localeCompare(a.at))
      .map((e) => ({ id: e.id, status: e.status, text: loc(e.text, lang), at: e.at, by: e.by ? loc(e.by, lang) : null })),
    canCancel: canCancel(s),
    version: s.version,
  }
}

/** Dev panel "staff update": moves SR-1193 forward one step, as the laundry team would. */
export function advanceStaffUpdate(at: string) {
  const s = serviceRecords().find((x) => x.id === 'sr_1193')
  if (!s || s.status !== 'assigned') return false
  s.status = 'in_progress'
  s.updatedAt = at
  s.version += 1
  s.log.push({ id: `l${s.log.length + 1}`, status: 'in_progress', text: { en: 'The laundry team started on it', he: 'צוות הכביסה התחיל לטפל' }, at, by: null })
  return true
}

export function centerFixture(lang: MockLang): Center {
  const he = lang === 'he'
  const L = (en: string, h: string) => (he ? h : en)
  const ruth = person('ruth', lang)
  const yael = person('yael', lang)
  const avi = person('avi', lang)
  const oren = person('oren', lang)
  return {
    name: L('Beit Hadar Care Center', 'מרכז סיעודי בית הדר'),
    address: L('12 HaRimon St., Ramat Gan', 'רחוב הרימון 12, רמת גן'),
    phone: '+97235550100',
    email: 'family@beithadar.co.il',
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=12+HaRimon+St+Ramat+Gan',
    visitingHours: [
      { label: L('Sunday – Thursday', 'ראשון – חמישי'), from: '09:00', to: '20:00', quiet: false },
      { label: L('Friday and holiday eves', 'שישי וערבי חג'), from: '09:00', to: '14:00', quiet: false },
      { label: L('Saturday and holidays', 'שבת וחגים'), from: '10:00', to: '18:00', quiet: false },
      { label: L('Quiet hours (lobby and garden only)', 'שעות מנוחה (בלובי ובגן בלבד)'), from: '14:00', to: '16:00', quiet: true },
    ],
    contacts: [
      { roleLabel: ruth.role, name: ruth.name, phone: '+97235550142', department: 'nursing' },
      { roleLabel: L('Social worker', 'עובדת סוציאלית'), name: yael.name, phone: '+97235550155', department: 'social_work' },
      { roleLabel: avi.role, name: avi.name, phone: '+97235550160', department: 'doctor' },
      { roleLabel: oren.role, name: oren.name, phone: '+97235550170', department: 'finance' },
      { roleLabel: L('Reception', 'קבלה'), name: L('Open 24 hours', 'פתוחה 24 שעות'), phone: '+97235550100', department: null },
    ],
    guide: [
      {
        code: 'response_hours',
        title: L('Response hours', 'שעות מענה'),
        items: [
          { text: L('Inquiries are answered Sun–Thu 08:00–16:00, usually within 1 business day.', 'פניות נענות בימים א׳–ה׳ 08:00–16:00, בדרך כלל תוך יום עסקים אחד.') },
          { text: L("For anything urgent, the nurses' station is staffed 24/7.", 'לכל עניין דחוף, עמדת האחיות מאוישת 24/7.') },
        ],
      },
      {
        code: 'procedures',
        title: L('Family procedures', 'נהלים למשפחות'),
        items: [
          { text: L('Sign in at reception on every visit.', 'נא להירשם בקבלה בכל ביקור.') },
          { text: L('Taking Miriam out of the center? Tell the nurses 24 hours ahead.', 'יוצאים עם מרים מהמרכז? עדכנו את האחיות 24 שעות מראש.') },
          { text: L('Children under 12 must be with an adult at all times.', 'ילדים מתחת לגיל 12 חייבים להיות בליווי מבוגר בכל עת.') },
        ],
      },
      {
        code: 'may_bring',
        title: L('What you may bring', 'מה מותר להביא'),
        items: [
          { text: L('Clothes labeled with name and room number', 'בגדים מסומנים בשם ובמספר החדר') },
          { text: L('Family photos and small personal items', 'תמונות משפחתיות וחפצים אישיים קטנים') },
          { text: L('Sealed snacks approved by the dietitian', 'חטיפים סגורים באישור הדיאטנית') },
        ],
      },
      {
        code: 'dont_bring',
        title: L("Please don't bring", 'נא לא להביא'),
        items: [
          { text: L('Any medication, including over-the-counter', 'תרופות מכל סוג, כולל ללא מרשם') },
          { text: L('Heaters or electric blankets', 'תנורי חימום או שמיכות חשמליות') },
          { text: L('Home-cooked food without asking the nurses', 'אוכל ביתי ללא תיאום עם האחיות') },
          { text: L('Jewelry, cash or other valuables', 'תכשיטים, מזומן או חפצי ערך') },
        ],
      },
      {
        code: 'preparing',
        title: L('Preparing for a visit', 'הכנה לביקור'),
        items: [
          { text: L("Check Miriam's day in the app to avoid physiotherapy and meal times.", 'בדקו באפליקציה את היום של מרים כדי להימנע משעות פיזיותרפיה וארוחות.') },
          { text: L('If you have a cold, please postpone and call instead.', 'אם אתם מצוננים, נא לדחות את הביקור ולהתקשר במקום.') },
        ],
      },
      {
        code: 'services',
        title: L('Services at the center', 'שירותים במרכז'),
        items: [
          { text: L('Hairdresser: Tuesday and Thursday mornings', 'מספרה: שלישי וחמישי בבוקר') },
          { text: L('Laundry, synagogue, library and cafeteria', 'כביסה, בית כנסת, ספרייה וקפטריה') },
        ],
      },
      {
        code: 'phones',
        title: L('Important phone numbers', 'מספרי טלפון חשובים'),
        items: [
          { text: L('Reception', 'קבלה'), phone: '+97235550100' },
          { text: L("Ward B nurses' station", 'עמדת אחיות מחלקה ב׳'), phone: '+97235550142' },
          { text: L('Social work', 'עבודה סוציאלית'), phone: '+97235550155' },
          { text: L('Emergency (Magen David Adom)', 'חירום (מגן דוד אדום)'), phone: '101', emergency: true },
        ],
      },
    ],
  }
}

type NotificationRecord = Omit<AppNotification, 'title'> & { title: L }

const n = (
  id: string,
  kind: AppNotification['kind'],
  createdAt: string,
  read: boolean,
  link: AppNotification['link'],
  en: string,
  he: string,
): NotificationRecord => ({ id, kind, createdAt, readAt: read ? createdAt : null, link, title: { en, he } })

function seedNotifications(): NotificationRecord[] {
  return [
    n('n_101', 'document', T('2026-10-14', '09:05'), false, { type: 'document', id: 'doc_flu', residentId: 'res_miriam' }, 'You have a new document to sign', 'יש לכם מסמך חדש לחתימה'),
    n('n_102', 'inquiry_reply', T('2026-10-14', '08:12'), false, { type: 'inquiry', id: 'inq_2038', residentId: 'res_miriam' }, 'A reply to your inquiry has been received', 'התקבלה תשובה לפנייה שלכם'),
    n('n_103', 'update', T('2026-10-14', '07:40'), false, { type: 'update', id: 'upd_garden', residentId: 'res_avraham' }, 'A new personal update was shared', 'שותף עדכון אישי חדש'),
    n('n_104', 'event', T('2026-10-13', '16:00'), false, { type: 'event', id: 'ev_hanukkah', residentId: null }, 'A new event has been published', 'פורסם אירוע חדש'),
    n('n_105', 'calendar_change', T('2026-10-13', '14:40'), true, { type: 'calendar_item', id: 'cal_dr_shapiro', residentId: 'res_miriam' }, 'An appointment time has changed', 'שעת תור השתנתה'),
    n('n_106', 'update', T('2026-10-13', '10:16'), true, { type: 'update', id: 'upd_music', residentId: 'res_miriam' }, 'A new personal update was shared', 'שותף עדכון אישי חדש'),
    n('n_107', 'service_request', T('2026-10-12', '12:10'), true, { type: 'service_request', id: 'sr_1182', residentId: 'res_miriam' }, 'Your service request was handled', 'בקשת השירות שלכם טופלה'),
    n('n_108', 'survey', T('2026-10-12', '09:00'), true, { type: 'survey', id: 'sv_family_2026', residentId: 'res_miriam' }, 'A new survey is waiting for you', 'סקר חדש ממתין לכם'),
  ]
}

let notifications: NotificationRecord[] | null = null
export const notificationRecords = () => (notifications ??= seedNotifications())

export const toNotification = (r: NotificationRecord, lang: MockLang): AppNotification => ({ ...r, title: r.title[lang] })
