import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { departmentCodeSchema } from '@/api/schemas/common'
import { StubScreen } from '@/components/app/ComingSoon'

/** `dept`, `subject` and `ref` ("update:<id>") prefill the form when opened from another screen. */
export const Route = createFileRoute('/_auth/r/$rid/staff/new/')({
  validateSearch: z.object({
    step: z.enum(['department', 'message']).optional().catch(undefined),
    dept: departmentCodeSchema.optional().catch(undefined),
    subject: z.string().max(200).optional().catch(undefined),
    ref: z
      .string()
      .regex(/^[a-z_]+:[\w-]+$/)
      .optional()
      .catch(undefined),
  }),
  component: () => <StubScreen phase={3} route="/r/$rid/staff/new" />,
})
