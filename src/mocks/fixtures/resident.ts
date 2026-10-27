import type { CarePlan, Medical, Permissions, Resident, ScheduleItem } from '@/api/schemas/resident'
import type { MockLang } from '../http'
import { at } from '../time'
import { memberFixture } from './member'
import { staffContact, type L } from './staff'

const ALLOWED: Omit<Permissions, 'notes' | 'updatedAt'> = {
  general: 'allowed',
  updates: 'allowed',
  medical: 'allowed',
  carePlan: 'allowed',
  schedule: 'allowed',
  documents: 'allowed',
  inquiries: 'allowed',
  serviceRequests: 'allowed',
  billing: 'allowed',
}

export function permissionsFixture(rid: string, lang: MockLang): Permissions {
  if (rid === 'res_avraham') {
    return {
      ...ALLOWED,
      medical: 'not_shared',
      carePlan: 'denied',
      notes: {
        carePlan:
          lang === 'he'
            ? 'תוכנית הטיפול של אברהם משותפת רק עם האפוטרופוס החוקי שלו.'
            : "Avraham's care plan is shared only with his legal guardian.",
      },
      updatedAt: '2026-09-01T10:00:00+03:00',
    }
  }
  return { ...ALLOWED, notes: {}, updatedAt: '2026-09-01T10:00:00+03:00' }
}

const DETAILS: Record<
  string,
  { dateOfBirth: string; admittedOn: string; languages: L[]; ward: L; wardPhone: string }
> = {
  res_miriam: {
    dateOfBirth: '1939-05-03',
    admittedOn: '2023-06-21',
    languages: [
      { en: 'Hebrew', he: 'עברית' },
      { en: 'Romanian', he: 'רומנית' },
    ],
    ward: { en: 'Ward B', he: 'מחלקה ב׳' },
    wardPhone: '+97235550142',
  },
  res_avraham: {
    dateOfBirth: '1934-11-20',
    admittedOn: '2025-02-10',
    languages: [
      { en: 'Hebrew', he: 'עברית' },
      { en: 'Yiddish', he: 'יידיש' },
    ],
    ward: { en: 'Ward D', he: 'מחלקה ד׳' },
    wardPhone: '+97235550144',
  },
}

export function residentFixture(rid: string, lang: MockLang): Resident | null {
  const linked = memberFixture(lang).residents.find((r) => r.id === rid)
  const d = DETAILS[rid]
  if (!linked || !d) return null
  const dana = lang === 'he' ? 'דנה כהן' : 'Dana Cohen'
  return {
    id: rid,
    name: linked.name,
    initials: linked.initials,
    photoUrl: linked.photoUrl,
    dateOfBirth: d.dateOfBirth,
    ward: linked.ward,
    room: linked.room,
    admittedOn: d.admittedOn,
    languages: d.languages.map((l) => l[lang]),
    primaryFamilyContact: linked.isPrimaryContact
      ? { name: dana, isYou: true }
      : { name: lang === 'he' ? 'יוסי כהן' : 'Yossi Cohen', isYou: false },
    staffContacts:
      rid === 'res_miriam'
        ? [staffContact('ruth', lang), staffContact('yael', lang), staffContact('avi', lang)]
        : [staffContact('moshe', lang), staffContact('yael', lang), staffContact('avi', lang)],
    wardPhone: {
      label: lang === 'he' ? `עמדת אחיות ${d.ward.he}` : `${d.ward.en} nurses' station`,
      phone: d.wardPhone,
    },
    permissions: permissionsFixture(rid, lang),
    version: 3,
  }
}

const mi = (id: string, name: L, detail: L, sharedAt: string, flag: 'allergy' | null = null) => ({
  id,
  name,
  detail,
  sharedAt,
  flag,
})

const MIRIAM_MEDICAL = [
  {
    code: 'medications',
    items: [
      mi(
        'med_1',
        { en: 'Eltroxin 50 mcg', he: 'אלטרוקסין 50 מק״ג' },
        { en: 'Once a day, 07:00, before breakfast', he: 'פעם ביום, 07:00, לפני ארוחת הבוקר' },
        '2026-10-05',
      ),
      mi(
        'med_2',
        { en: 'Amlodipine 5 mg', he: 'אמלודיפין 5 מ״ג' },
        { en: 'Once a day, 08:30, with breakfast', he: 'פעם ביום, 08:30, עם ארוחת הבוקר' },
        '2026-10-05',
      ),
      mi(
        'med_3',
        { en: 'Vitamin D 1,000 IU', he: 'ויטמין D 1,000 יחב״ל' },
        { en: 'Once a day, with lunch', he: 'פעם ביום, עם ארוחת הצהריים' },
        '2026-10-05',
      ),
    ],
  },
  {
    code: 'diagnoses',
    items: [
      mi(
        'dx_1',
        { en: 'Hypertension', he: 'יתר לחץ דם' },
        { en: 'Stable with medication', he: 'מאוזן בטיפול תרופתי' },
        '2023-06-21',
      ),
      mi(
        'dx_2',
        { en: 'Hypothyroidism', he: 'תת-פעילות של בלוטת התריס' },
        { en: 'Balanced, checked every 6 months', he: 'מאוזנת, נבדקת כל 6 חודשים' },
        '2023-06-21',
      ),
      mi(
        'dx_3',
        { en: 'Mild knee osteoarthritis', he: 'שחיקת סחוס קלה בברכיים' },
        { en: 'Managed with physiotherapy', he: 'מטופלת בפיזיותרפיה' },
        '2025-02-14',
      ),
    ],
  },
  {
    code: 'allergies',
    items: [
      mi(
        'al_1',
        { en: 'Penicillin', he: 'פניצילין' },
        {
          en: 'Skin rash. Staff are aware and it is marked in her file.',
          he: 'פריחה בעור. הצוות מודע והדבר מסומן בתיק.',
        },
        '2023-06-21',
        'allergy',
      ),
      mi(
        'al_2',
        { en: 'Lactose sensitivity', he: 'רגישות ללקטוז' },
        { en: 'Gets lactose-free dairy at all meals', he: 'מקבלת מוצרי חלב ללא לקטוז בכל הארוחות' },
        '2023-06-21',
      ),
    ],
  },
  {
    code: 'doctor_visits',
    items: [
      mi(
        'dv_1',
        { en: 'Routine check · Dr. Avi Shapiro', he: 'בדיקה שגרתית · ד״ר אבי שפירא' },
        {
          en: 'Blood pressure normal. No changes to treatment. Next visit 16.10.2026.',
          he: 'לחץ הדם תקין. אין שינוי בטיפול. ביקור הבא 16.10.2026.',
        },
        '2026-10-05',
      ),
    ],
  },
  {
    code: 'tests',
    items: [
      mi(
        'ts_1',
        { en: 'Complete blood count · 01.10.2026', he: 'ספירת דם מלאה · 01.10.2026' },
        { en: 'All values within the normal range', he: 'כל הערכים בטווח התקין' },
        '2026-10-03',
      ),
    ],
  },
  {
    code: 'nutrition',
    items: [
      mi(
        'nu_1',
        { en: 'Soft diet, lactose-free', he: 'תזונה רכה, ללא לקטוז' },
        {
          en: '1.5 liters of fluids a day. Weight stable at 61 kg.',
          he: '1.5 ליטר נוזלים ביום. המשקל יציב, 61 ק״ג.',
        },
        '2026-10-01',
      ),
    ],
  },
  {
    code: 'physiotherapy',
    items: [
      mi(
        'pt_1',
        { en: 'Walker training, twice a week', he: 'אימון הליכה עם הליכון, פעמיים בשבוע' },
        { en: 'Goal: walk to the dining room on her own', he: 'יעד: להגיע לחדר האוכל באופן עצמאי' },
        '2026-10-09',
      ),
    ],
  },
] as const

export function medicalFixture(rid: string, lang: MockLang, empty: boolean): Medical {
  if (rid === 'res_avraham') return { state: 'not_shared' }
  return {
    state: 'ok',
    categories: empty
      ? []
      : MIRIAM_MEDICAL.map((c) => ({
          code: c.code,
          items: c.items.map((i) => ({
            id: i.id,
            name: i.name[lang],
            detail: i.detail[lang],
            flag: i.flag,
            sharedAt: `${i.sharedAt}T10:00:00+03:00`,
          })),
        })),
  }
}

const GOALS = [
  {
    id: 'goal_walk',
    icon: 'footprints',
    status: 'on_track',
    title: { en: 'Keep walking on her own with a walker', he: 'להמשיך ללכת באופן עצמאי עם הליכון' },
    teamActions: {
      en: 'Physiotherapy twice a week and a daily walk with a caregiver.',
      he: 'פיזיותרפיה פעמיים בשבוע והליכה יומית עם מטפלת.',
    },
    familyActions: {
      en: 'Walk with her in the corridor during visits and bring comfortable, closed shoes.',
      he: 'צאו איתה להליכה במסדרון בזמן הביקור והביאו נעליים סגורות ונוחות.',
    },
  },
  {
    id: 'goal_social',
    icon: 'users',
    status: 'achieved',
    title: { en: 'Stay socially active', he: 'לשמור על פעילות חברתית' },
    teamActions: {
      en: 'Daily group activities and seating next to friends at meals.',
      he: 'פעילות קבוצתית יומית וישיבה ליד חברות בארוחות.',
    },
    familyActions: {
      en: 'Join a Wednesday video call and share family photos.',
      he: 'הצטרפו לשיחת וידאו ביום רביעי ושתפו תמונות משפחתיות.',
    },
  },
  {
    id: 'goal_weight',
    icon: 'scale',
    status: 'monitoring',
    title: { en: 'Maintain a healthy weight', he: 'לשמור על משקל תקין' },
    teamActions: {
      en: 'Weekly weigh-in and a menu adjusted by the dietitian.',
      he: 'שקילה שבועית ותפריט מותאם על ידי הדיאטנית.',
    },
    familyActions: {
      en: 'Check with the nurses before bringing food from home.',
      he: 'התייעצו עם האחיות לפני שאתם מביאים אוכל מהבית.',
    },
  },
] as const

/** Avraham's care plan is denied (403) by the handler before this is reached. */
export function carePlanFixture(lang: MockLang): CarePlan {
  return {
    state: 'ok',
    reviewedOn: '2026-09-01',
    nextReviewOn: '2026-12-01',
    goals: GOALS.map((g) => ({
      id: g.id,
      icon: g.icon,
      status: g.status,
      title: g.title[lang],
      teamActions: g.teamActions[lang],
      familyActions: g.familyActions[lang],
    })),
  }
}

type DayRow = [time: string, kind: ScheduleItem['kind'], title: L, place: L, today: ScheduleItem['status']]

const room = (n: number): L => ({ en: `Room ${n}`, he: `חדר ${n}` })
const dining = (ward: L): L => ({ en: `${ward.en} dining room`, he: `חדר האוכל, ${ward.he}` })

function dayRows(rid: string): DayRow[] {
  const ward = DETAILS[rid]?.ward ?? { en: 'Ward', he: 'מחלקה' }
  const own = rid === 'res_avraham' ? room(4) : room(12)
  return [
    ['07:30', 'care', { en: 'Wake up and morning care', he: 'השכמה וטיפול בוקר' }, own, 'done'],
    ['08:30', 'meal', { en: 'Breakfast', he: 'ארוחת בוקר' }, dining(ward), 'done'],
    [
      '10:00',
      'activity',
      { en: 'Activity: Music group', he: 'פעילות: קבוצת מוזיקה' },
      { en: 'Activity room', he: 'חדר הפעילות' },
      'now',
    ],
    [
      '11:30',
      'therapy',
      { en: 'Physiotherapy', he: 'פיזיותרפיה' },
      { en: 'Physiotherapy room', he: 'חדר פיזיותרפיה' },
      'upcoming',
    ],
    ['13:00', 'meal', { en: 'Lunch', he: 'ארוחת צהריים' }, dining(ward), 'upcoming'],
    ['14:00', 'rest', { en: 'Afternoon rest', he: 'מנוחת צהריים' }, own, 'upcoming'],
    [
      '16:00',
      'social',
      { en: 'Social activity: Tea and cards', he: 'פעילות חברתית: תה ומשחק קלפים' },
      { en: 'Garden lounge', he: 'פינת הגן' },
      'upcoming',
    ],
    ['18:00', 'meal', { en: 'Dinner', he: 'ארוחת ערב' }, dining(ward), 'upcoming'],
  ]
}

/** Same daily routine every day; past days are done, future days upcoming, today as designed. */
export function scheduleItems(rid: string, day: string, today: string, lang: MockLang): ScheduleItem[] {
  return dayRows(rid).map(([time, kind, title, place, todayStatus], i) => ({
    id: `sch_${rid}_${day}_${i}`,
    startsAt: at(day, time),
    endsAt: null,
    title: title[lang],
    place: place[lang],
    kind,
    status: day < today ? 'done' : day > today ? 'upcoming' : todayStatus,
  }))
}

export function scheduleFixture(rid: string, day: string, today: string, lang: MockLang) {
  const ward = DETAILS[rid]?.ward ?? { en: 'Ward', he: 'מחלקה' }
  return {
    date: day,
    lastUpdatedAt: at(day <= today ? day : today, '09:30'),
    lastUpdatedBy: lang === 'he' ? `צוות ${ward.he}` : `${ward.en} staff`,
    items: scheduleItems(rid, day, today, lang),
  }
}
