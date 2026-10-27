import type { Answer, Question, SurveyDetail, SurveySummary } from '@/api/schemas/surveys'
import { appNow } from '@/lib/clock'
import type { MockLang } from '../http'
import type { L } from './staff'

type Opt = { id: string; label: L }
type Q =
  | { type: 'single' | 'dropdown'; options: Opt[] }
  | { type: 'multiple'; options: Opt[]; min?: number; max?: number }
  | { type: 'yes_no' }
  | { type: 'number'; min: number; max: number; minLabel: L; maxLabel: L }
  | { type: 'stars'; max: number; labels: L[] }
  | { type: 'satisfaction'; options: (Opt & { level: number })[] }
  | { type: 'text'; maxLength: number; placeholder: L | null }
  | { type: 'date'; minDate: string | null; maxDate: string | null; allowNone: boolean; noneLabel: L | null }

type QFixture = Q & {
  id: string
  required: boolean
  title: L
  help: L | null
  showIf: Question['showIf']
}

type SurveyFixture = {
  id: string
  title: L
  description: L
  anonymous: boolean
  estimatedMinutes: number
  closesAt: string
  questions: QFixture[]
}

const o = (id: string, en: string, he: string): Opt => ({ id, label: { en, he } })
const q = (f: Omit<QFixture, 'required' | 'help' | 'showIf'> & Partial<QFixture>): QFixture =>
  ({ required: true, help: null, showIf: null, ...f }) as QFixture

const FAMILY: SurveyFixture = {
  id: 'sv_family_2026',
  title: { en: 'Family satisfaction survey 2026', he: 'סקר שביעות רצון משפחות 2026' },
  description: {
    en: 'Once a year we ask families how we are doing. Your answers help us plan improvements for 2027.',
    he: 'פעם בשנה אנחנו שואלים את המשפחות איך אנחנו עושים את העבודה. התשובות יעזרו לנו לתכנן שיפורים לשנת 2027.',
  },
  anonymous: true,
  estimatedMinutes: 5,
  closesAt: '2026-10-31T23:59:00+02:00',
  questions: [
    q({
      id: 'q1',
      type: 'single',
      title: { en: 'How do you usually stay updated about Miriam?', he: 'איך אתם בדרך כלל מתעדכנים לגבי מרים?' },
      options: [
        o('app', 'The Family App', 'אפליקציית המשפחה'),
        o('phone', 'Phone calls with the staff', 'שיחות טלפון עם הצוות'),
        o('visits', 'During my visits', 'בזמן הביקורים'),
        o('family', 'Through other family members', 'דרך בני משפחה אחרים'),
      ],
    }),
    q({
      id: 'q2',
      type: 'multiple',
      min: 1,
      title: { en: 'Which services did you use this year?', he: 'באילו שירותים השתמשתם השנה?' },
      options: [
        o('inquiries', 'Contact Staff inquiries', 'פניות לצוות'),
        o('services', 'Service requests', 'בקשות שירות'),
        o('events', 'Family events', 'אירועים למשפחות'),
        o('documents', 'Documents and approvals', 'מסמכים ואישורים'),
        o('social', 'Social worker meetings', 'פגישות עם העובדת הסוציאלית'),
      ],
    }),
    q({
      id: 'q3',
      type: 'yes_no',
      title: {
        en: 'Does the staff reply to your inquiries within a reasonable time?',
        he: 'האם הצוות משיב לפניות שלכם בזמן סביר?',
      },
    }),
    q({
      id: 'q3a',
      type: 'text',
      required: false,
      maxLength: 500,
      placeholder: { en: 'Write your answer here…', he: 'כתבו כאן את התשובה…' },
      showIf: { questionId: 'q3', equals: false },
      title: { en: 'What can we improve?', he: 'מה אפשר לשפר?' },
    }),
    q({
      id: 'q4',
      type: 'number',
      min: 0,
      max: 10,
      minLabel: { en: 'Not likely', he: 'לא סביר' },
      maxLabel: { en: 'Very likely', he: 'סביר מאוד' },
      title: { en: 'How likely are you to recommend Beit Hadar to a friend?', he: 'עד כמה סביר שתמליצו על בית הדר לחברים?' },
    }),
    q({
      id: 'q5',
      type: 'stars',
      max: 5,
      labels: [
        { en: 'Very poor', he: 'גרוע מאוד' },
        { en: 'Poor', he: 'גרוע' },
        { en: 'Okay', he: 'סביר' },
        { en: 'Good', he: 'טוב' },
        { en: 'Excellent', he: 'מצוין' },
      ],
      title: { en: "How would you rate the cleanliness of Miriam's room?", he: 'איך הייתם מדרגים את הניקיון בחדר של מרים?' },
    }),
    q({
      id: 'q6',
      type: 'satisfaction',
      title: { en: 'How satisfied are you with the food Miriam receives?', he: 'עד כמה אתם מרוצים מהאוכל שמרים מקבלת?' },
      options: [
        { ...o('s1', 'Very dissatisfied', 'לא מרוצים בכלל'), level: 1 },
        { ...o('s2', 'Dissatisfied', 'לא מרוצים'), level: 2 },
        { ...o('s3', 'Neutral', 'ניטרלי'), level: 3 },
        { ...o('s4', 'Satisfied', 'מרוצים'), level: 4 },
        { ...o('s5', 'Very satisfied', 'מרוצים מאוד'), level: 5 },
      ],
    }),
    q({
      id: 'q7',
      type: 'text',
      required: false,
      maxLength: 500,
      placeholder: { en: 'Write your answer here…', he: 'כתבו כאן את התשובה…' },
      title: {
        en: 'Is there anything else you would like to tell the management?',
        he: 'יש עוד משהו שתרצו לספר להנהלה?',
      },
    }),
    q({
      id: 'q8',
      type: 'date',
      minDate: '2025-01-01',
      maxDate: '2026-10-14',
      allowNone: true,
      noneLabel: { en: "I haven't attended an event yet", he: 'עדיין לא השתתפתי באירוע' },
      title: {
        en: 'When did you last attend a family event at the center?',
        he: 'מתי השתתפתם לאחרונה באירוע משפחות במרכז?',
      },
    }),
    q({
      id: 'q9',
      type: 'dropdown',
      title: { en: 'How often do you visit Miriam?', he: 'באיזו תדירות אתם מבקרים את מרים?' },
      options: [
        o('weekly_many', 'Several times a week', 'כמה פעמים בשבוע'),
        o('weekly', 'Once a week', 'פעם בשבוע'),
        o('monthly_few', 'A few times a month', 'כמה פעמים בחודש'),
        o('monthly', 'Once a month or less', 'פעם בחודש או פחות'),
      ],
    }),
  ],
}

const HOLIDAYS: SurveyFixture = {
  id: 'sv_holidays',
  title: { en: 'Holiday activities feedback', he: 'משוב על פעילויות החגים' },
  description: {
    en: 'Tell us what you thought of the holiday activities, so we can plan next year.',
    he: 'ספרו לנו מה חשבתם על פעילויות החגים, כדי שנוכל לתכנן את השנה הבאה.',
  },
  anonymous: false,
  estimatedMinutes: 3,
  closesAt: '2026-10-20T23:59:00+03:00',
  questions: [
    q({
      id: 'h1',
      type: 'single',
      title: { en: 'Which holiday event did you attend?', he: 'באיזה אירוע חג השתתפתם?' },
      options: [o('rosh', 'Rosh Hashanah', 'ראש השנה'), o('sukkot', 'Sukkot', 'סוכות'), o('none', 'None', 'אף אחד')],
    }),
    q({ id: 'h2', type: 'yes_no', title: { en: 'Was the event time convenient?', he: 'האם שעת האירוע הייתה נוחה?' } }),
    q({
      id: 'h3',
      type: 'stars',
      max: 5,
      labels: [
        { en: 'Very poor', he: 'גרוע מאוד' },
        { en: 'Poor', he: 'גרוע' },
        { en: 'Okay', he: 'סביר' },
        { en: 'Good', he: 'טוב' },
        { en: 'Excellent', he: 'מצוין' },
      ],
      title: { en: 'How would you rate the decorations?', he: 'איך הייתם מדרגים את הקישוטים?' },
    }),
    q({
      id: 'h4',
      type: 'text',
      required: false,
      maxLength: 300,
      placeholder: null,
      title: { en: 'What did Miriam enjoy most?', he: 'ממה מרים נהנתה הכי הרבה?' },
    }),
    q({
      id: 'h5',
      type: 'single',
      title: { en: 'Would you join a holiday event next year?', he: 'האם תצטרפו לאירוע חג בשנה הבאה?' },
      options: [o('yes', 'Yes', 'כן'), o('maybe', 'Maybe', 'אולי'), o('no', 'No', 'לא')],
    }),
    q({
      id: 'h6',
      type: 'number',
      min: 0,
      max: 10,
      minLabel: { en: 'Not likely', he: 'לא סביר' },
      maxLabel: { en: 'Very likely', he: 'סביר מאוד' },
      title: { en: 'How likely are you to bring guests?', he: 'עד כמה סביר שתביאו אורחים?' },
    }),
  ],
}

const SPRING: SurveyFixture = {
  id: 'sv_spring',
  title: { en: 'Spring visiting hours survey', he: 'סקר שעות ביקור באביב' },
  description: { en: 'Help us choose the new visiting hours.', he: 'עזרו לנו לבחור את שעות הביקור החדשות.' },
  anonymous: true,
  estimatedMinutes: 2,
  closesAt: '2026-04-30T23:59:00+03:00',
  questions: [
    q({
      id: 'p1',
      type: 'single',
      title: { en: 'Which visiting hours suit you best?', he: 'אילו שעות ביקור מתאימות לכם?' },
      options: [o('morning', 'Mornings', 'בבקרים'), o('evening', 'Evenings', 'בערבים')],
    }),
    q({ id: 'p2', type: 'yes_no', title: { en: 'Do you visit on weekends?', he: 'האם אתם מבקרים בסופי שבוע?' } }),
  ],
}

const SURVEYS = [FAMILY, HOLIDAYS, SPRING]

type DraftRecord = { answers: Record<string, Answer>; currentQuestionId: string | null; savedAt: string }

/** Server-side state: drafts and submitted answers per survey (until reload). */
export const drafts = new Map<string, DraftRecord>([
  [
    'sv_holidays',
    {
      answers: { h1: 'rosh', h2: true, h3: 4, h4: 'The choir and the honey cake.' },
      currentQuestionId: 'h5',
      savedAt: '2026-10-12T20:15:00+03:00',
    },
  ],
])
export const submitted = new Map<string, { answers: Record<string, Answer>; submittedAt: string }>([
  ['sv_spring', { answers: { p1: 'evening', p2: true }, submittedAt: '2026-04-20T19:00:00+03:00' }],
])

export const findSurvey = (id: string) => SURVEYS.find((s) => s.id === id)

/** Mirrors the client rule: a question with `showIf` is visible only when the referenced answer equals the value. */
export const visibleQuestions = (s: SurveyFixture, answers: Record<string, Answer>) =>
  s.questions.filter((x) => !x.showIf || answers[x.showIf.questionId] === x.showIf.equals)

export const isAnswered = (a: Answer | undefined) =>
  a !== undefined && a !== null && a !== '' && !(Array.isArray(a) && a.length === 0)

export function summary(s: SurveyFixture, lang: MockLang): SurveySummary {
  const done = submitted.get(s.id)
  const draft = drafts.get(s.id)
  const answers = done?.answers ?? draft?.answers ?? {}
  const closed = Date.parse(s.closesAt) < appNow()
  return {
    id: s.id,
    title: s.title[lang],
    anonymous: s.anonymous,
    questionCount: s.questions.filter((x) => !x.showIf).length,
    estimatedMinutes: s.estimatedMinutes,
    closesAt: s.closesAt,
    status: done ? 'submitted' : closed ? 'closed' : draft ? 'draft' : 'not_started',
    answeredCount: visibleQuestions(s, answers).filter((x) => isAnswered(answers[x.id])).length,
  }
}

export function detail(s: SurveyFixture, lang: MockLang): SurveyDetail {
  const questions = s.questions.map((x, i): Question => {
    const common = {
      id: x.id,
      order: i + 1,
      required: x.required,
      title: x.title[lang],
      help: x.help ? x.help[lang] : null,
      showIf: x.showIf,
    }
    const opts = (list: Opt[]) => list.map((p) => ({ id: p.id, label: p.label[lang] }))
    switch (x.type) {
      case 'single':
      case 'dropdown':
        return { ...common, type: x.type, options: opts(x.options) }
      case 'multiple':
        return { ...common, type: 'multiple', options: opts(x.options), min: x.min, max: x.max }
      case 'yes_no':
        return { ...common, type: 'yes_no' }
      case 'number':
        return { ...common, type: 'number', min: x.min, max: x.max, minLabel: x.minLabel[lang], maxLabel: x.maxLabel[lang] }
      case 'stars':
        return { ...common, type: 'stars', max: x.max, labels: x.labels.map((l) => l[lang]) }
      case 'satisfaction':
        return {
          ...common,
          type: 'satisfaction',
          options: x.options.map((p) => ({ id: p.id, label: p.label[lang], level: p.level })),
        }
      case 'text':
        return { ...common, type: 'text', maxLength: x.maxLength, placeholder: x.placeholder ? x.placeholder[lang] : null }
      case 'date':
        return {
          ...common,
          type: 'date',
          minDate: x.minDate,
          maxDate: x.maxDate,
          allowNone: x.allowNone,
          noneLabel: x.noneLabel ? x.noneLabel[lang] : null,
        }
    }
  })
  return { ...summary(s, lang), description: s.description[lang], questions, version: 1 }
}

export const surveysFor = (state: 'active' | 'completed', lang: MockLang) =>
  SURVEYS.map((s) => summary(s, lang)).filter((s) =>
    state === 'active' ? s.status === 'not_started' || s.status === 'draft' : s.status === 'submitted' || s.status === 'closed',
  )

export type { SurveyFixture }
