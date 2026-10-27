import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useRef } from 'react'
import { putSurveyDraft } from '@/api/endpoints/more'
import { keys } from '@/api/keys'
import { surveyDraftQuery } from '@/api/queries/more'
import type { Answer, Question } from '@/api/schemas/surveys'
import { pruneHidden, type Answers } from '@/lib/survey'
import { selectOnline, useNetworkStore } from '@/stores/network'
import { useSurveyDraftsStore } from '@/stores/surveyDrafts'

const SYNC_DELAY_MS = 1000
const EMPTY: Answers = {}

/**
 * Answers live in the persisted local draft (so a closed tab loses nothing) and are mirrored to the
 * server. Whichever copy is newer wins when the survey opens.
 */
export function useSurveyAnswers(surveyId: string, questions: Question[]) {
  const local = useSurveyDraftsStore((s) => s.drafts[surveyId])
  const saveDraft = useSurveyDraftsStore((s) => s.saveDraft)
  const server = useQuery(surveyDraftQuery(surveyId))
  const serverNewer =
    server.data != null && (!local || Date.parse(server.data.savedAt) > local.savedAt)

  useEffect(() => {
    if (serverNewer && server.data) {
      saveDraft(surveyId, { answers: server.data.answers, currentQuestionId: server.data.currentQuestionId })
    }
  }, [serverNewer, server.data, saveDraft, surveyId])

  const answers = serverNewer ? (server.data?.answers ?? EMPTY) : (local?.answers ?? EMPTY)
  const currentQuestionId = serverNewer ? (server.data?.currentQuestionId ?? null) : (local?.currentQuestionId ?? null)

  const setAnswer = useCallback(
    (questionId: string, value: Answer) => {
      const current = useSurveyDraftsStore.getState().drafts[surveyId]?.answers ?? answers
      const next = pruneHidden(questions, { ...current, [questionId]: value })
      saveDraft(surveyId, { answers: next, currentQuestionId: questionId })
    },
    [answers, questions, saveDraft, surveyId],
  )

  const setCurrent = useCallback(
    (questionId: string) => {
      const d = useSurveyDraftsStore.getState().drafts[surveyId]
      saveDraft(surveyId, { answers: d?.answers ?? answers, currentQuestionId: questionId })
    },
    [answers, saveDraft, surveyId],
  )

  return { answers, currentQuestionId, setAnswer, setCurrent, ready: !server.isPending }
}

/**
 * Pushes the local draft to `PUT /surveys/:id/draft` 1 s after the last change, and again when the
 * connection comes back. `syncNow` is for "Save draft" / "Exit".
 */
export function useDraftSync(surveyId: string) {
  const draft = useSurveyDraftsStore((s) => s.drafts[surveyId])
  const online = useNetworkStore(selectOnline)
  const qc = useQueryClient()
  const synced = useRef<number>(0)

  const push = useCallback(async () => {
    const d = useSurveyDraftsStore.getState().drafts[surveyId]
    if (!d || d.savedAt <= synced.current) return
    const savedAt = d.savedAt
    const res = await putSurveyDraft(surveyId, d.answers, d.currentQuestionId)
    synced.current = savedAt
    qc.setQueryData(keys.surveyDraft(surveyId), { ...d, savedAt: res.savedAt })
  }, [qc, surveyId])

  useEffect(() => {
    if (!online || !draft || draft.savedAt <= synced.current) return
    const id = setTimeout(() => void push().catch(() => undefined), SYNC_DELAY_MS)
    return () => clearTimeout(id)
  }, [draft, online, push])

  return { syncNow: () => (online ? push() : Promise.resolve()) }
}
