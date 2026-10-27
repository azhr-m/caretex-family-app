import { z } from 'zod'
import { departmentCodeSchema, pageSchema, personSchema, photoSchema } from './common'

export const permissionValueSchema = z.enum(['allowed', 'denied', 'not_shared', 'hidden'])

export const PERMISSION_KEYS = [
  'general',
  'updates',
  'medical',
  'carePlan',
  'schedule',
  'documents',
  'inquiries',
  'serviceRequests',
  'billing',
] as const

export type PermissionKey = (typeof PERMISSION_KEYS)[number]

export const permissionsSchema = z.object({
  general: permissionValueSchema,
  updates: permissionValueSchema,
  medical: permissionValueSchema,
  carePlan: permissionValueSchema,
  schedule: permissionValueSchema,
  documents: permissionValueSchema,
  inquiries: permissionValueSchema,
  serviceRequests: permissionValueSchema,
  billing: permissionValueSchema,
  notes: z.partialRecord(z.enum(PERMISSION_KEYS), z.string()),
  updatedAt: z.string(),
})

export const residentSchema = z.object({
  id: z.string(),
  name: z.string(),
  initials: z.string(),
  photoUrl: z.string().nullable(),
  dateOfBirth: z.string(),
  ward: z.string(),
  room: z.string(),
  admittedOn: z.string(),
  languages: z.array(z.string()),
  primaryFamilyContact: z.object({ name: z.string(), isYou: z.boolean() }),
  staffContacts: z.array(personSchema.extend({ department: departmentCodeSchema })),
  wardPhone: z.object({ label: z.string(), phone: z.string() }),
  permissions: permissionsSchema,
  version: z.number(),
})

export const updateCategorySchema = z.enum(['activities', 'health', 'social', 'daily_life', 'other'])

export const updateSummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  excerpt: z.string(),
  author: personSchema,
  publishedAt: z.string(),
  category: updateCategorySchema,
  photos: z.array(photoSchema),
  photoCount: z.number(),
  isNew: z.boolean(),
})

export const updatesPageSchema = pageSchema(updateSummarySchema)

export const updateDetailSchema = updateSummarySchema.extend({
  body: z.string(),
  sharedAt: z.string(),
  version: z.number(),
})

/** Section endpoints answer `{ state: "not_shared" }` when the center hasn't published them yet. */
const notShared = z.object({ state: z.literal('not_shared') })

export const medicalCategoryCodeSchema = z.enum([
  'medications',
  'diagnoses',
  'allergies',
  'doctor_visits',
  'tests',
  'nutrition',
  'physiotherapy',
])

export const medicalSchema = z.discriminatedUnion('state', [
  z.object({
    state: z.literal('ok'),
    categories: z.array(
      z.object({
        code: medicalCategoryCodeSchema,
        items: z.array(
          z.object({
            id: z.string(),
            name: z.string(),
            detail: z.string(),
            flag: z.literal('allergy').nullable(),
            sharedAt: z.string(),
          }),
        ),
      }),
    ),
  }),
  notShared,
])

export const goalStatusSchema = z.enum(['on_track', 'achieved', 'monitoring', 'needs_attention'])

export const carePlanSchema = z.discriminatedUnion('state', [
  z.object({
    state: z.literal('ok'),
    reviewedOn: z.string(),
    nextReviewOn: z.string(),
    goals: z.array(
      z.object({
        id: z.string(),
        title: z.string(),
        icon: z.string(),
        status: goalStatusSchema,
        teamActions: z.string(),
        familyActions: z.string(),
      }),
    ),
  }),
  notShared,
])

export const scheduleItemSchema = z.object({
  id: z.string(),
  startsAt: z.string(),
  endsAt: z.string().nullable(),
  title: z.string(),
  place: z.string(),
  kind: z.enum(['care', 'meal', 'activity', 'therapy', 'rest', 'social', 'medical', 'other']),
  status: z.enum(['done', 'now', 'upcoming', 'cancelled']),
})

export const scheduleSchema = z.union([
  z.object({
    date: z.string(),
    lastUpdatedAt: z.string(),
    lastUpdatedBy: z.string(),
    items: z.array(scheduleItemSchema),
  }),
  notShared,
])

export type PermissionValue = z.infer<typeof permissionValueSchema>
export type Permissions = z.infer<typeof permissionsSchema>
export type Resident = z.infer<typeof residentSchema>
export type UpdateCategory = z.infer<typeof updateCategorySchema>
export type UpdateSummary = z.infer<typeof updateSummarySchema>
export type UpdateDetail = z.infer<typeof updateDetailSchema>
export type Medical = z.infer<typeof medicalSchema>
export type MedicalCategoryCode = z.infer<typeof medicalCategoryCodeSchema>
export type CarePlan = z.infer<typeof carePlanSchema>
export type GoalStatus = z.infer<typeof goalStatusSchema>
export type ScheduleItem = z.infer<typeof scheduleItemSchema>
export type Schedule = z.infer<typeof scheduleSchema>
