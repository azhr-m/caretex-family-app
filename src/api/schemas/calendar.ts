import { z } from 'zod'

export const rsvpStatusSchema = z.enum(['attending', 'not_attending', 'undecided'])

export const calendarItemSummarySchema = z.object({
  id: z.string(),
  kind: z.enum(['personal', 'center_event']),
  category: z.enum(['doctor', 'therapy', 'hair', 'vaccine', 'call', 'activity', 'event', 'other']),
  title: z.string(),
  startsAt: z.string(),
  endsAt: z.string().nullable(),
  allDay: z.boolean(),
  location: z.string(),
  requiresConfirmation: z.boolean(),
  confirmation: z.enum(['pending', 'confirmed']).nullable(),
  rsvp: rsvpStatusSchema.nullable(),
  eventId: z.string().nullable(),
  changed: z.object({ from: z.string(), at: z.string() }).nullable(),
})

export type CalendarItemSummary = z.infer<typeof calendarItemSummarySchema>

export const calendarRangeSchema = z.object({ items: z.array(calendarItemSummarySchema) })

export const calendarItemDetailSchema = calendarItemSummarySchema.extend({
  with: z.string().nullable(),
  purpose: z.string().nullable(),
  notes: z.string().nullable(),
  version: z.number(),
})

export const confirmResultSchema = z.object({ confirmation: z.literal('confirmed'), confirmedAt: z.string() })

export const rsvpSchema = z.object({
  status: rsvpStatusSchema,
  guests: z.number(),
  guestNames: z.array(z.string()),
  note: z.string(),
  updatedAt: z.string(),
})

export const eventSchema = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string(),
  startsAt: z.string(),
  endsAt: z.string().nullable(),
  location: z.string(),
  coverUrl: z.string().nullable(),
  maxGuests: z.number(),
  accessibility: z.string(),
  program: z.array(z.object({ time: z.string(), title: z.string(), icon: z.string().nullable() })),
  rsvpDeadline: z.string(),
  myRsvp: rsvpSchema.nullable(),
  version: z.number(),
})

export type CalendarItemDetail = z.infer<typeof calendarItemDetailSchema>
export type RsvpStatus = z.infer<typeof rsvpStatusSchema>
export type Rsvp = z.infer<typeof rsvpSchema>
export type EventDetail = z.infer<typeof eventSchema>
