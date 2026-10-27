import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Answer } from '@/api/schemas/surveys'
import { localJSON } from './storage'

export type SurveyAnswer = Answer

export type SurveyDraft = {
  answers: Record<string, SurveyAnswer>
  currentQuestionId: string | null
  savedAt: number
}

type SurveyDraftsState = {
  drafts: Record<string, SurveyDraft>
  saveDraft: (surveyId: string, draft: Omit<SurveyDraft, 'savedAt'>) => void
  removeDraft: (surveyId: string) => void
  clear: () => void
}

export const useSurveyDraftsStore = create<SurveyDraftsState>()(
  persist(
    (set) => ({
      drafts: {},
      saveDraft: (surveyId, draft) =>
        set((s) => ({ drafts: { ...s.drafts, [surveyId]: { ...draft, savedAt: Date.now() } } })),
      removeDraft: (surveyId) =>
        set((s) => {
          const { [surveyId]: _removed, ...rest } = s.drafts
          return { drafts: rest }
        }),
      clear: () => set({ drafts: {} }),
    }),
    { name: 'caretex.surveyDrafts', storage: localJSON },
  ),
)
