import { z } from 'zod'
import { departmentCodeSchema, pageSchema } from './common'

export const documentTypeSchema = z.enum(['consent', 'approval', 'policy', 'agreement', 'form', 'other'])
export const requiredActionSchema = z.enum(['sign', 'approve', 'confirm_read'])
export const documentStatusSchema = z.enum(['pending', 'overdue', 'signed', 'approved', 'declined', 'read_confirmed'])

export const documentSummarySchema = z.object({
  id: z.string(),
  code: z.string(),
  title: z.string(),
  type: documentTypeSchema,
  from: z.object({ department: departmentCodeSchema, name: z.string() }),
  sentAt: z.string(),
  dueAt: z.string().nullable(),
  requiredAction: requiredActionSchema.nullable(),
  status: documentStatusSchema,
  completedAt: z.string().nullable(),
})

export const documentsPageSchema = pageSchema(documentSummarySchema).extend({
  counts: z.object({ sign: z.number(), confirm: z.number(), done: z.number() }),
})

export const documentDetailSchema = documentSummarySchema.extend({
  version: z.number(),
  pages: z.number(),
  fileUrl: z.string(),
  previewHtml: z.string().nullable(),
  signatureConsentText: z.string().nullable(),
  approveLabel: z.string().nullable(),
  completion: z.object({ by: z.string(), at: z.string(), confirmationCode: z.string() }).nullable(),
})

export const signResultSchema = z.object({
  status: z.literal('signed'),
  completedAt: z.string(),
  confirmationCode: z.string(),
  signedFileUrl: z.string(),
})

export const approveResultSchema = z.object({
  status: z.enum(['approved', 'declined']),
  completedAt: z.string(),
  confirmationCode: z.string(),
})

export const confirmReadResultSchema = z.object({ status: z.literal('read_confirmed'), completedAt: z.string() })

export type DocumentType = z.infer<typeof documentTypeSchema>
export type DocumentStatus = z.infer<typeof documentStatusSchema>
export type DocumentSummary = z.infer<typeof documentSummarySchema>
export type DocumentDetail = z.infer<typeof documentDetailSchema>
