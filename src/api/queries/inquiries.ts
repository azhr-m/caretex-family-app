import { infiniteQueryOptions, queryOptions, useMutation, useMutationState, useQueryClient } from '@tanstack/react-query'
import { toast } from '@/components/ui/toast'
import i18n from '@/lib/i18n'
import {
  createInquiry,
  getDepartments,
  getInquiries,
  getInquiry,
  markInquiryRead,
  postReply,
  type InquiryFilters,
  type NewInquiry,
} from '../endpoints/inquiries'
import { keys } from '../keys'
import type { Attachment } from '../schemas/common'
import type { InquiryDetail } from '../schemas/inquiries'

export const departmentsQuery = () =>
  queryOptions({ queryKey: keys.departments(), queryFn: ({ signal }) => getDepartments(signal), staleTime: 60 * 60_000 })

export const inquiriesQuery = (rid: string, filters: InquiryFilters) =>
  infiniteQueryOptions({
    queryKey: keys.inquiries(rid, filters),
    queryFn: ({ pageParam, signal }) => getInquiries(rid, filters, pageParam, signal),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  })

export const inquiryQuery = (id: string) =>
  queryOptions({
    queryKey: keys.inquiry(id),
    queryFn: ({ signal }) => getInquiry(id, signal),
    refetchInterval: 60_000,
  })

export function useCreateInquiry(rid: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ body, key }: { body: NewInquiry; key: string }) => createInquiry(rid, body, key),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['inquiries', rid] })
      void qc.invalidateQueries({ queryKey: keys.dashboard(rid) })
    },
  })
}

export type ReplyVars = { text: string; attachments: Attachment[]; key: string; queuedAt: string }

const replyKey = (id: string) => ['reply', id] as const

/**
 * Replies queue while offline (`networkMode: 'online'` pauses them) and send in order on reconnect.
 * `If-Match` is read when the request actually runs, so a queued second reply sees the version the
 * first one produced. Toasts live here (not in `mutate`) so they still show if the thread was left.
 */
export function useReply(rid: string, inquiryId: string, departmentLabel: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationKey: replyKey(inquiryId),
    scope: { id: `reply:${inquiryId}` },
    mutationFn: (v: ReplyVars) =>
      postReply(
        inquiryId,
        { text: v.text, attachmentIds: v.attachments.map((a) => a.id) },
        { ifMatch: qc.getQueryData<InquiryDetail>(keys.inquiry(inquiryId))?.version, idempotencyKey: v.key },
      ),
    onSuccess: (res) => {
      qc.setQueryData<InquiryDetail>(keys.inquiry(inquiryId), (d) =>
        d ? { ...d, status: res.status, version: res.version, timeline: [...d.timeline, res.message] } : d,
      )
      toast.success({
        title: i18n.t('states:toast.sent'),
        body: i18n.t('staff:thread.sentBody', { department: departmentLabel }),
      })
      void qc.invalidateQueries({ queryKey: keys.inquiry(inquiryId) })
      void qc.invalidateQueries({ queryKey: ['inquiries', rid] })
      void qc.invalidateQueries({ queryKey: keys.dashboard(rid) })
    },
  })
}

/** Replies still waiting (paused offline or in flight), oldest first. */
export function usePendingReplies(inquiryId: string) {
  return useMutationState({
    filters: { mutationKey: replyKey(inquiryId), status: 'pending' },
    select: (m) => ({ vars: m.state.variables as ReplyVars, paused: m.state.isPaused }),
  })
}

export function useMarkInquiryRead(rid: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: markInquiryRead,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['inquiries', rid] })
      void qc.invalidateQueries({ queryKey: keys.dashboard(rid) })
    },
  })
}
