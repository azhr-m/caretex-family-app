import type { DepartmentCode } from '@/api/schemas/common'
import type { DocumentDetail, DocumentStatus, DocumentSummary, DocumentType } from '@/api/schemas/documents'
import type { MockLang } from '../http'
import { departmentName } from './inquiries'
import { fixtureAttachment } from './files'
import type { L } from './staff'

type DocRecord = {
  id: string
  rid: string
  code: string
  title: L
  type: DocumentType
  department: DepartmentCode
  sentAt: string
  dueAt: string | null
  requiredAction: DocumentSummary['requiredAction']
  status: DocumentStatus
  completedAt: string | null
  confirmationCode: string | null
  paragraphs: L[]
  pages: number
  approveLabel: L | null
  version: number
}

const T = (d: string, hm = '09:00') => `${d}T${hm}:00+03:00`

const FLU: L[] = [
  {
    en: 'The Ministry of Health recommends a yearly flu vaccine for adults over 65. The vaccination day at Beit Hadar will take place on 20.10.2026 at 09:00 and will be given by the ward nurses.',
    he: 'משרד הבריאות ממליץ על חיסון שפעת שנתי לבני 65 ומעלה. יום החיסונים בבית הדר יתקיים ב-20.10.2026 בשעה 09:00, והחיסון יינתן על ידי אחיות המחלקה.',
  },
  {
    en: 'Common side effects are mild: soreness at the injection site, slight fever or tiredness for one to two days. The staff will monitor Miriam for 30 minutes after the vaccine.',
    he: 'תופעות הלוואי השכיחות קלות: כאב במקום הזריקה, חום קל או עייפות למשך יום או יומיים. הצוות ישגיח על מרים במשך 30 דקות לאחר החיסון.',
  },
  {
    en: 'By signing, you consent to Miriam Levi receiving the 2026 seasonal flu vaccine.',
    he: 'בחתימתך את מאשרת שמרים לוי תקבל את חיסון השפעת העונתי לשנת 2026.',
  },
]

const VISITING: L[] = [
  {
    en: 'From 01.11.2026, visiting hours are 09:00–20:00 every day. Quiet hours are 14:00–16:00, when visits take place in the lobby or garden only.',
    he: 'החל מ-01.11.2026 שעות הביקור הן 09:00–20:00 בכל יום. שעות המנוחה הן 14:00–16:00, ובהן הביקורים מתקיימים רק בלובי או בגן.',
  },
  {
    en: 'Please sign in at reception on every visit. Children under 12 must be accompanied by an adult at all times.',
    he: 'נא להירשם בקבלה בכל ביקור. ילדים מתחת לגיל 12 חייבים להיות בליווי מבוגר בכל עת.',
  },
]

const OUTING: L[] = [
  {
    en: 'A group of 8 residents will visit the Tel Aviv Museum of Art on 26.10.2026, leaving at 09:30 and returning by 13:30, in an accessible minibus.',
    he: 'קבוצה של 8 דיירים תבקר במוזיאון תל אביב לאמנות ב-26.10.2026. היציאה ב-09:30 והחזרה עד 13:30, במיניבוס נגיש.',
  },
  {
    en: 'Two caregivers and a nurse will accompany the group. Miriam will take her walker and her usual medications. There is no cost to the family.',
    he: 'שתי מטפלות ואחות ילוו את הקבוצה. מרים תיקח את ההליכון ואת התרופות הקבועות שלה. אין עלות למשפחה.',
  },
]

const SHORT = (en: string, he: string): L[] => [{ en, he }]

function seed(): DocRecord[] {
  const doc = (d: Omit<DocRecord, 'version' | 'pages' | 'approveLabel' | 'confirmationCode'> & Partial<DocRecord>): DocRecord => ({
    version: 1,
    pages: 1,
    approveLabel: null,
    confirmationCode: null,
    ...d,
  })
  return [
    doc({
      id: 'doc_flu',
      rid: 'res_miriam',
      code: 'NUR-FLU-2026',
      title: { en: 'Flu vaccine consent form 2026', he: 'טופס הסכמה לחיסון שפעת 2026' },
      type: 'consent',
      department: 'nursing',
      sentAt: T('2026-10-13', '09:05'),
      dueAt: T('2026-10-15', '23:59'),
      requiredAction: 'sign',
      status: 'pending',
      completedAt: null,
      paragraphs: FLU,
      pages: 2,
    }),
    doc({
      id: 'doc_outing',
      rid: 'res_miriam',
      code: 'ACT-OUT-2610',
      title: { en: 'Outing approval: Tel Aviv Museum of Art', he: 'אישור יציאה: מוזיאון תל אביב לאמנות' },
      type: 'approval',
      department: 'activities',
      sentAt: T('2026-10-12', '11:00'),
      dueAt: T('2026-10-20', '23:59'),
      requiredAction: 'approve',
      status: 'pending',
      completedAt: null,
      paragraphs: OUTING,
      approveLabel: { en: 'Approve outing', he: 'אישור היציאה' },
    }),
    doc({
      id: 'doc_visiting',
      rid: 'res_miriam',
      code: 'MGT-VIS-1026',
      title: { en: 'Updated visiting policy', he: 'נוהל ביקורים מעודכן' },
      type: 'policy',
      department: 'management',
      sentAt: T('2026-10-11', '10:00'),
      dueAt: T('2026-10-13', '23:59'),
      requiredAction: 'confirm_read',
      status: 'overdue',
      completedAt: null,
      paragraphs: VISITING,
    }),
    doc({
      id: 'doc_addendum',
      rid: 'res_miriam',
      code: 'FIN-ADD-1026',
      title: { en: 'Admission agreement addendum', he: 'נספח להסכם הקבלה' },
      type: 'agreement',
      department: 'finance',
      sentAt: T('2026-10-08', '12:00'),
      dueAt: null,
      requiredAction: null,
      status: 'signed',
      completedAt: T('2026-10-10', '18:34'),
      confirmationCode: 'SIG-77105',
      paragraphs: SHORT(
        'This addendum updates the monthly fee schedule from 01.11.2026. All other terms of the admission agreement stay the same.',
        'נספח זה מעדכן את לוח התשלומים החודשי החל מ-01.11.2026. שאר תנאי הסכם הקבלה נשארים ללא שינוי.',
      ),
    }),
    doc({
      id: 'doc_photo',
      rid: 'res_miriam',
      code: 'MGT-PHO-2026',
      title: { en: 'Photo consent for the family app', he: 'הסכמה לצילום באפליקציית המשפחה' },
      type: 'consent',
      department: 'management',
      sentAt: T('2026-08-02', '10:00'),
      dueAt: null,
      requiredAction: null,
      status: 'signed',
      completedAt: T('2026-08-03', '20:12'),
      confirmationCode: 'SIG-61420',
      paragraphs: SHORT(
        'The care center may share photos of Miriam with her linked family members in the app.',
        'המרכז הסיעודי רשאי לשתף תמונות של מרים עם בני המשפחה המקושרים באפליקציה.',
      ),
    }),
    doc({
      id: 'doc_menu',
      rid: 'res_miriam',
      code: 'NUT-MEN-0926',
      title: { en: 'Autumn menu and allergy policy', he: 'תפריט הסתיו ונוהל אלרגיות' },
      type: 'policy',
      department: 'nutrition',
      sentAt: T('2026-09-01', '08:00'),
      dueAt: null,
      requiredAction: null,
      status: 'read_confirmed',
      completedAt: T('2026-09-02', '19:40'),
      paragraphs: SHORT(
        'The autumn menu starts on 15.09.2026. Residents with allergies receive a separate tray marked with their name.',
        'תפריט הסתיו מתחיל ב-15.09.2026. דיירים עם אלרגיות מקבלים מגש נפרד המסומן בשמם.',
      ),
    }),
    doc({
      id: 'doc_2025',
      rid: 'res_miriam',
      code: 'FIN-AGR-2025',
      title: { en: 'Admission agreement 2025', he: 'הסכם קבלה 2025' },
      type: 'agreement',
      department: 'finance',
      sentAt: T('2025-06-10', '10:00'),
      dueAt: null,
      requiredAction: null,
      status: 'signed',
      completedAt: T('2025-06-12', '17:05'),
      confirmationCode: 'SIG-30988',
      paragraphs: SHORT('The admission agreement for 2025.', 'הסכם הקבלה לשנת 2025.'),
    }),
    doc({
      id: 'doc_av_policy',
      rid: 'res_avraham',
      code: 'MGT-VIS-1026',
      title: { en: 'Updated visiting policy', he: 'נוהל ביקורים מעודכן' },
      type: 'policy',
      department: 'management',
      sentAt: T('2026-10-11', '10:00'),
      dueAt: T('2026-10-25', '23:59'),
      requiredAction: 'confirm_read',
      status: 'pending',
      completedAt: null,
      paragraphs: VISITING,
    }),
  ]
}

let store: DocRecord[] | null = null
export const documents = () => (store ??= seed())

export const DONE: DocumentStatus[] = ['signed', 'approved', 'declined', 'read_confirmed']
export const tabOf = (d: DocRecord) =>
  DONE.includes(d.status) ? 'done' : d.requiredAction === 'confirm_read' ? 'confirm' : 'sign'

export function toSummary(d: DocRecord, lang: MockLang): DocumentSummary {
  return {
    id: d.id,
    code: d.code,
    title: d.title[lang],
    type: d.type,
    from: { department: d.department, name: departmentName(d.department, lang) },
    sentAt: d.sentAt,
    dueAt: d.dueAt,
    requiredAction: DONE.includes(d.status) ? null : d.requiredAction,
    status: d.status,
    completedAt: d.completedAt,
  }
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export function toDetail(d: DocRecord, lang: MockLang, residentName: string): DocumentDetail {
  const file = fixtureAttachment(`file_${d.id}`, `${d.code}.pdf`, 'application/pdf', 180_000)
  const dana = lang === 'he' ? 'דנה כהן' : 'Dana Cohen'
  return {
    ...toSummary(d, lang),
    version: d.version,
    pages: d.pages,
    fileUrl: file.url,
    previewHtml: d.paragraphs.map((p) => `<p>${esc(p[lang])}</p>`).join(''),
    signatureConsentText:
      d.requiredAction === 'sign'
        ? lang === 'he'
          ? `אני, ${dana}, מאשרת שאני מורשית לחתום בשם ${residentName}.`
          : `I, ${dana}, confirm that I am authorized to sign on behalf of ${residentName}.`
        : null,
    approveLabel: d.approveLabel ? d.approveLabel[lang] : null,
    completion: d.completedAt
      ? {
          by: lang === 'he' ? 'דנה כהן, בת' : 'Dana Cohen, daughter',
          at: d.completedAt,
          confirmationCode: d.confirmationCode ?? '',
        }
      : null,
  }
}

export type { DocRecord }
