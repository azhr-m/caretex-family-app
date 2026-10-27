import { infiniteQueryOptions, queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  approveDocument,
  confirmDocumentRead,
  confirmFeedRead,
  getDocument,
  getDocuments,
  getFeed,
  getFeedItem,
  getSurvey,
  getSurveyDraft,
  getSurveys,
  putRsvp,
  signDocument,
  submitSurvey,
  type DocumentFilters,
  type FeedFilters,
  type RsvpInput,
} from '../endpoints/more'
import { keys } from '../keys'
import type { Answer } from '../schemas/surveys'

/**
 * Legal actions (sign, approve, confirm read, survey submit, RSVP) never queue offline:
 * their buttons are disabled while offline instead.
 */
const LEGAL = { networkMode: 'online', retry: false } as const

export const documentsQuery = (rid: string, f: DocumentFilters) =>
  queryOptions({ queryKey: keys.documents(rid, f), queryFn: ({ signal }) => getDocuments(rid, f, signal) })

export const documentQuery = (id: string) =>
  queryOptions({
    queryKey: keys.document(id),
    queryFn: ({ signal }) => getDocument(id, signal),
    refetchInterval: 60_000,
  })

/**
 * Waits for the document itself to refetch, so the result screen (shown right after) reads the
 * completed state rather than the cached pending one.
 */
function useDocumentDone(rid: string, id: string) {
  const qc = useQueryClient()
  return async () => {
    void qc.invalidateQueries({ queryKey: ['documents', rid] })
    void qc.invalidateQueries({ queryKey: keys.dashboard(rid) })
    await qc.invalidateQueries({ queryKey: keys.document(id) })
  }
}

export function useSignDocument(rid: string, id: string) {
  const done = useDocumentDone(rid, id)
  return useMutation({
    ...LEGAL,
    mutationFn: ({ png, version }: { png: string; version: number }) => signDocument(id, png, version),
    onSuccess: done,
  })
}

export function useApproveDocument(rid: string, id: string) {
  const done = useDocumentDone(rid, id)
  return useMutation({
    ...LEGAL,
    mutationFn: ({ decision, reason }: { decision: 'approved' | 'declined'; reason?: string }) =>
      approveDocument(id, decision, reason),
    onSuccess: done,
  })
}

export function useConfirmDocumentRead(rid: string, id: string) {
  const done = useDocumentDone(rid, id)
  return useMutation({ ...LEGAL, mutationFn: () => confirmDocumentRead(id), onSuccess: done })
}

export const surveysQuery = (rid: string, state: 'active' | 'completed') =>
  queryOptions({ queryKey: keys.surveys(rid, state), queryFn: ({ signal }) => getSurveys(rid, state, signal) })

export const surveyQuery = (id: string) =>
  queryOptions({ queryKey: keys.survey(id), queryFn: ({ signal }) => getSurvey(id, signal), staleTime: 5 * 60_000 })

export const surveyDraftQuery = (id: string) =>
  queryOptions({ queryKey: keys.surveyDraft(id), queryFn: ({ signal }) => getSurveyDraft(id, signal) })

export function useSubmitSurvey(rid: string, id: string) {
  const qc = useQueryClient()
  return useMutation({
    ...LEGAL,
    mutationFn: ({ answers, key }: { answers: Record<string, Answer>; key: string }) => submitSurvey(id, answers, key),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['surveys', rid] })
      void qc.invalidateQueries({ queryKey: keys.survey(id) })
      void qc.invalidateQueries({ queryKey: keys.surveyDraft(id) })
      void qc.invalidateQueries({ queryKey: keys.dashboard(rid) })
    },
  })
}

export const feedQuery = (f: FeedFilters) =>
  infiniteQueryOptions({
    queryKey: keys.feed(f),
    queryFn: ({ pageParam, signal }) => getFeed(f, pageParam, signal),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  })

export const feedItemQuery = (id: string) =>
  queryOptions({ queryKey: keys.feedItem(id), queryFn: ({ signal }) => getFeedItem(id, signal) })

export function useConfirmFeedRead(rid: string, id: string) {
  const qc = useQueryClient()
  return useMutation({
    ...LEGAL,
    mutationFn: () => confirmFeedRead(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: keys.feedItem(id) })
      void qc.invalidateQueries({ queryKey: ['feed'] })
      void qc.invalidateQueries({ queryKey: keys.dashboard(rid) })
    },
  })
}

export function useRsvp(rid: string, eventId: string) {
  const qc = useQueryClient()
  return useMutation({
    ...LEGAL,
    mutationFn: (body: RsvpInput) => putRsvp(eventId, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: keys.event(eventId) })
      void qc.invalidateQueries({ queryKey: ['feed'] })
      void qc.invalidateQueries({ queryKey: ['calendar', rid] })
      void qc.invalidateQueries({ queryKey: keys.dashboard(rid) })
    },
  })
}
