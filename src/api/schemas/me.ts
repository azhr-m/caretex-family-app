import { z } from 'zod'

export const preferencesSchema = z.object({
  language: z.enum(['en', 'he']),
  theme: z.enum(['light', 'dark', 'system']),
  notifications: z.object({
    updates: z.boolean(),
    inquiries: z.boolean(),
    documents: z.boolean(),
    events: z.boolean(),
    surveys: z.boolean(),
  }),
  notifyPaymentsAvailable: z.boolean(),
})

export const linkedResidentSchema = z.object({
  id: z.string(),
  name: z.string(),
  initials: z.string(),
  photoUrl: z.string().nullable(),
  ward: z.string(),
  room: z.string(),
  relation: z.enum(['daughter', 'son', 'spouse', 'sibling', 'grandchild', 'guardian', 'other']),
  isPrimaryContact: z.boolean(),
  newItemsCount: z.number(),
})

export const memberSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  displayName: z.string(),
  initials: z.string(),
  phone: z.string(),
  username: z.string().nullable(),
  lastVisitAt: z.string().nullable(),
  residents: z.array(linkedResidentSchema),
  preferences: preferencesSchema,
})

export type Preferences = z.infer<typeof preferencesSchema>
export type LinkedResident = z.infer<typeof linkedResidentSchema>
export type Member = z.infer<typeof memberSchema>
