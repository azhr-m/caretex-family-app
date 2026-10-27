import type { DepartmentCode } from '../schemas/common'
import { z } from 'zod'
import { api } from '../client'
import {
  createdInquirySchema,
  departmentSchema,
  inquiriesPageSchema,
  inquiryDetailSchema,
  replyResultSchema,
  type InquiryStatus,
} from '../schemas/inquiries'

export type InquiryFilters = {
  q?: string
  department?: DepartmentCode
  status?: InquiryStatus
  sort?: 'newest' | 'oldest'
}

const query = (params: Record<string, string | undefined>) => {
  const s = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) if (v) s.set(k, v)
  const str = s.toString()
  return str ? `?${str}` : ''
}

export const getDepartments = (signal?: AbortSignal) =>
  api('/departments', { schema: z.array(departmentSchema), signal })

export const getInquiries = (rid: string, f: InquiryFilters, cursor: string | undefined, signal?: AbortSignal) =>
  api(`/residents/${encodeURIComponent(rid)}/inquiries${query({ ...f, cursor })}`, {
    schema: inquiriesPageSchema,
    signal,
  })

export const getInquiry = (id: string, signal?: AbortSignal) =>
  api(`/inquiries/${encodeURIComponent(id)}`, { schema: inquiryDetailSchema, signal })

export type NewInquiry = {
  department: DepartmentCode
  subject: string
  message: string
  attachmentIds: string[]
  relatedUpdateId?: string
}

export const createInquiry = (rid: string, body: NewInquiry, idempotencyKey: string) =>
  api(`/residents/${encodeURIComponent(rid)}/inquiries`, {
    method: 'POST',
    body,
    schema: createdInquirySchema,
    idempotencyKey,
  })

export const postReply = (
  id: string,
  body: { text: string; attachmentIds: string[] },
  opts: { ifMatch?: number; idempotencyKey: string },
) =>
  api(`/inquiries/${encodeURIComponent(id)}/messages`, {
    method: 'POST',
    body,
    schema: replyResultSchema,
    ...opts,
  })

export const markInquiryRead = (id: string) =>
  api(`/inquiries/${encodeURIComponent(id)}/read`, { method: 'POST', schema: z.unknown() })
