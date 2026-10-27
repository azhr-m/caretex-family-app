import type { Attachment, DepartmentCode, Person } from '@/api/schemas/common'
import type {
  Department,
  InquiryDetail,
  InquiryStatus,
  InquirySummary,
  TimelineEntry,
} from '@/api/schemas/inquiries'
import type { MockLang } from '../http'
import { fixtureAttachment } from './files'
import { person, type L, type StaffKey } from './staff'

type Text = L | string
const loc = (t: Text, lang: MockLang) => (typeof t === 'string' ? t : t[lang])

const DEPARTMENTS: { code: DepartmentCode; name: L; hint: L; days: 1 | 2 }[] = [
  { code: 'nursing', name: { en: 'Nursing', he: 'סיעוד' }, hint: { en: 'Daily care, medication', he: 'טיפול יומיומי, תרופות' }, days: 1 },
  { code: 'doctor', name: { en: 'Doctor', he: 'רופא' }, hint: { en: 'Medical questions', he: 'שאלות רפואיות' }, days: 1 },
  { code: 'social_work', name: { en: 'Social work', he: 'עבודה סוציאלית' }, hint: { en: 'Wellbeing, family', he: 'רווחה, משפחה' }, days: 1 },
  { code: 'physiotherapy', name: { en: 'Physiotherapy', he: 'פיזיותרפיה' }, hint: { en: 'Mobility, exercises', he: 'ניידות, תרגילים' }, days: 1 },
  { code: 'nutrition', name: { en: 'Nutrition', he: 'תזונה' }, hint: { en: 'Meals, diet', he: 'ארוחות, תפריט' }, days: 2 },
  { code: 'activities', name: { en: 'Activities', he: 'פעילויות' }, hint: { en: 'Groups, events', he: 'קבוצות, אירועים' }, days: 2 },
  { code: 'management', name: { en: 'Management', he: 'הנהלה' }, hint: { en: 'General matters', he: 'עניינים כלליים' }, days: 2 },
  { code: 'finance', name: { en: 'Finance', he: 'כספים' }, hint: { en: 'Invoices, payments', he: 'חשבוניות, תשלומים' }, days: 2 },
  { code: 'maintenance', name: { en: 'Maintenance', he: 'אחזקה' }, hint: { en: 'Room, repairs', he: 'חדר, תיקונים' }, days: 1 },
  { code: 'other', name: { en: 'Other', he: 'אחר' }, hint: { en: 'Not sure who to ask', he: 'לא בטוחים למי לפנות' }, days: 1 },
]

const expected = (days: 1 | 2, lang: MockLang) =>
  lang === 'he' ? (days === 1 ? 'יום עסקים אחד' : '2 ימי עסקים') : days === 1 ? '1 business day' : '2 business days'

export const departmentsFixture = (lang: MockLang): Department[] =>
  DEPARTMENTS.map((d) => ({ code: d.code, name: d.name[lang], hint: d.hint[lang], expectedResponse: expected(d.days, lang) }))

export const expectedResponse = (code: DepartmentCode, lang: MockLang) =>
  expected(DEPARTMENTS.find((d) => d.code === code)?.days ?? 1, lang)

export const departmentName = (code: DepartmentCode, lang: MockLang) =>
  DEPARTMENTS.find((d) => d.code === code)?.name[lang] ?? code

type Author = { staff: StaffKey } | 'dana'

type Entry =
  | { type: 'message'; id: string; author: Author; text: Text; attachments: Attachment[]; sentAt: string }
  | { type: 'status'; id: string; status: InquiryStatus; by: Author | null; at: string }

export type InquiryRecord = {
  id: string
  rid: string
  ref: string
  subject: Text
  department: DepartmentCode
  status: InquiryStatus
  createdAt: string
  hasUnreadReply: boolean
  version: number
  closedAt: string | null
  closedBy: Author | null
  timeline: Entry[]
}

const msg = (id: string, author: Author, sentAt: string, text: Text, attachments: Attachment[] = []): Entry => ({
  type: 'message',
  id,
  author,
  text,
  attachments,
  sentAt,
})
const st = (id: string, status: InquiryStatus, at: string, by: Author | null = null): Entry => ({
  type: 'status',
  id,
  status,
  by,
  at,
})

const T = (d: string, hm: string) => `${d}T${hm}:00+03:00`
const yael: Author = { staff: 'yael' }

function seed(): InquiryRecord[] {
  return [
    {
      id: 'inq_2041',
      rid: 'res_miriam',
      ref: 'INQ-2041',
      subject: { en: 'Winter clothing for Miriam', he: 'בגדי חורף למרים' },
      department: 'social_work',
      status: 'waiting_for_family',
      createdAt: T('2026-10-12', '18:05'),
      hasUnreadReply: true,
      version: 4,
      closedAt: null,
      closedBy: null,
      timeline: [
        msg('m_2041_1', 'dana', T('2026-10-12', '18:05'), {
          en: 'Hello Yael, the weather is getting colder. Does Miriam have enough warm clothes in her closet? I can bring things on my next visit.',
          he: 'שלום יעל, מתחיל להתקרר. יש למרים מספיק בגדים חמים בארון? אוכל להביא דברים בביקור הבא.',
        }),
        st('s_2041_1', 'read', T('2026-10-13', '08:12'), yael),
        st('s_2041_2', 'in_progress', T('2026-10-13', '08:30'), yael),
        msg(
          'm_2041_2',
          yael,
          T('2026-10-13', '11:20'),
          {
            en: 'Hi Dana, thank you for checking. Miriam has one warm sweater. Could you bring two more warm sweaters, warm socks and closed slippers by Sunday 18.10? Please label everything with her name and room number.',
            he: 'שלום דנה, תודה שבדקת. למרים יש סוודר חם אחד. תוכלי להביא עוד שני סוודרים חמים, גרביים חמות ונעלי בית סגורות עד יום ראשון 18.10? נא לסמן הכל בשם ובמספר החדר.',
          },
          [fixtureAttachment('att_labels', 'clothing-labels.pdf', 'application/pdf', 240_000)],
        ),
        st('s_2041_3', 'waiting_for_family', T('2026-10-13', '11:20'), yael),
      ],
    },
    {
      id: 'inq_2038',
      rid: 'res_miriam',
      ref: 'INQ-2038',
      subject: { en: 'Evening medication time', he: 'שעת התרופות בערב' },
      department: 'nursing',
      status: 'in_progress',
      createdAt: T('2026-10-12', '20:10'),
      hasUnreadReply: true,
      version: 3,
      closedAt: null,
      closedBy: null,
      timeline: [
        msg('m_2038_1', 'dana', T('2026-10-12', '20:10'), {
          en: "Could Miriam's evening medication be moved from 20:00 to 21:00? She finds it hard to fall asleep afterwards.",
          he: 'אפשר להעביר את התרופות של מרים בערב מ-20:00 ל-21:00? קשה לה להירדם אחרי שהיא לוקחת אותן.',
        }),
        st('s_2038_1', 'read', T('2026-10-13', '07:45'), { staff: 'ruth' }),
        st('s_2038_2', 'in_progress', T('2026-10-13', '08:00'), { staff: 'ruth' }),
        msg('m_2038_2', { staff: 'ruth' }, T('2026-10-13', '16:20'), {
          en: "We spoke with Dr. Shapiro and will update you after Friday's visit.",
          he: 'דיברנו עם ד״ר שפירא ונעדכן אותך אחרי הביקור ביום שישי.',
        }),
      ],
    },
    {
      id: 'inq_2044',
      rid: 'res_miriam',
      ref: 'INQ-2044',
      subject: { en: 'Visit with grandchildren on Saturday', he: 'ביקור עם הנכדים בשבת' },
      department: 'management',
      status: 'new',
      createdAt: T('2026-10-14', '08:55'),
      hasUnreadReply: false,
      version: 1,
      closedAt: null,
      closedBy: null,
      timeline: [
        msg('m_2044_1', 'dana', T('2026-10-14', '08:55'), {
          en: 'Can we use the garden lounge on Saturday afternoon? We will be 6 people.',
          he: 'אפשר להשתמש בפינת הגן בשבת אחר הצהריים? נהיה 6 אנשים.',
        }),
        st('s_2044_1', 'new', T('2026-10-14', '08:55')),
      ],
    },
    {
      id: 'inq_2032',
      rid: 'res_miriam',
      ref: 'INQ-2032',
      subject: { en: 'New walker height', he: 'גובה ההליכון החדש' },
      department: 'physiotherapy',
      status: 'read',
      createdAt: T('2026-10-09', '14:30'),
      hasUnreadReply: false,
      version: 2,
      closedAt: null,
      closedBy: null,
      timeline: [
        msg('m_2032_1', 'dana', T('2026-10-09', '14:30'), {
          en: 'The new walker seems too low for her. Could someone check it?',
          he: 'נראה שההליכון החדש נמוך מדי בשבילה. מישהו יכול לבדוק?',
        }),
        st('s_2032_1', 'read', T('2026-10-09', '16:00'), { staff: 'noa' }),
      ],
    },
    {
      id: 'inq_2027',
      rid: 'res_miriam',
      ref: 'INQ-2027',
      subject: { en: 'Lactose-free holiday meal', he: 'ארוחת חג ללא לקטוז' },
      department: 'nutrition',
      status: 'handled',
      createdAt: T('2026-09-28', '10:00'),
      hasUnreadReply: false,
      version: 4,
      closedAt: null,
      closedBy: null,
      timeline: [
        msg('m_2027_1', 'dana', T('2026-09-28', '10:00'), {
          en: 'Will there be a lactose-free option for Miriam during the holiday meals?',
          he: 'תהיה למרים מנה ללא לקטוז בארוחות החג?',
        }),
        st('s_2027_1', 'read', T('2026-09-28', '12:00'), { staff: 'michal' }),
        msg('m_2027_2', { staff: 'michal' }, T('2026-10-02', '09:30'), {
          en: 'A lactose-free option was prepared for Miriam for the whole holiday.',
          he: 'הוכנה למרים מנה ללא לקטוז לכל ימי החג.',
        }),
        st('s_2027_2', 'handled', T('2026-10-02', '09:30'), { staff: 'michal' }),
      ],
    },
    {
      id: 'inq_2019',
      rid: 'res_miriam',
      ref: 'INQ-2019',
      subject: { en: 'Question about the September invoice', he: 'שאלה על החשבונית של ספטמבר' },
      department: 'finance',
      status: 'closed',
      createdAt: T('2026-09-15', '11:10'),
      hasUnreadReply: false,
      version: 5,
      closedAt: T('2026-09-21', '10:05'),
      closedBy: { staff: 'oren' },
      timeline: [
        msg('m_2019_1', 'dana', T('2026-09-15', '11:10'), {
          en: 'The September invoice shows the laundry charge twice. Could you check?',
          he: 'בחשבונית של ספטמבר החיוב על הכביסה מופיע פעמיים. תוכלו לבדוק?',
        }),
        st('s_2019_1', 'read', T('2026-09-15', '13:00'), { staff: 'oren' }),
        msg('m_2019_2', { staff: 'oren' }, T('2026-09-21', '10:05'), {
          en: 'The duplicate laundry charge was removed. Closing this inquiry.',
          he: 'החיוב הכפול על הכביסה בוטל. אנחנו סוגרים את הפנייה.',
        }),
        st('s_2019_2', 'handled', T('2026-09-21', '10:04'), { staff: 'oren' }),
        st('s_2019_3', 'closed', T('2026-09-21', '10:05'), { staff: 'oren' }),
      ],
    },
    {
      id: 'inq_2050',
      rid: 'res_avraham',
      ref: 'INQ-2050',
      subject: { en: 'Newspaper delivery', he: 'משלוח העיתון' },
      department: 'nursing',
      status: 'handled',
      createdAt: T('2026-10-06', '09:00'),
      hasUnreadReply: false,
      version: 3,
      closedAt: null,
      closedBy: null,
      timeline: [
        msg('m_2050_1', 'dana', T('2026-10-06', '09:00'), {
          en: 'Could Avraham get the weekly newspaper with the Hebrew crossword?',
          he: 'אפשר שאברהם יקבל את העיתון השבועי עם התשבץ בעברית?',
        }),
        msg('m_2050_2', { staff: 'moshe' }, T('2026-10-06', '15:40'), {
          en: 'Done. It will arrive every Thursday.',
          he: 'סודר. העיתון יגיע בכל יום חמישי.',
        }),
        st('s_2050_1', 'handled', T('2026-10-06', '15:40'), { staff: 'moshe' }),
      ],
    },
  ]
}

let store: InquiryRecord[] | null = null
export const inquiries = () => (store ??= seed())

let nextRef = 2045
export const allocateRef = () => {
  const n = nextRef++
  return { id: `inq_${n}`, ref: `INQ-${n}` }
}

function dana(lang: MockLang): Person & { isYou: boolean; relation?: string } {
  return {
    id: 'mem_dana',
    name: lang === 'he' ? 'דנה כהן' : 'Dana Cohen',
    initials: lang === 'he' ? 'דכ' : 'DC',
    role: lang === 'he' ? 'בת' : 'Daughter',
    roleCode: 'other',
    photoUrl: null,
    isYou: true,
    relation: 'daughter',
  }
}

const authorOf = (a: Author, lang: MockLang) => (a === 'dana' ? dana(lang) : { ...person(a.staff, lang), isYou: false })
const nameOf = (a: Author, lang: MockLang) => authorOf(a, lang).name

export function toDetail(r: InquiryRecord, lang: MockLang): InquiryDetail {
  const timeline: TimelineEntry[] = r.timeline.map((e) =>
    e.type === 'message'
      ? { type: 'message', id: e.id, author: authorOf(e.author, lang), text: loc(e.text, lang), attachments: e.attachments, sentAt: e.sentAt }
      : { type: 'status', id: e.id, status: e.status, by: e.by ? nameOf(e.by, lang) : null, at: e.at },
  )
  return {
    ...toSummary(r, lang),
    version: r.version,
    closedAt: r.closedAt,
    closedBy: r.closedBy ? nameOf(r.closedBy, lang) : null,
    timeline,
  }
}

export function toSummary(r: InquiryRecord, lang: MockLang): InquirySummary {
  const messages = r.timeline.filter((e) => e.type === 'message')
  const last = messages.at(-1)
  const lastAt = r.timeline.at(-1)
  const author = last ? authorOf(last.author, lang) : dana(lang)
  return {
    id: r.id,
    ref: r.ref,
    subject: loc(r.subject, lang),
    department: r.department,
    status: r.status,
    createdAt: r.createdAt,
    lastMessageAt: (lastAt?.type === 'message' ? lastAt.sentAt : lastAt?.at) ?? r.createdAt,
    lastMessagePreview: {
      authorName: author.isYou ? author.name : author.name.replace(/^(Dr\.|ד״ר)\s+/, '').split(' ')[0]!,
      isYou: author.isYou,
      text: last ? loc(last.text, lang) : '',
    },
    hasUnreadReply: r.hasUnreadReply,
  }
}

/** Everything the search looks at, in the request language. */
export const searchableText = (r: InquiryRecord, lang: MockLang) =>
  [loc(r.subject, lang), ...r.timeline.map((e) => (e.type === 'message' ? loc(e.text, lang) : ''))].join(' ').toLowerCase()
