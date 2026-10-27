import { z } from 'zod'
import { api } from '../client'
import { dashboardSchema, visitSchema } from '../schemas/dashboard'
import {
  carePlanSchema,
  medicalSchema,
  permissionsSchema,
  residentSchema,
  scheduleSchema,
  updateDetailSchema,
  updatesPageSchema,
} from '../schemas/resident'

const r = (rid: string) => `/residents/${encodeURIComponent(rid)}`

export const getResident = (rid: string, signal?: AbortSignal) =>
  api(r(rid), { schema: residentSchema, signal })

export const getPermissions = (rid: string, signal?: AbortSignal) =>
  api(`${r(rid)}/permissions`, { schema: permissionsSchema, signal })

export const getDashboard = (rid: string, signal?: AbortSignal) =>
  api(`${r(rid)}/dashboard`, { schema: dashboardSchema, signal })

export const postVisit = (residentId: string) =>
  api('/me/visits', { method: 'POST', body: { residentId }, schema: visitSchema })

export const getUpdates = (rid: string, cursor: string | undefined, signal?: AbortSignal) =>
  api(`${r(rid)}/updates?limit=20${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`, {
    schema: updatesPageSchema,
    signal,
  })

export const getUpdate = (id: string, signal?: AbortSignal) =>
  api(`/updates/${encodeURIComponent(id)}`, { schema: updateDetailSchema, signal })

export const markUpdateSeen = (id: string) =>
  api(`/updates/${encodeURIComponent(id)}/seen`, { method: 'POST', schema: z.unknown() })

export const getMedical = (rid: string, signal?: AbortSignal) =>
  api(`${r(rid)}/medical`, { schema: medicalSchema, signal })

export const getCarePlan = (rid: string, signal?: AbortSignal) =>
  api(`${r(rid)}/care-plan`, { schema: carePlanSchema, signal })

export const getSchedule = (rid: string, date: string, signal?: AbortSignal) =>
  api(`${r(rid)}/schedule?date=${date}`, { schema: scheduleSchema, signal })
