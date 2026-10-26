import { z } from 'zod'

export const demoItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: z.enum(['new', 'in_progress', 'completed']),
  updatedAt: z.string(),
})

export const demoListSchema = z.object({ items: z.array(demoItemSchema), nextCursor: z.string().nullable() })

export type DemoItem = z.infer<typeof demoItemSchema>
