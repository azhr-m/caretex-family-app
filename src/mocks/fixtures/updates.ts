import type { UpdateCategory, UpdateDetail } from '@/api/schemas/resident'
import type { MockLang } from '../http'
import { at } from '../time'
import { photo } from './photos'
import { person, type L, type StaffKey } from './staff'

type UpdateFixture = {
  id: string
  author: StaffKey
  day: string
  time: string
  category: UpdateCategory
  isNew: boolean
  title: L
  excerpt: L
  body: L
  photos: { id: string; caption: L | null }[]
}

const MUSIC_BODY: L = {
  en: 'This morning Miriam joined the music group in the activity room for the first time. She sang along to "Yerushalayim Shel Zahav" and one more song, and asked our activities coordinator to save her a seat next week. She ate a full breakfast beforehand and was in good spirits all morning.',
  he: 'הבוקר מרים הצטרפה לראשונה לקבוצת המוזיקה בחדר הפעילות. היא שרה איתנו את "ירושלים של זהב" ושיר נוסף, וביקשה מרכזת הפעילות לשמור לה מקום בשבוע הבא. לפני כן אכלה ארוחת בוקר מלאה, והייתה במצב רוח טוב לאורך כל הבוקר.',
}

const MIRIAM: UpdateFixture[] = [
  {
    id: 'upd_music',
    author: 'ruth',
    day: '2026-10-12',
    time: '10:15',
    category: 'activities',
    isNew: true,
    title: { en: 'Miriam joined the morning music group', he: 'מרים הצטרפה לקבוצת המוזיקה של הבוקר' },
    excerpt: {
      en: 'She sang along to two songs and asked to join again next week. She also ate a full breakfast.',
      he: 'היא שרה איתנו שני שירים וביקשה להצטרף שוב בשבוע הבא. היא גם אכלה ארוחת בוקר מלאה.',
    },
    body: MUSIC_BODY,
    photos: [
      {
        id: 'ph_music_1',
        caption: {
          en: 'Miriam singing with the music group in the activity room',
          he: 'מרים שרה עם קבוצת המוזיקה בחדר הפעילות',
        },
      },
      {
        id: 'ph_music_2',
        caption: { en: 'The music group in the activity room', he: 'קבוצת המוזיקה בחדר הפעילות' },
      },
      { id: 'ph_music_3', caption: { en: 'Breakfast before the group', he: 'ארוחת הבוקר לפני הקבוצה' } },
    ],
  },
  {
    id: 'upd_walker',
    author: 'noa',
    day: '2026-10-09',
    time: '12:40',
    category: 'health',
    isNew: true,
    title: { en: 'A new walking record with the walker', he: 'שיא חדש בהליכה עם ההליכון' },
    excerpt: {
      en: 'Miriam walked 40 meters in the corridor with her walker and only one short rest. We will keep practicing twice a week.',
      he: 'מרים הלכה 40 מטר במסדרון עם ההליכון, עם מנוחה קצרה אחת בלבד. נמשיך לתרגל פעמיים בשבוע.',
    },
    body: {
      en: 'Miriam walked 40 meters in the corridor with her walker and only one short rest. That is 15 meters more than two weeks ago. We will keep practicing twice a week, and the caregivers will walk with her to the dining room when she feels up to it.',
      he: 'מרים הלכה 40 מטר במסדרון עם ההליכון, עם מנוחה קצרה אחת בלבד. זה 15 מטר יותר מלפני שבועיים. נמשיך לתרגל פעמיים בשבוע, והמטפלות ילוו אותה לחדר האוכל כשהיא תרגיש מוכנה.',
    },
    photos: [],
  },
  {
    id: 'upd_video',
    author: 'yael',
    day: '2026-10-07',
    time: '15:05',
    category: 'social',
    isNew: false,
    title: { en: 'Video call with her granddaughter', he: 'שיחת וידאו עם הנכדה' },
    excerpt: {
      en: 'We helped Miriam make a video call to Noam in Haifa. She was very happy and asked to do it every Wednesday.',
      he: 'עזרנו למרים לקיים שיחת וידאו עם נועם בחיפה. היא שמחה מאוד וביקשה לקבוע שיחה כזו בכל יום רביעי.',
    },
    body: {
      en: 'We helped Miriam make a video call to Noam in Haifa. She was very happy and asked to do it every Wednesday. We set up a weekly reminder for 17:00 on Wednesdays; let us know if another time works better for the family.',
      he: 'עזרנו למרים לקיים שיחת וידאו עם נועם בחיפה. היא שמחה מאוד וביקשה לקבוע שיחה כזו בכל יום רביעי. קבענו תזכורת שבועית לימי רביעי ב-17:00; עדכנו אותנו אם שעה אחרת נוחה יותר למשפחה.',
    },
    photos: [
      { id: 'ph_video_1', caption: { en: 'Miriam on the video call', he: 'מרים בשיחת הווידאו' } },
      { id: 'ph_video_2', caption: null },
    ],
  },
]

/** Older, routine updates so the list has a second page (infinite scroll). */
const ROUTINE: Omit<UpdateFixture, 'id' | 'day' | 'time' | 'isNew'>[] = [
  {
    author: 'shira',
    category: 'activities',
    title: { en: 'Afternoon baking group', he: 'קבוצת אפייה של אחר הצהריים' },
    excerpt: {
      en: 'Miriam helped shape the challah and shared her own recipe with the group.',
      he: 'מרים עזרה לקלוע את החלות ושיתפה את המתכון שלה עם הקבוצה.',
    },
    body: {
      en: 'Miriam helped shape the challah and shared her own recipe with the group. Everyone tasted the results at tea time.',
      he: 'מרים עזרה לקלוע את החלות ושיתפה את המתכון שלה עם הקבוצה. כולם טעמו מהתוצאות בשעת התה.',
    },
    photos: [{ id: 'ph_bake', caption: null }],
  },
  {
    author: 'ruth',
    category: 'daily_life',
    title: { en: 'A calm and pleasant week', he: 'שבוע רגוע ונעים' },
    excerpt: {
      en: 'Miriam slept well, ate all her meals and spent time in the garden most afternoons.',
      he: 'מרים ישנה היטב, אכלה את כל הארוחות ובילתה בגינה ברוב שעות אחר הצהריים.',
    },
    body: {
      en: 'Miriam slept well, ate all her meals and spent time in the garden most afternoons. No changes to her routine.',
      he: 'מרים ישנה היטב, אכלה את כל הארוחות ובילתה בגינה ברוב שעות אחר הצהריים. אין שינויים בשגרה שלה.',
    },
    photos: [],
  },
  {
    author: 'noa',
    category: 'health',
    title: { en: 'Physiotherapy progress', he: 'התקדמות בפיזיותרפיה' },
    excerpt: {
      en: 'Balance exercises are going well. Miriam is standing longer without support.',
      he: 'תרגילי שיווי המשקל מתקדמים יפה. מרים עומדת זמן רב יותר ללא תמיכה.',
    },
    body: {
      en: 'Balance exercises are going well. Miriam is standing longer without support, and she is more confident on the stairs with a caregiver.',
      he: 'תרגילי שיווי המשקל מתקדמים יפה. מרים עומדת זמן רב יותר ללא תמיכה, ובטוחה יותר במדרגות בליווי מטפלת.',
    },
    photos: [],
  },
  {
    author: 'yael',
    category: 'social',
    title: { en: 'Coffee with a new neighbor', he: 'קפה עם שכנה חדשה' },
    excerpt: {
      en: 'Miriam welcomed a new resident on her floor and they now sit together at lunch.',
      he: 'מרים קיבלה בברכה דיירת חדשה בקומה, ועכשיו הן יושבות יחד בארוחת הצהריים.',
    },
    body: {
      en: 'Miriam welcomed a new resident on her floor and they now sit together at lunch. It is lovely to see them chatting.',
      he: 'מרים קיבלה בברכה דיירת חדשה בקומה, ועכשיו הן יושבות יחד בארוחת הצהריים. מרגש לראות אותן משוחחות.',
    },
    photos: [
      { id: 'ph_coffee_1', caption: null },
      { id: 'ph_coffee_2', caption: null },
      { id: 'ph_coffee_3', caption: null },
    ],
  },
]

const AVRAHAM: UpdateFixture[] = [
  {
    id: 'upd_garden',
    author: 'moshe',
    day: '2026-10-05',
    time: '11:20',
    category: 'daily_life',
    isNew: false,
    title: { en: 'Morning in the garden', he: 'בוקר בגינה' },
    excerpt: {
      en: 'Avraham spent the morning in the garden and read the newspaper with a friend.',
      he: 'אברהם בילה את הבוקר בגינה וקרא עיתון עם חבר.',
    },
    body: {
      en: 'Avraham spent the morning in the garden and read the newspaper with a friend. He asked for the Hebrew crossword to be added to his weekly paper.',
      he: 'אברהם בילה את הבוקר בגינה וקרא עיתון עם חבר. הוא ביקש שנוסיף תשבץ בעברית לעיתון השבועי שלו.',
    },
    photos: [{ id: 'ph_garden', caption: { en: 'Avraham in the garden', he: 'אברהם בגינה' } }],
  },
]

function routineUpdates(): UpdateFixture[] {
  const out: UpdateFixture[] = []
  for (let i = 0; i < 21; i++) {
    const base = ROUTINE[i % ROUTINE.length]!
    const day = new Date(Date.UTC(2026, 9, 5 - i * 3)).toISOString().slice(0, 10)
    out.push({ ...base, id: `upd_r${i + 1}`, day, time: i % 2 ? '16:30' : '11:00', isNew: false })
  }
  return out.map((u) => ({ ...u, photos: u.photos.map((p) => ({ ...p, id: `${p.id}_${u.id}` })) }))
}

const BY_RESIDENT: Record<string, UpdateFixture[]> = {
  res_miriam: [...MIRIAM, ...routineUpdates()],
  res_avraham: AVRAHAM,
}

/** Updates marked seen this session (POST /updates/:id/seen). */
export const seenUpdates = new Set<string>()

function toDetail(u: UpdateFixture, lang: MockLang): UpdateDetail {
  const photos = u.photos.map((p) => photo(p.id, p.caption ? p.caption[lang] : null))
  return {
    id: u.id,
    title: u.title[lang],
    excerpt: u.excerpt[lang],
    body: u.body[lang],
    author: person(u.author, lang),
    publishedAt: at(u.day, u.time),
    sharedAt: at(u.day, u.time),
    category: u.category,
    photos,
    photoCount: photos.length,
    isNew: u.isNew && !seenUpdates.has(u.id),
    version: 1,
  }
}

export const updatesFor = (rid: string, lang: MockLang) => (BY_RESIDENT[rid] ?? []).map((u) => toDetail(u, lang))

export function findUpdate(id: string, lang: MockLang) {
  for (const [rid, list] of Object.entries(BY_RESIDENT)) {
    const u = list.find((x) => x.id === id)
    if (u) return { rid, update: toDetail(u, lang) }
  }
  return null
}

/** List shape: at most 2 photos; photoCount keeps the total. */
export const toSummary = ({ body: _b, sharedAt: _s, version: _v, ...u }: UpdateDetail) => ({
  ...u,
  photos: u.photos.slice(0, 2),
})
