import { z } from 'zod'

export const surveyStatusSchema = z.enum(['not_started', 'draft', 'submitted', 'closed'])

export const surveySummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  anonymous: z.boolean(),
  questionCount: z.number(),
  estimatedMinutes: z.number(),
  closesAt: z.string(),
  status: surveyStatusSchema,
  answeredCount: z.number(),
})

const option = z.object({ id: z.string(), label: z.string() })

const base = z.object({
  id: z.string(),
  order: z.number(),
  required: z.boolean(),
  title: z.string(),
  help: z.string().nullable(),
  showIf: z.object({ questionId: z.string(), equals: z.union([z.string(), z.boolean(), z.number()]) }).nullable(),
})

export const questionSchema = z.discriminatedUnion('type', [
  base.extend({ type: z.literal('single'), options: z.array(option) }),
  base.extend({
    type: z.literal('multiple'),
    options: z.array(option),
    min: z.number().optional(),
    max: z.number().optional(),
  }),
  base.extend({ type: z.literal('yes_no') }),
  base.extend({
    type: z.literal('number'),
    min: z.number(),
    max: z.number(),
    minLabel: z.string(),
    maxLabel: z.string(),
  }),
  base.extend({ type: z.literal('stars'), max: z.number(), labels: z.array(z.string()) }),
  base.extend({
    type: z.literal('satisfaction'),
    options: z.array(option.extend({ level: z.number().int().min(1).max(5) })),
  }),
  base.extend({ type: z.literal('text'), maxLength: z.number(), placeholder: z.string().nullable() }),
  base.extend({
    type: z.literal('date'),
    minDate: z.string().nullable(),
    maxDate: z.string().nullable(),
    allowNone: z.boolean(),
    noneLabel: z.string().nullable(),
  }),
  base.extend({ type: z.literal('dropdown'), options: z.array(option) }),
])

export const answerSchema = z.union([
  z.string(),
  z.array(z.string()),
  z.boolean(),
  z.number(),
  z.object({ date: z.string() }),
  z.object({ none: z.literal(true) }),
  z.null(),
])

export const surveyDetailSchema = surveySummarySchema.extend({
  description: z.string(),
  questions: z.array(questionSchema),
  version: z.number(),
})

export const surveyDraftSchema = z.object({
  answers: z.record(z.string(), answerSchema),
  currentQuestionId: z.string().nullable(),
  savedAt: z.string(),
})

export const draftSavedSchema = z.object({ savedAt: z.string() })
export const submitResultSchema = z.object({ submittedAt: z.string(), receipt: z.string() })

export type SurveySummary = z.infer<typeof surveySummarySchema>
export type SurveyDetail = z.infer<typeof surveyDetailSchema>
export type Question = z.infer<typeof questionSchema>
export type Answer = z.infer<typeof answerSchema>
export type SurveyDraftDto = z.infer<typeof surveyDraftSchema>
