import type { DepartmentCode, Person, StaffRole } from '@/api/schemas/common'
import type { MockLang } from '../http'

export type L = { en: string; he: string }

type StaffFixture = {
  id: string
  name: L
  initials: L
  role: L
  roleCode: StaffRole
  department: DepartmentCode
}

export const STAFF = {
  ruth: {
    id: 'st_ruth',
    name: { en: 'Ruth Ben-David', he: 'רות בן דוד' },
    initials: { en: 'RB', he: 'רב' },
    role: { en: 'Head nurse, Ward B', he: 'אחות אחראית, מחלקה ב׳' },
    roleCode: 'head_nurse',
    department: 'nursing',
  },
  yael: {
    id: 'st_yael',
    name: { en: 'Yael Mizrahi', he: 'יעל מזרחי' },
    initials: { en: 'YM', he: 'ימ' },
    role: { en: 'Social worker, Ward B', he: 'עובדת סוציאלית, מחלקה ב׳' },
    roleCode: 'social_worker',
    department: 'social_work',
  },
  avi: {
    id: 'st_avi',
    name: { en: 'Dr. Avi Shapiro', he: 'ד״ר אבי שפירא' },
    initials: { en: 'AS', he: 'אש' },
    role: { en: 'Family physician', he: 'רופא משפחה' },
    roleCode: 'physician',
    department: 'doctor',
  },
  noa: {
    id: 'st_noa',
    name: { en: 'Noa Peretz', he: 'נועה פרץ' },
    initials: { en: 'NP', he: 'נפ' },
    role: { en: 'Physiotherapist', he: 'פיזיותרפיסטית' },
    roleCode: 'physiotherapist',
    department: 'physiotherapy',
  },
  shira: {
    id: 'st_shira',
    name: { en: 'Shira Katz', he: 'שירה כץ' },
    initials: { en: 'SK', he: 'שכ' },
    role: { en: 'Activities coordinator', he: 'רכזת פעילות' },
    roleCode: 'activities',
    department: 'activities',
  },
  moshe: {
    id: 'st_moshe',
    name: { en: 'Moshe Dahan', he: 'משה דהן' },
    initials: { en: 'MD', he: 'מד' },
    role: { en: 'Nurse, Ward D', he: 'אח, מחלקה ד׳' },
    roleCode: 'nurse',
    department: 'nursing',
  },
  michal: {
    id: 'st_michal',
    name: { en: 'Michal Avraham', he: 'מיכל אברהם' },
    initials: { en: 'MA', he: 'מא' },
    role: { en: 'Dietitian', he: 'דיאטנית' },
    roleCode: 'dietitian',
    department: 'nutrition',
  },
  oren: {
    id: 'st_oren',
    name: { en: 'Oren Levi', he: 'אורן לוי' },
    initials: { en: 'OL', he: 'אל' },
    role: { en: 'Finance office', he: 'מחלקת כספים' },
    roleCode: 'finance',
    department: 'finance',
  },
} satisfies Record<string, StaffFixture>

export type StaffKey = keyof typeof STAFF

export function person(key: StaffKey, lang: MockLang): Person {
  const s = STAFF[key]
  return {
    id: s.id,
    name: s.name[lang],
    initials: s.initials[lang],
    role: s.role[lang],
    roleCode: s.roleCode,
    photoUrl: null,
  }
}

export const staffContact = (key: StaffKey, lang: MockLang) => ({
  ...person(key, lang),
  department: STAFF[key].department,
})
