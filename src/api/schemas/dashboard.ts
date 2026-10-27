import { z } from 'zod'
import { calendarItemSummarySchema } from './calendar'
import { scheduleItemSchema, updateSummarySchema } from './resident'

export const deepLinkSchema = z.object({
  type: z.enum([
    'update',
    'inquiry',
    'document',
    'calendar_item',
    'service_request',
    'survey',
    'event',
    'feed_item',
    'resident_section',
  ]),
  id: z.string(),
  residentId: z.string().nullable(),
})

export const sinceLastVisitSchema = z.object({
  since: z.string().nullable(),
  items: z.array(
    z.object({
      id: z.string(),
      kind: z.enum(['update', 'inquiry_reply', 'document', 'calendar_change', 'request_handled', 'survey', 'event']),
      title: z.string(),
      occurredAt: z.string(),
      actor: z.string().nullable(),
      link: deepLinkSchema,
    }),
  ),
})

export const attentionKindSchema = z.enum([
  'sign_document',
  'confirm_read',
  'approve_document',
  'survey',
  'rsvp',
  'inquiry_reply_needed',
  'appointment_confirm',
])

export const attentionStatusSchema = z.enum([
  'to_sign',
  'to_confirm',
  'to_approve',
  'not_started',
  'draft',
  'awaiting_rsvp',
  'waiting_for_you',
  'overdue',
])

export const attentionSchema = z.array(
  z.object({
    id: z.string(),
    kind: attentionKindSchema,
    title: z.string(),
    subtitle: z.string(),
    dueAt: z.string().nullable(),
    status: attentionStatusSchema,
    link: deepLinkSchema,
  }),
)

export const dashboardCountsSchema = z.object({
  notificationsUnread: z.number(),
  tabs: z.object({ resident: z.number(), staff: z.number(), calendar: z.number(), more: z.number() }),
  documentsPending: z.number(),
  invitationsPending: z.number(),
})

/**
 * Validates one section on its own, so a malformed section shows an inline error while the rest
 * of Home still renders. Each section becomes `{ ok: true, data } | { ok: false }`.
 */
const section = <T extends z.ZodType>(schema: T) =>
  z.unknown().transform((value): { ok: true; data: z.infer<T> } | { ok: false } => {
    const parsed = schema.safeParse(value)
    if (parsed.success) return { ok: true, data: parsed.data }
    if (import.meta.env.DEV) console.warn('[dashboard] section failed validation', parsed.error.issues)
    return { ok: false }
  })

export const dashboardSchema = z.object({
  greetingName: z.string(),
  sinceLastVisit: section(sinceLastVisitSchema),
  attention: section(attentionSchema),
  latestUpdate: section(updateSummarySchema.nullable()),
  upcoming: section(calendarItemSummarySchema.nullable()),
  dayPreview: section(z.array(scheduleItemSchema)),
  counts: dashboardCountsSchema,
})

export const visitSchema = z.object({ previousVisitAt: z.string().nullable() })

export type DeepLink = z.infer<typeof deepLinkSchema>
export type SinceLastVisit = z.infer<typeof sinceLastVisitSchema>
export type AttentionItem = z.infer<typeof attentionSchema>[number]
export type AttentionKind = z.infer<typeof attentionKindSchema>
export type AttentionStatus = z.infer<typeof attentionStatusSchema>
export type Dashboard = z.infer<typeof dashboardSchema>
export type DashboardCounts = z.infer<typeof dashboardCountsSchema>
export type Section<T> = { ok: true; data: T } | { ok: false }
