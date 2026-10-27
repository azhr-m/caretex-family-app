import { z } from 'zod'
import { attachmentSchema, departmentCodeSchema, personSchema } from './common'

export const departmentSchema = z.object({
  code: departmentCodeSchema,
  name: z.string(),
  hint: z.string(),
  expectedResponse: z.string(),
})

export const inquiryStatusSchema = z.enum(['new', 'read', 'in_progress', 'waiting_for_family', 'handled', 'closed'])

export const inquirySummarySchema = z.object({
  id: z.string(),
  ref: z.string(),
  subject: z.string(),
  department: departmentCodeSchema,
  status: inquiryStatusSchema,
  createdAt: z.string(),
  lastMessageAt: z.string(),
  lastMessagePreview: z.object({ authorName: z.string(), isYou: z.boolean(), text: z.string() }),
  hasUnreadReply: z.boolean(),
})

export const inquiriesPageSchema = z.object({
  items: z.array(inquirySummarySchema),
  nextCursor: z.string().nullable(),
  counts: z.record(z.enum([...inquiryStatusSchema.options, 'all']), z.number()),
})

export const timelineMessageSchema = z.object({
  type: z.literal('message'),
  id: z.string(),
  author: personSchema.extend({ isYou: z.boolean(), relation: z.string().optional() }),
  text: z.string(),
  attachments: z.array(attachmentSchema),
  sentAt: z.string(),
})

export const timelineStatusSchema = z.object({
  type: z.literal('status'),
  id: z.string(),
  status: inquiryStatusSchema,
  by: z.string().nullable(),
  at: z.string(),
})

export const inquiryDetailSchema = inquirySummarySchema.extend({
  version: z.number(),
  closedAt: z.string().nullable(),
  closedBy: z.string().nullable(),
  timeline: z.array(z.discriminatedUnion('type', [timelineMessageSchema, timelineStatusSchema])),
})

export const createdInquirySchema = inquirySummarySchema.extend({ expectedResponse: z.string() })

export const replyResultSchema = z.object({
  message: timelineMessageSchema,
  status: inquiryStatusSchema,
  version: z.number(),
})

export type Department = z.infer<typeof departmentSchema>
export type InquiryStatus = z.infer<typeof inquiryStatusSchema>
export type InquirySummary = z.infer<typeof inquirySummarySchema>
export type InquiriesPage = z.infer<typeof inquiriesPageSchema>
export type InquiryDetail = z.infer<typeof inquiryDetailSchema>
export type TimelineMessage = z.infer<typeof timelineMessageSchema>
export type TimelineEntry = InquiryDetail['timeline'][number]
