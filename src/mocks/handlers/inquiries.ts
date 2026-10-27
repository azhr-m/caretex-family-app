import { HttpResponse, http } from 'msw'
import { departmentCodeSchema } from '@/api/schemas/common'
import { inquiryStatusSchema, type InquiryStatus } from '@/api/schemas/inquiries'
import { appNow } from '@/lib/clock'
import { files, minimalPdf, storeUpload } from '../fixtures/files'
import {
  allocateRef,
  departmentsFixture,
  expectedResponse,
  inquiries,
  searchableText,
  toDetail,
  toSummary,
  type InquiryRecord,
} from '../fixtures/inquiries'
import { apiError, authed, langOf, url } from '../http'
import { currentScenario } from '../scenarios'
import { guard, sectionGate } from './residents'

const PAGE_SIZE = 20
const MAX_BYTES = 10 * 1024 * 1024
const ALLOWED = /\.(jpe?g|png|heic|pdf)$/i

/** Responses already given per Idempotency-Key, so a retried request doesn't create twice. */
const idempotent = new Map<string, Record<string, unknown>>()

const nowIso = () => new Date(appNow()).toISOString()
const body = async <T>(request: Request) => ((await request.json().catch(() => ({}))) ?? {}) as Partial<T>
const len = (s: unknown) => (typeof s === 'string' ? s.trim().length : 0)

const find = (id: string) => inquiries().find((i) => i.id === id)

export const inquiryHandlers = [
  http.get(url('/departments'), ({ request }) => {
    if (!authed(request)) return apiError(401, 'TOKEN_EXPIRED', 'Access token expired')
    return HttpResponse.json(departmentsFixture(langOf(request)))
  }),

  http.get(url('/residents/:rid/inquiries'), ({ request, params }) => {
    const rid = String(params.rid)
    const lang = langOf(request)
    const res = guard(request, rid) ?? sectionGate(rid, 'inquiries', lang)
    if (res) return res
    const s = new URL(request.url).searchParams
    const q = (s.get('q') ?? '').trim().toLowerCase()
    const dept = departmentCodeSchema.safeParse(s.get('department')).data
    const status = inquiryStatusSchema.safeParse(s.get('status')).data
    const oldest = s.get('sort') === 'oldest'
    const start = Number(s.get('cursor') ?? 0) || 0

    const base = (currentScenario() === 'emptyEverything' ? [] : inquiries())
      .filter((i) => i.rid === rid)
      .filter((i) => !dept || i.department === dept)
      .filter((i) => !q || searchableText(i, lang).includes(q))
    const counts: Record<InquiryStatus | 'all', number> = {
      all: base.length,
      new: 0,
      read: 0,
      in_progress: 0,
      waiting_for_family: 0,
      handled: 0,
      closed: 0,
    }
    for (const i of base) counts[i.status]++

    const list = base
      .filter((i) => !status || i.status === status)
      .map((i) => toSummary(i, lang))
      .sort((a, b) => (oldest ? 1 : -1) * a.lastMessageAt.localeCompare(b.lastMessageAt))
    return HttpResponse.json({
      items: list.slice(start, start + PAGE_SIZE),
      nextCursor: start + PAGE_SIZE < list.length ? String(start + PAGE_SIZE) : null,
      counts,
    })
  }),

  http.get(url('/inquiries/:id'), ({ request, params }) => {
    if (!authed(request)) return apiError(401, 'TOKEN_EXPIRED', 'Access token expired')
    const r = find(String(params.id))
    if (!r) return apiError(404, 'NOT_FOUND', 'Inquiry not found')
    return guard(request, r.rid) ?? HttpResponse.json(toDetail(r, langOf(request)))
  }),

  http.post(url('/residents/:rid/inquiries'), async ({ request, params }) => {
    const rid = String(params.rid)
    const lang = langOf(request)
    const res = guard(request, rid)
    if (res) return res
    const key = request.headers.get('Idempotency-Key')
    if (key && idempotent.has(key)) return HttpResponse.json(idempotent.get(key), { status: 201 })

    const b = await body<{ department: string; subject: string; message: string; attachmentIds: string[] }>(request)
    const department = departmentCodeSchema.safeParse(b.department).data
    const fields: Record<string, string> = {}
    if (!department) fields.department = 'required'
    if (len(b.subject) < 3 || len(b.subject) > 80) fields.subject = 'length'
    if (len(b.message) < 10 || len(b.message) > 1000) fields.message = 'length'
    if ((b.attachmentIds?.length ?? 0) > 5) fields.attachmentIds = 'too_many'
    if (Object.keys(fields).length || !department) {
      return apiError(422, 'VALIDATION_FAILED', 'Invalid inquiry', { fields })
    }

    const { id, ref } = allocateRef()
    const at = nowIso()
    const record: InquiryRecord = {
      id,
      rid,
      ref,
      subject: b.subject!.trim(),
      department,
      status: 'new',
      createdAt: at,
      hasUnreadReply: false,
      version: 1,
      closedAt: null,
      closedBy: null,
      timeline: [
        {
          type: 'message',
          id: `m_${id}_1`,
          author: 'dana',
          text: b.message!.trim(),
          attachments: (b.attachmentIds ?? []).flatMap((a) => files.get(a)?.attachment ?? []),
          sentAt: at,
        },
        { type: 'status', id: `s_${id}_1`, status: 'new', by: null, at },
      ],
    }
    inquiries().push(record)
    const created = { ...toSummary(record, lang), expectedResponse: expectedResponse(department, lang) }
    if (key) idempotent.set(key, created)
    return HttpResponse.json(created, { status: 201 })
  }),

  http.post(url('/inquiries/:id/messages'), async ({ request, params }) => {
    if (!authed(request)) return apiError(401, 'TOKEN_EXPIRED', 'Access token expired')
    const r = find(String(params.id))
    if (!r) return apiError(404, 'NOT_FOUND', 'Inquiry not found')
    const res = guard(request, r.rid)
    if (res) return res
    const key = request.headers.get('Idempotency-Key')
    if (key && idempotent.has(key)) return HttpResponse.json(idempotent.get(key), { status: 201 })
    if (r.status === 'closed') {
      return apiError(410, 'DEADLINE_PASSED', 'This inquiry is closed', { details: { closedAt: r.closedAt } })
    }
    const ifMatch = request.headers.get('If-Match')
    if (ifMatch && Number(ifMatch) !== r.version) {
      return apiError(409, 'VERSION_CONFLICT', 'The inquiry changed', { details: { currentVersion: r.version } })
    }
    const b = await body<{ text: string; attachmentIds: string[] }>(request)
    if (len(b.text) < 1 || len(b.text) > 1000) {
      return apiError(422, 'VALIDATION_FAILED', 'Invalid reply', { fields: { text: 'length' } })
    }
    const at = nowIso()
    const n = r.timeline.length + 1
    r.timeline.push({
      type: 'message',
      id: `m_${r.id}_${n}`,
      author: 'dana',
      text: b.text!.trim(),
      attachments: (b.attachmentIds ?? []).flatMap((a) => files.get(a)?.attachment ?? []),
      sentAt: at,
    })
    if (r.status !== 'in_progress') {
      r.status = 'in_progress'
      r.timeline.push({ type: 'status', id: `s_${r.id}_${n}`, status: 'in_progress', by: null, at })
    }
    r.hasUnreadReply = false
    r.version += 1
    const detail = toDetail(r, langOf(request))
    const message = detail.timeline.findLast((e) => e.type === 'message')
    const result = { message, status: r.status, version: r.version }
    if (key) idempotent.set(key, result)
    return HttpResponse.json(result, { status: 201 })
  }),

  http.post(url('/inquiries/:id/read'), ({ request, params }) => {
    if (!authed(request)) return apiError(401, 'TOKEN_EXPIRED', 'Access token expired')
    const r = find(String(params.id))
    if (!r) return apiError(404, 'NOT_FOUND', 'Inquiry not found')
    r.hasUnreadReply = false
    return new HttpResponse(null, { status: 204 })
  }),

  http.post(url('/attachments'), async ({ request }) => {
    if (!authed(request)) return apiError(401, 'TOKEN_EXPIRED', 'Access token expired')
    const form = await request.formData().catch(() => null)
    const file = form?.get('file')
    if (!(file instanceof File)) return apiError(422, 'VALIDATION_FAILED', 'No file', { fields: { file: 'required' } })
    if (file.size > MAX_BYTES) return apiError(413, 'FILE_TOO_LARGE', 'File is larger than 10 MB')
    if (!ALLOWED.test(file.name)) return apiError(415, 'FILE_TYPE_NOT_ALLOWED', 'File type not allowed')
    return HttpResponse.json(storeUpload(file), { status: 201 })
  }),

  http.get(url('/media/files/:id'), ({ params }) => {
    const f = files.get(String(params.id))
    if (!f) return apiError(404, 'NOT_FOUND', 'File not found')
    const blob = f.blob ?? new Blob([minimalPdf(f.attachment.name)], { type: 'application/pdf' })
    return new HttpResponse(blob, {
      headers: { 'Content-Type': f.attachment.mimeType, 'Content-Disposition': `inline; filename="${f.attachment.name}"` },
    })
  }),
]
