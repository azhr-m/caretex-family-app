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
