import { z } from 'zod'
import { api } from '../client'
import { isApiError } from '../errors'
import { rsvpSchema } from '../schemas/calendar'
import {
  approveResultSchema,
  confirmReadResultSchema,
  documentDetailSchema,
  documentsPageSchema,
  signResultSchema,
} from '../schemas/documents'
import { confirmReadFeedSchema, feedDetailSchema, feedPageSchema } from '../schemas/feed'
import {
  draftSavedSchema,
  submitResultSchema,
  surveyDetailSchema,
  surveyDraftSchema,
  surveySummarySchema,
  type Answer,
} from '../schemas/surveys'

const qs = (params: Record<string, string | number | boolean | undefined>) => {
  const s = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== '') s.set(k, String(v))
  const str = s.toString()
  return str ? `?${str}` : ''
}
const enc = encodeURIComponent

export type DocumentTab = 'sign' | 'confirm' | 'done'
export type DocumentFilters = { tab: DocumentTab; type?: string; year?: number }

export const getDocuments = (rid: string, f: DocumentFilters, signal?: AbortSignal) =>
  api(`/residents/${enc(rid)}/documents${qs(f)}`, { schema: documentsPageSchema, signal })

export const getDocument = (id: string, signal?: AbortSignal) =>
  api(`/documents/${enc(id)}`, { schema: documentDetailSchema, signal })

export const signDocument = (id: string, signaturePng: string, version: number) =>
  api(`/documents/${enc(id)}/sign`, {
    method: 'POST',
    body: { signaturePng, consentAccepted: true, signedAt: new Date().toISOString() },
    schema: signResultSchema,
    ifMatch: version,
  })

export const approveDocument = (id: string, decision: 'approved' | 'declined', reason?: string) =>
  api(`/documents/${enc(id)}/approve`, {
    method: 'POST',
    body: { decision, ...(reason ? { reason } : {}) },
    schema: approveResultSchema,
  })

export const confirmDocumentRead = (id: string) =>
  api(`/documents/${enc(id)}/confirm-read`, {
    method: 'POST',
    body: { confirmed: true },
    schema: confirmReadResultSchema,
  })

export const getSurveys = (rid: string, state: 'active' | 'completed', signal?: AbortSignal) =>
  api(`/residents/${enc(rid)}/surveys?state=${state}`, {
    schema: z.object({ items: z.array(surveySummarySchema) }),
    signal,
  })

export const getSurvey = (id: string, signal?: AbortSignal) =>
  api(`/surveys/${enc(id)}`, { schema: surveyDetailSchema, signal })

/** 404 means there is no draft yet, which is not an error. */
export const getSurveyDraft = (id: string, signal?: AbortSignal) =>
  api(`/surveys/${enc(id)}/draft`, { schema: surveyDraftSchema, signal }).catch((e: unknown) => {
    if (isApiError(e) && e.code === 'NOT_FOUND') return null
    throw e
  })

export const putSurveyDraft = (id: string, answers: Record<string, Answer>, currentQuestionId: string | null) =>
  api(`/surveys/${enc(id)}/draft`, {
    method: 'PUT',
    body: { answers, currentQuestionId },
    schema: draftSavedSchema,
  })

export const submitSurvey = (id: string, answers: Record<string, Answer>, idempotencyKey: string) =>
  api(`/surveys/${enc(id)}/submit`, {
    method: 'POST',
    body: { answers },
    schema: submitResultSchema,
    idempotencyKey,
  })

export type FeedFilterCategory = 'all' | 'updates' | 'newsletters' | 'activities' | 'events'
export type FeedFilters = { category: FeedFilterCategory; archive?: boolean; q?: string }

export const getFeed = (f: FeedFilters, cursor: string | undefined, signal?: AbortSignal) =>
  api(`/feed${qs({ ...f, cursor })}`, { schema: feedPageSchema, signal })

export const getFeedItem = (id: string, signal?: AbortSignal) =>
  api(`/feed/${enc(id)}`, { schema: feedDetailSchema, signal })

export const confirmFeedRead = (id: string) =>
  api(`/feed/${enc(id)}/confirm-read`, { method: 'POST', schema: confirmReadFeedSchema })

export type RsvpInput = {
  status: 'attending' | 'not_attending' | 'undecided'
  guests: number
  guestNames: string[]
  note: string
}

export const putRsvp = (eventId: string, body: RsvpInput) =>
  api(`/events/${enc(eventId)}/rsvp`, { method: 'PUT', body, schema: rsvpSchema })
