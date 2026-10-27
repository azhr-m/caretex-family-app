import { describe, expect, it } from 'vitest'
import type { Question } from '@/api/schemas/surveys'
import { answerError, answeredCount, isAnswered, pruneHidden, resumeTarget, visibleQuestions } from './survey'

const base = { order: 0, required: true, title: '', help: null, showIf: null }
const Q: Question[] = [
  { ...base, id: 'q1', type: 'yes_no' },
  { ...base, id: 'q1a', type: 'yes_no', showIf: { questionId: 'q1', equals: false } },
  { ...base, id: 'q1b', type: 'text', required: false, maxLength: 10, placeholder: null, showIf: { questionId: 'q1a', equals: true } },
  { ...base, id: 'q2', type: 'number', min: 0, max: 10, minLabel: '', maxLabel: '' },
  { ...base, id: 'q3', type: 'multiple', options: [], min: 2, max: 3 },
  { ...base, id: 'q4', type: 'text', required: false, maxLength: 5, placeholder: null },
]

describe('survey engine', () => {
  it('shows follow-ups only when their condition holds', () => {
    expect(visibleQuestions(Q, {}).map((q) => q.id)).toEqual(['q1', 'q2', 'q3', 'q4'])
    expect(visibleQuestions(Q, { q1: false }).map((q) => q.id)).toEqual(['q1', 'q1a', 'q2', 'q3', 'q4'])
    expect(visibleQuestions(Q, { q1: false, q1a: true }).map((q) => q.id)).toContain('q1b')
  })

  it('drops answers of hidden questions, including chains', () => {
    const answers = { q1: true, q1a: true, q1b: 'note', q2: 4 }
    expect(pruneHidden(Q, answers)).toEqual({ q1: true, q2: 4 })
    expect(pruneHidden(Q, { q1: false, q1a: true, q1b: 'note' })).toEqual({ q1: false, q1a: true, q1b: 'note' })
  })

  it('treats 0 and false as answers, blank text and empty lists as not', () => {
    expect(isAnswered(0)).toBe(true)
    expect(isAnswered(false)).toBe(true)
    expect(isAnswered('  ')).toBe(false)
    expect(isAnswered([])).toBe(false)
    expect(isAnswered(null)).toBe(false)
  })

  it('validates required, min/max choices and length', () => {
    expect(answerError(Q[0]!, undefined)?.key).toBe('question.required')
    expect(answerError(Q[4]!, ['a'])).toEqual({ key: 'question.chooseMin', values: { count: 2 } })
    expect(answerError(Q[4]!, ['a', 'b'])).toBeNull()
    expect(answerError(Q[5]!, undefined)).toBeNull()
    expect(answerError(Q[5]!, 'too long')?.key).toBe('question.tooLong')
  })

  it('resumes after the last answer, skipping past optional gaps', () => {
    expect(resumeTarget(Q, {})).toBe('q1')
    expect(resumeTarget(Q, { q1: true })).toBe('q2')
    expect(resumeTarget(Q, { q1: true, q2: 3, q3: ['a', 'b'] })).toBe('q4')
    expect(resumeTarget(Q, { q1: true, q2: 3, q3: ['a', 'b'], q4: 'x' })).toBe('review')
    // An optional question skipped earlier doesn't pull you back, a required one does.
    expect(resumeTarget(Q, { q1: true, q3: ['a', 'b'], q4: 'x' })).toBe('q2')
    expect(answeredCount(Q, { q1: false, q1a: true })).toBe(2)
  })
})
