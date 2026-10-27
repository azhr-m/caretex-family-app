import { z } from 'zod'
import { rsvpStatusSchema } from './calendar'
import { attachmentSchema, pageSchema } from './common'

export const feedCategorySchema = z.enum(['update', 'newsletter', 'activity', 'event'])

export const feedItemSchema = z.object({
  id: z.string(),
  category: feedCategorySchema,
  title: z.string(),
  excerpt: z.string(),
  publishedAt: z.string(),
  author: z.string(),
  coverUrl: z.string().nullable(),
  requiresReadConfirmation: z.boolean(),
  readConfirmedAt: z.string().nullable(),
  eventId: z.string().nullable(),
  rsvp: rsvpStatusSchema.nullable(),
})

export const feedPageSchema = pageSchema(feedItemSchema)

export const feedDetailSchema = feedItemSchema.extend({
  body: z.string(),
  highlights: z.array(z.string()),
  attachments: z.array(attachmentSchema),
  version: z.number(),
})

export const confirmReadFeedSchema = z.object({ readConfirmedAt: z.string() })

export type FeedCategory = z.infer<typeof feedCategorySchema>
export type FeedItem = z.infer<typeof feedItemSchema>
export type FeedDetail = z.infer<typeof feedDetailSchema>
