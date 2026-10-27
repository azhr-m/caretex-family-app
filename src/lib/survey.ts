import type { Answer, Question } from '@/api/schemas/surveys'

export type Answers = Record<string, Answer>

/** A question with `showIf` is visible only when the referenced answer equals the value. */
export const isVisible = (q: Question, answers: Answers) => !q.showIf || answers[q.showIf.questionId] === q.showIf.equals

export const visibleQuestions = (questions: Question[], answers: Answers) =>
  questions.filter((q) => isVisible(q, answers))

/**
 * Drops answers of questions that are hidden by the current answers. Repeats until stable, because
 * removing one answer can hide a question that depended on it.
 */
export function pruneHidden(questions: Question[], answers: Answers): Answers {
  let current = answers
  for (;;) {
    const hidden = questions.filter((q) => !isVisible(q, current) && q.id in current)
    if (!hidden.length) return current
    current = Object.fromEntries(Object.entries(current).filter(([id]) => !hidden.some((q) => q.id === id)))
  }
}

export function isAnswered(a: Answer | undefined): boolean {
  if (a === undefined || a === null) return false
  if (typeof a === 'string') return a.trim() !== ''
  if (Array.isArray(a)) return a.length > 0
  return true
}

/** i18n key (surveys namespace) of the problem with an answer, or null when it can be left as is. */
export function answerError(q: Question, a: Answer | undefined): { key: string; values?: Record<string, number> } | null {
  if (!isAnswered(a)) return q.required ? { key: 'question.required' } : null
  if (q.type === 'multiple' && Array.isArray(a)) {
    if (q.min && a.length < q.min) return { key: 'question.chooseMin', values: { count: q.min } }
    if (q.max && a.length > q.max) return { key: 'question.chooseMax', values: { count: q.max } }
  }
  if (q.type === 'date' && a && typeof a === 'object' && 'date' in a) {
    if ((q.minDate && a.date < q.minDate) || (q.maxDate && a.date > q.maxDate)) return { key: 'question.dateRange' }
  }
  if (q.type === 'text' && typeof a === 'string' && a.length > q.maxLength) return { key: 'question.tooLong' }
  return null
}

/**
 * Where "Continue survey" lands: the first unanswered question after the last answered one (so a
 * skipped optional question doesn't trap you), else any required question still open, else review.
 */
export function resumeTarget(questions: Question[], answers: Answers): string | 'review' {
  const visible = visibleQuestions(questions, answers)
  const lastAnswered = visible.findLastIndex((q) => isAnswered(answers[q.id]))
  const next = visible.slice(lastAnswered + 1).find((q) => !isAnswered(answers[q.id]))
  if (next) return next.id
  return visible.find((q) => q.required && !isAnswered(answers[q.id]))?.id ?? 'review'
}

export const answeredCount = (questions: Question[], answers: Answers) =>
  visibleQuestions(questions, answers).filter((q) => isAnswered(answers[q.id])).length
