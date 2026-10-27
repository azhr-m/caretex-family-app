import { HttpResponse, http } from 'msw'
import type { Answer } from '@/api/schemas/surveys'
import { appNow } from '@/lib/clock'
import { eventDeadline, eventMaxGuests, rsvps } from '../fixtures/calendar'
import { documents, tabOf, toDetail as docDetail, toSummary as docSummary } from '../fixtures/documents'
import { feedList, findFeed, readConfirmations, toDetail as feedDetail } from '../fixtures/feed'
import { memberFixture } from '../fixtures/member'
import { detail, drafts, findSurvey, isAnswered, submitted, surveysFor, visibleQuestions } from '../fixtures/surveys'
import { apiError, authed, langOf, url } from '../http'
import { currentScenario } from '../scenarios'
import { guard, sectionGate } from './residents'

const PAGE_SIZE = 20
const nowIso = () => new Date(appNow()).toISOString()
const body = async <T>(request: Request) => ((await request.json().catch(() => ({}))) ?? {}) as Partial<T>
const code = (prefix: string) => `${prefix}-${String(Math.floor(10000 + Math.random() * 89999))}`
const empty = () => currentScenario() === 'emptyEverything'
const unauth = () => apiError(401, 'TOKEN_EXPIRED', 'Access token expired')

const findDoc = (id: string) => documents().find((d) => d.id === id)

export const moreHandlers = [
  http.get(url('/residents/:rid/documents'), ({ request, params }) => {
    const rid = String(params.rid)
    const lang = langOf(request)
    const res = guard(request, rid) ?? sectionGate(rid, 'documents', lang)
    if (res) return res
    const s = new URL(request.url).searchParams
    const tab = s.get('tab') ?? 'sign'
    const type = s.get('type')
    const year = Number(s.get('year')) || null
    const mine = empty() ? [] : documents().filter((d) => d.rid === rid)
    const filtered = mine
      .filter((d) => !type || d.type === type)
      .filter((d) => !year || new Date(d.completedAt ?? d.sentAt).getFullYear() === year)
    const counts = { sign: 0, confirm: 0, done: 0 }
    for (const d of filtered) counts[tabOf(d)]++
    const items = filtered
      .filter((d) => tabOf(d) === tab)
      .sort((a, b) => (b.completedAt ?? b.sentAt).localeCompare(a.completedAt ?? a.sentAt))
      .map((d) => docSummary(d, lang))
    return HttpResponse.json({ items: items.slice(0, PAGE_SIZE), nextCursor: null, counts })
  }),

  http.get(url('/documents/:id'), ({ request, params }) => {
    if (!authed(request)) return unauth()
    const d = findDoc(String(params.id))
    if (!d) return apiError(404, 'NOT_FOUND', 'Document not found')
    const lang = langOf(request)
    const resident = memberFixture(lang).residents.find((r) => r.id === d.rid)
    return guard(request, d.rid) ?? HttpResponse.json(docDetail(d, lang, resident?.name ?? ''))
  }),

  http.post(url('/documents/:id/sign'), async ({ request, params }) => {
    if (!authed(request)) return unauth()
    const d = findDoc(String(params.id))
    if (!d) return apiError(404, 'NOT_FOUND', 'Document not found')
    const ifMatch = request.headers.get('If-Match')
    if (ifMatch && Number(ifMatch) !== d.version) {
      return apiError(409, 'VERSION_CONFLICT', 'The document changed', { details: { currentVersion: d.version } })
    }
    if (d.requiredAction !== 'sign' || tabOf(d) === 'done') return apiError(422, 'VALIDATION_FAILED', 'Nothing to sign')
    const b = await body<{ signaturePng: string; consentAccepted: boolean }>(request)
    if (!b.signaturePng?.startsWith('data:image/png;base64,') || b.consentAccepted !== true) {
      return apiError(422, 'VALIDATION_FAILED', 'Signature and consent are required', {
        fields: { ...(b.consentAccepted ? {} : { consentAccepted: 'required' }), ...(b.signaturePng ? {} : { signaturePng: 'required' }) },
      })
    }
    d.status = 'signed'
    d.completedAt = nowIso()
    d.confirmationCode = code('SIG')
    d.version += 1
    return HttpResponse.json({
      status: 'signed',
      completedAt: d.completedAt,
      confirmationCode: d.confirmationCode,
      signedFileUrl: docDetail(d, langOf(request), '').fileUrl,
    })
  }),

  http.post(url('/documents/:id/approve'), async ({ request, params }) => {
    if (!authed(request)) return unauth()
    const d = findDoc(String(params.id))
    if (!d) return apiError(404, 'NOT_FOUND', 'Document not found')
    if (d.requiredAction !== 'approve' || tabOf(d) === 'done') return apiError(422, 'VALIDATION_FAILED', 'Nothing to approve')
    const b = await body<{ decision: string; reason: string }>(request)
    const reason = (b.reason ?? '').trim()
    if (b.decision !== 'approved' && b.decision !== 'declined') {
      return apiError(422, 'VALIDATION_FAILED', 'Invalid decision', { fields: { decision: 'required' } })
    }
    if (b.decision === 'declined' && (reason.length < 5 || reason.length > 300)) {
      return apiError(422, 'VALIDATION_FAILED', 'A reason is required', { fields: { reason: 'length' } })
    }
    d.status = b.decision
    d.completedAt = nowIso()
    d.confirmationCode = code('APR')
    d.version += 1
    return HttpResponse.json({ status: d.status, completedAt: d.completedAt, confirmationCode: d.confirmationCode })
  }),

  http.post(url('/documents/:id/confirm-read'), ({ request, params }) => {
    if (!authed(request)) return unauth()
    const d = findDoc(String(params.id))
    if (!d) return apiError(404, 'NOT_FOUND', 'Document not found')
    if (d.requiredAction !== 'confirm_read' || tabOf(d) === 'done') return apiError(422, 'VALIDATION_FAILED', 'Nothing to confirm')
    d.status = 'read_confirmed'
    d.completedAt = nowIso()
    d.version += 1
    return HttpResponse.json({ status: 'read_confirmed', completedAt: d.completedAt })
  }),

  http.get(url('/residents/:rid/surveys'), ({ request, params }) => {
    const rid = String(params.rid)
    const res = guard(request, rid)
    if (res) return res
    const state = new URL(request.url).searchParams.get('state') === 'completed' ? 'completed' : 'active'
    return HttpResponse.json({ items: empty() ? [] : surveysFor(state, langOf(request)) })
  }),

  http.get(url('/surveys/:id'), ({ request, params }) => {
    if (!authed(request)) return unauth()
    const s = findSurvey(String(params.id))
    return s ? HttpResponse.json(detail(s, langOf(request))) : apiError(404, 'NOT_FOUND', 'Survey not found')
  }),

  // Submitted surveys return their final answers here too, so the app can show the read-only review.
  http.get(url('/surveys/:id/draft'), ({ request, params }) => {
    if (!authed(request)) return unauth()
    const id = String(params.id)
    const done = submitted.get(id)
    if (done) return HttpResponse.json({ answers: done.answers, currentQuestionId: null, savedAt: done.submittedAt })
    const d = drafts.get(id)
    return d ? HttpResponse.json(d) : apiError(404, 'NOT_FOUND', 'No draft')
  }),

  http.put(url('/surveys/:id/draft'), async ({ request, params }) => {
    if (!authed(request)) return unauth()
    const id = String(params.id)
    if (!findSurvey(id)) return apiError(404, 'NOT_FOUND', 'Survey not found')
    if (submitted.has(id)) return apiError(410, 'DEADLINE_PASSED', 'Survey already submitted')
    const b = await body<{ answers: Record<string, Answer>; currentQuestionId: string | null }>(request)
    const savedAt = nowIso()
    drafts.set(id, { answers: b.answers ?? {}, currentQuestionId: b.currentQuestionId ?? null, savedAt })
    return HttpResponse.json({ savedAt })
  }),

  http.post(url('/surveys/:id/submit'), async ({ request, params }) => {
    if (!authed(request)) return unauth()
    const id = String(params.id)
    const s = findSurvey(id)
    if (!s) return apiError(404, 'NOT_FOUND', 'Survey not found')
    if (Date.parse(s.closesAt) < appNow()) return apiError(410, 'DEADLINE_PASSED', 'The survey is closed')
    const done = submitted.get(id)
    if (done) return HttpResponse.json({ submittedAt: done.submittedAt, receipt: `SRV-${id}` })
    const { answers = {} } = await body<{ answers: Record<string, Answer> }>(request)
    const visible = visibleQuestions(s, answers)
    const fields: Record<string, string> = {}
    for (const q of visible) if (q.required && !isAnswered(answers[q.id])) fields[q.id] = 'required'
    if (Object.keys(fields).length) return apiError(422, 'VALIDATION_FAILED', 'Required questions are missing', { fields })
    // Answers to hidden questions are dropped, as the contract requires.
    const kept = Object.fromEntries(visible.filter((q) => q.id in answers).map((q) => [q.id, answers[q.id]!]))
    const submittedAt = nowIso()
    submitted.set(id, { answers: kept, submittedAt })
    drafts.delete(id)
    return HttpResponse.json({ submittedAt, receipt: code('SRV') })
  }),

  http.get(url('/feed'), ({ request }) => {
    if (!authed(request)) return unauth()
    const s = new URL(request.url).searchParams
    const start = Number(s.get('cursor') ?? 0) || 0
    const list = empty()
      ? []
      : feedList(langOf(request), {
          category: s.get('category') ?? 'all',
          archive: s.get('archive') === 'true',
          q: s.get('q') ?? '',
        })
    return HttpResponse.json({
      items: list.slice(start, start + PAGE_SIZE),
      nextCursor: start + PAGE_SIZE < list.length ? String(start + PAGE_SIZE) : null,
    })
  }),

  http.get(url('/feed/:id'), ({ request, params }) => {
    if (!authed(request)) return unauth()
    const r = findFeed(String(params.id))
    return r ? HttpResponse.json(feedDetail(r, langOf(request))) : apiError(404, 'NOT_FOUND', 'Item not found')
  }),

  http.post(url('/feed/:id/confirm-read'), ({ request, params }) => {
    if (!authed(request)) return unauth()
    const id = String(params.id)
    const r = findFeed(id)
    if (!r?.requiresReadConfirmation) return apiError(404, 'NOT_FOUND', 'Item not found')
    const at = readConfirmations.get(id) ?? nowIso()
    readConfirmations.set(id, at)
    return HttpResponse.json({ readConfirmedAt: at })
  }),

  http.put(url('/events/:id/rsvp'), async ({ request, params }) => {
    if (!authed(request)) return unauth()
    const id = String(params.id)
    const deadline = eventDeadline(id)
    if (!deadline) return apiError(404, 'NOT_FOUND', 'Event not found')
    if (Date.parse(deadline) < appNow()) {
      return apiError(410, 'DEADLINE_PASSED', 'Replies are closed', { details: { deadline } })
    }
    const b = await body<{ status: string; guests: number; guestNames: string[]; note: string }>(request)
    const fields: Record<string, string> = {}
    const status = b.status
    if (status !== 'attending' && status !== 'not_attending' && status !== 'undecided') fields.status = 'required'
    const attending = status === 'attending'
    const guests = attending ? Number(b.guests ?? 0) : 0
    const names = attending ? (b.guestNames ?? []).map((n) => n.trim()) : []
    if (guests < 0 || guests > eventMaxGuests(id)) fields.guests = 'range'
    if (names.length !== guests) fields.guestNames = 'count'
    names.forEach((n, i) => {
      if (n.length < 2 || n.length > 60) fields[`guestNames.${i}`] = 'length'
    })
    if ((b.note ?? '').length > 300) fields.note = 'length'
    if (Object.keys(fields).length || !status) return apiError(422, 'VALIDATION_FAILED', 'Invalid RSVP', { fields })
    const rsvp = {
      status: status as 'attending' | 'not_attending' | 'undecided',
      guests,
      guestNames: names,
      note: (b.note ?? '').trim(),
      updatedAt: nowIso(),
    }
    rsvps.set(id, rsvp)
    return HttpResponse.json(rsvp)
  }),
]
