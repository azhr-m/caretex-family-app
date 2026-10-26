import { z } from 'zod'

export const weekdaySchema = z.enum(['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'])

export const officeHoursSchema = z.object({
  /** A single day ("fri") or an inclusive range ("sun-thu"). */
  days: z.string().regex(/^(sun|mon|tue|wed|thu|fri|sat)(-(sun|mon|tue|wed|thu|fri|sat))?$/),
  from: z.string(),
  to: z.string(),
})

export const centerPublicSchema = z.object({
  name: z.string(),
  familyOfficeName: z.string(),
  phone: z.string(),
  email: z.string(),
  address: z.string(),
  officeHours: z.array(officeHoursSchema),
})

export type Weekday = z.infer<typeof weekdaySchema>
export type OfficeHours = z.infer<typeof officeHoursSchema>
export type CenterPublic = z.infer<typeof centerPublicSchema>
