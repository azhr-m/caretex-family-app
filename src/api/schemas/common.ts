import { z } from 'zod'

export const toneSchema = z.enum(['blue', 'amber', 'violet', 'green', 'red', 'slate', 'teal', 'pink'])

export const staffRoleSchema = z.enum([
  'nurse',
  'head_nurse',
  'physician',
  'social_worker',
  'physiotherapist',
  'dietitian',
  'activities',
  'management',
  'finance',
  'maintenance',
  'laundry',
  'reception',
  'other',
])

export const personSchema = z.object({
  id: z.string(),
  name: z.string(),
  initials: z.string(),
  role: z.string(),
  roleCode: staffRoleSchema,
  photoUrl: z.string().nullable(),
})

export const attachmentSchema = z.object({
  id: z.string(),
  name: z.string(),
  mimeType: z.string(),
  sizeBytes: z.number(),
  url: z.string(),
  thumbnailUrl: z.string().nullable(),
})

export const photoSchema = z.object({
  id: z.string(),
  url: z.string(),
  thumbnailUrl: z.string(),
  width: z.number(),
  height: z.number(),
  caption: z.string().nullable(),
})

export const departmentCodeSchema = z.enum([
  'nursing',
  'doctor',
  'social_work',
  'physiotherapy',
  'nutrition',
  'activities',
  'management',
  'finance',
  'maintenance',
  'other',
])

export const pageSchema = <T extends z.ZodType>(item: T) =>
  z.object({ items: z.array(item), nextCursor: z.string().nullable() })

export type Person = z.infer<typeof personSchema>
export type Attachment = z.infer<typeof attachmentSchema>
export type Photo = z.infer<typeof photoSchema>
export type DepartmentCode = z.infer<typeof departmentCodeSchema>
export type StaffRole = z.infer<typeof staffRoleSchema>
