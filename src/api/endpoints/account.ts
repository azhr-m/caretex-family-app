import { z } from 'zod'
import { api } from '../client'
import {
  billingSchema,
  centerSchema,
  notificationsPageSchema,
  serviceDetailSchema,
  serviceLogEntrySchema,
  serviceStatusSchema,
  serviceSummarySchema,
  servicesPageSchema,
  serviceTypeSchema,
  type ServiceTypeCode,
} from '../schemas/account'
import { preferencesSchema, type Preferences } from '../schemas/me'

const enc = encodeURIComponent

export const getServiceTypes = (signal?: AbortSignal) =>
  api('/service-request-types', { schema: z.array(serviceTypeSchema), signal })

export const getServices = (rid: string, cursor: string | undefined, signal?: AbortSignal) =>
  api(`/residents/${enc(rid)}/service-requests${cursor ? `?cursor=${enc(cursor)}` : ''}`, {
    schema: servicesPageSchema,
    signal,
  })

export const getService = (id: string, signal?: AbortSignal) =>
  api(`/service-requests/${enc(id)}`, { schema: serviceDetailSchema, signal })

export type NewServiceRequest = {
  type: ServiceTypeCode
  description: string
  preferredTime: string | null
  attachmentIds: string[]
}

export const createService = (rid: string, body: NewServiceRequest, idempotencyKey: string) =>
  api(`/residents/${enc(rid)}/service-requests`, {
    method: 'POST',
    body,
    schema: serviceSummarySchema,
    idempotencyKey,
  })

export const commentService = (id: string, text: string, idempotencyKey: string) =>
  api(`/service-requests/${enc(id)}/comments`, {
    method: 'POST',
    body: { text },
    schema: serviceLogEntrySchema,
    idempotencyKey,
  })

export const cancelService = (id: string, reason?: string) =>
  api(`/service-requests/${enc(id)}/cancel`, {
    method: 'POST',
    body: reason ? { reason } : {},
    schema: z.object({ status: serviceStatusSchema }),
  })

export const getCenter = (signal?: AbortSignal) => api('/center', { schema: centerSchema, signal })

export const getNotifications = (cursor: string | undefined, signal?: AbortSignal) =>
  api(`/notifications${cursor ? `?cursor=${enc(cursor)}` : ''}`, { schema: notificationsPageSchema, signal })

export const markNotificationRead = (id: string) =>
  api(`/notifications/${enc(id)}/read`, { method: 'POST', schema: z.unknown() })

export const markAllNotificationsRead = () =>
  api('/notifications/read-all', { method: 'POST', schema: z.object({ unreadCount: z.literal(0) }) })

export const patchPreferences = (patch: Partial<Preferences>) =>
  api('/me/preferences', { method: 'PATCH', body: patch, schema: preferencesSchema })

export const changePassword = (currentPassword: string, newPassword: string) =>
  api('/me/password', { method: 'PUT', body: { currentPassword, newPassword }, schema: z.unknown() })

export const getBilling = (rid: string, signal?: AbortSignal) =>
  api(`/residents/${enc(rid)}/billing`, { schema: billingSchema, signal })
