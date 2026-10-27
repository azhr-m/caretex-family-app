import { z } from 'zod'
import { attachmentSchema, departmentCodeSchema, pageSchema, personSchema } from './common'
import { deepLinkSchema } from './dashboard'

export const serviceTypeCodeSchema = z.enum([
  'maintenance',
  'laundry',
  'hairdresser',
  'equipment',
  'conversation',
  'finance',
  'other',
])

export const serviceTypeSchema = z.object({
  code: serviceTypeCodeSchema,
  name: z.string(),
  timeOptions: z.array(z.object({ code: z.string(), label: z.string() })),
})

export const serviceStatusSchema = z.enum(['opened', 'assigned', 'in_progress', 'handled', 'closed', 'cancelled'])

export const serviceSummarySchema = z.object({
  id: z.string(),
  ref: z.string(),
  title: z.string(),
  type: serviceTypeCodeSchema,
  status: serviceStatusSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
  scheduledAt: z.string().nullable(),
})

export const servicesPageSchema = pageSchema(serviceSummarySchema)

export const serviceLogEntrySchema = z.object({
  id: z.string(),
  status: z.union([serviceStatusSchema, z.literal('comment')]),
  text: z.string(),
  at: z.string(),
  by: z.string().nullable(),
})

export const serviceDetailSchema = serviceSummarySchema.extend({
  description: z.string(),
  preferredTime: z.string().nullable(),
  assignee: personSchema.nullable(),
  expected: z.string().nullable(),
  attachments: z.array(attachmentSchema),
  log: z.array(serviceLogEntrySchema),
  canCancel: z.boolean(),
  version: z.number(),
})

export const centerSchema = z.object({
  name: z.string(),
  address: z.string(),
  phone: z.string(),
  email: z.string(),
  mapsUrl: z.string(),
  visitingHours: z.array(z.object({ label: z.string(), from: z.string(), to: z.string(), quiet: z.boolean() })),
  contacts: z.array(
    z.object({ roleLabel: z.string(), name: z.string(), phone: z.string(), department: departmentCodeSchema.nullable() }),
  ),
  guide: z.array(
    z.object({
      code: z.enum(['response_hours', 'procedures', 'may_bring', 'dont_bring', 'preparing', 'services', 'phones']),
      title: z.string(),
      items: z.array(z.object({ text: z.string(), phone: z.string().optional(), emergency: z.boolean().optional() })),
    }),
  ),
})

export const notificationKindSchema = z.enum([
  'document',
  'inquiry_reply',
  'event',
  'calendar_change',
  'update',
  'service_request',
  'survey',
  'newsletter',
])

export const notificationSchema = z.object({
  id: z.string(),
  kind: notificationKindSchema,
  title: z.string(),
  createdAt: z.string(),
  readAt: z.string().nullable(),
  link: deepLinkSchema,
})

export const notificationsPageSchema = pageSchema(notificationSchema).extend({ unreadCount: z.number() })

export const billingSchema = z.union([
  z.object({ state: z.literal('coming_soon') }),
  z.object({ state: z.literal('ok') }).passthrough(),
])

export type ServiceTypeCode = z.infer<typeof serviceTypeCodeSchema>
export type ServiceType = z.infer<typeof serviceTypeSchema>
export type ServiceStatus = z.infer<typeof serviceStatusSchema>
export type ServiceSummary = z.infer<typeof serviceSummarySchema>
export type ServiceDetail = z.infer<typeof serviceDetailSchema>
export type Center = z.infer<typeof centerSchema>
export type NotificationKind = z.infer<typeof notificationKindSchema>
export type AppNotification = z.infer<typeof notificationSchema>
