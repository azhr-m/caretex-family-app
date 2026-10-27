import type { CalendarItemSummary } from '@/api/schemas/calendar'
import type { AttentionItem, SinceLastVisit } from '@/api/schemas/dashboard'
import type { MockLang } from '../http'
import { mockToday } from '../time'
import { memberFixture } from './member'
import { scheduleItems } from './resident'
import { toSummary, updatesFor } from './updates'

const link = (type: AttentionItem['link']['type'], id: string, residentId: string | null) => ({
  type,
  id,
  residentId,
})

export const PREVIOUS_VISIT: Record<string, string | null> = {
  res_miriam: '2026-10-08T18:00:00+03:00',
  res_avraham: '2026-10-11T19:30:00+03:00',
}

function sinceMiriam(lang: MockLang, rid: string): SinceLastVisit['items'] {
  const he = lang === 'he'
  return [
    {
      id: 'slv_1',
      kind: 'update',
      title: he ? 'מרים הצטרפה לקבוצת המוזיקה של הבוקר' : 'Miriam joined the morning music group',
      occurredAt: '2026-10-12T10:15:00+03:00',
      actor: he ? 'רות בן דוד' : 'Ruth Ben-David',
      link: link('update', 'upd_music', rid),
    },
    {
      id: 'slv_2',
      kind: 'inquiry_reply',
      title: he ? 'הסיעוד השיב לפנייה "שעת התרופות בערב"' : 'Nursing replied to "Evening medication time"',
      occurredAt: '2026-10-13T16:20:00+03:00',
      actor: null,
      link: link('inquiry', 'inq_2038', rid),
    },
    {
      id: 'slv_3',
      kind: 'document',
      title: he ? 'טופס הסכמה לחיסון שפעת 2026' : 'Flu vaccine consent form 2026',
      occurredAt: '2026-10-13T09:05:00+03:00',
      actor: null,
      link: link('document', 'doc_flu', rid),
    },
    {
      id: 'slv_4',
      kind: 'calendar_change',
      title: he ? 'ביקור ד״ר שפירא הוזז ל-16.10.2026 11:00' : "Dr. Shapiro's visit moved to 16.10.2026 11:00",
      occurredAt: '2026-10-11T14:40:00+03:00',
      actor: null,
      link: link('calendar_item', 'cal_dr_shapiro', rid),
    },
    {
      id: 'slv_5',
      kind: 'request_handled',
      title: he ? 'דלת הארון בחדר 12 תוקנה' : 'Wardrobe door in Room 12 was repaired',
      occurredAt: '2026-10-10T12:10:00+03:00',
      actor: null,
      link: link('service_request', 'sr_1190', rid),
    },
  ]
}

function attentionMiriam(lang: MockLang, rid: string): AttentionItem[] {
  const he = lang === 'he'
  return [
    {
      id: 'att_1',
      kind: 'sign_document',
      title: he ? 'חתימה: טופס הסכמה לחיסון שפעת' : 'Sign: Flu vaccine consent form',
      subtitle: he ? 'מצוות הסיעוד · עד 15.10.2026' : 'From the nursing team · Due by 15.10.2026',
      dueAt: '2026-10-15T23:59:00+03:00',
      status: 'to_sign',
      link: link('document', 'doc_flu', rid),
    },
    {
      id: 'att_2',
      kind: 'confirm_read',
      title: he ? 'אישור קריאה: עלון המשפחות לאוקטובר' : 'Confirm you read: October family newsletter',
      subtitle: he ? 'הנהלה · פורסם 12.10.2026' : 'Management · Published 12.10.2026',
      dueAt: null,
      status: 'to_confirm',
      link: link('feed_item', 'nl_october', null),
    },
    {
      id: 'att_3',
      kind: 'survey',
      title: he ? 'מילוי: סקר שביעות רצון משפחות 2026' : 'Fill out: Family satisfaction survey 2026',
      subtitle: he ? 'כ-5 דקות · נסגר ב-31.10.2026' : 'About 5 minutes · Closes 31.10.2026',
      dueAt: '2026-10-31T23:59:00+02:00',
      status: 'not_started',
      link: link('survey', 'sv_family_2026', rid),
    },
    {
      id: 'att_4',
      kind: 'rsvp',
      title: he ? 'אישור הגעה: ערב חנוכה למשפחות' : 'RSVP: Hanukkah family evening',
      subtitle: he ? 'יום ה׳ 10.12.2026 17:00 · חצר המרכז' : 'Thu 10.12.2026 17:00 · Center courtyard',
      dueAt: null,
      status: 'awaiting_rsvp',
      link: link('event', 'ev_hanukkah', null),
    },
    {
      id: 'att_5',
      kind: 'inquiry_reply_needed',
      title: he ? 'נדרשת תשובה: בגדי חורף למרים' : 'Reply needed: Winter clothing for Miriam',
      subtitle: he ? 'יעל מזרחי, עבודה סוציאלית · 13.10.2026' : 'Yael Mizrahi, Social work · 13.10.2026',
      dueAt: null,
      status: 'waiting_for_you',
      link: link('inquiry', 'inq_2041', rid),
    },
  ]
}

function upcomingMiriam(lang: MockLang): CalendarItemSummary {
  const he = lang === 'he'
  return {
    id: 'cal_dr_shapiro',
    kind: 'personal',
    category: 'doctor',
    title: he ? 'ביקור רופא · ד״ר אבי שפירא' : 'Doctor visit · Dr. Avi Shapiro',
    startsAt: '2026-10-16T11:00:00+03:00',
    endsAt: '2026-10-16T11:30:00+03:00',
    allDay: false,
    location: he ? 'מרפאת מחלקה ב׳, קומה 1' : 'Ward B clinic, 1st floor',
    requiresConfirmation: true,
    confirmation: 'pending',
    rsvp: null,
    eventId: null,
    changed: { from: '2026-10-15T10:00:00+03:00', at: '2026-10-11T14:40:00+03:00' },
  }
}

export function dashboardFixture(rid: string, lang: MockLang, empty: boolean) {
  const member = memberFixture(lang)
  const isMiriam = rid === 'res_miriam'
  const updates = empty ? [] : updatesFor(rid, lang)
  const newUpdates = updates.filter((u) => u.isNew).length
  const today = mockToday()
  // Around "now", as in the design: breakfast → social activity, skipping the afternoon rest.
  const day = scheduleItems(rid, today, today, lang)
  return {
    greetingName: member.firstName,
    sinceLastVisit: {
      since: PREVIOUS_VISIT[rid] ?? null,
      items: isMiriam && !empty ? sinceMiriam(lang, rid) : [],
    },
    attention: isMiriam && !empty ? attentionMiriam(lang, rid) : [],
    latestUpdate: updates[0] ? toSummary(updates[0]) : null,
    upcoming: isMiriam && !empty ? upcomingMiriam(lang) : null,
    dayPreview: empty ? [] : [1, 2, 3, 4, 6].map((i) => day[i]!),
    counts: {
      notificationsUnread: empty ? 0 : 5,
      tabs: {
        resident: newUpdates,
        staff: isMiriam && !empty ? 2 : 0,
        calendar: isMiriam && !empty ? 1 : 0,
        more: isMiriam && !empty ? 3 : 0,
      },
      documentsPending: isMiriam && !empty ? 2 : 0,
      invitationsPending: isMiriam && !empty ? 1 : 0,
    },
  }
}
