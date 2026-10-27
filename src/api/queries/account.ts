import { infiniteQueryOptions, queryOptions, useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query'
import {
  cancelService,
  changePassword,
  commentService,
  createService,
  getBilling,
  getCenter,
  getNotifications,
  getService,
  getServices,
  getServiceTypes,
  markAllNotificationsRead,
  markNotificationRead,
  patchPreferences,
  type NewServiceRequest,
} from '../endpoints/account'
import { keys } from '../keys'
import type { Member, Preferences } from '../schemas/me'
import type { ServiceDetail } from '../schemas/account'

type NotificationsPage = Awaited<ReturnType<typeof getNotifications>>

export const serviceTypesQuery = () =>
  queryOptions({ queryKey: keys.serviceTypes(), queryFn: ({ signal }) => getServiceTypes(signal), staleTime: 60 * 60_000 })

export const servicesQuery = (rid: string) =>
  infiniteQueryOptions({
    queryKey: keys.services(rid),
    queryFn: ({ pageParam, signal }) => getServices(rid, pageParam, signal),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  })

export const serviceQuery = (id: string) =>
  queryOptions({ queryKey: keys.service(id), queryFn: ({ signal }) => getService(id, signal), refetchInterval: 60_000 })

export function useCreateService(rid: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ body, key }: { body: NewServiceRequest; key: string }) => createService(rid, body, key),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: keys.services(rid) })
      void qc.invalidateQueries({ queryKey: keys.dashboard(rid) })
    },
  })
}

export function useCommentService(rid: string, id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ text, key }: { text: string; key: string }) => commentService(id, text, key),
    onSuccess: (entry) => {
      qc.setQueryData<ServiceDetail>(keys.service(id), (d) => (d ? { ...d, log: [entry, ...d.log] } : d))
      void qc.invalidateQueries({ queryKey: keys.services(rid) })
    },
  })
}

export function useCancelService(rid: string, id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (reason?: string) => cancelService(id, reason),
    onSuccess: async () => {
      void qc.invalidateQueries({ queryKey: keys.services(rid) })
      await qc.invalidateQueries({ queryKey: keys.service(id) })
    },
  })
}

export const centerQuery = () =>
  queryOptions({ queryKey: keys.center(), queryFn: ({ signal }) => getCenter(signal), staleTime: 60 * 60_000 })

export const notificationsQuery = () =>
  infiniteQueryOptions({
    queryKey: keys.notifications(),
    queryFn: ({ pageParam, signal }) => getNotifications(pageParam, signal),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  })

/** Bell badge: the unread count that comes with the first notifications page. */
export const notificationsCountQuery = () =>
  queryOptions({
    queryKey: keys.notificationsCount(),
    queryFn: async ({ signal }) => (await getNotifications(undefined, signal)).unreadCount,
  })

/** Optimistic: the row and the bell update at once; both roll back if the server refuses. */
function useOptimisticRead() {
  const qc = useQueryClient()
  return {
    async apply(update: (page: NotificationsPage) => NotificationsPage, countDelta: (c: number) => number) {
      await qc.cancelQueries({ queryKey: keys.notifications() })
      const list = qc.getQueryData<InfiniteData<NotificationsPage>>(keys.notifications())
      const count = qc.getQueryData<number>(keys.notificationsCount())
      qc.setQueryData<InfiniteData<NotificationsPage>>(keys.notifications(), (d) =>
        d ? { ...d, pages: d.pages.map(update) } : d,
      )
      qc.setQueryData<number>(keys.notificationsCount(), (c) => (c === undefined ? c : countDelta(c)))
      return { list, count }
    },
    rollback(ctx?: { list?: InfiniteData<NotificationsPage>; count?: number }) {
      if (!ctx) return
      qc.setQueryData(keys.notifications(), ctx.list)
      qc.setQueryData(keys.notificationsCount(), ctx.count)
    },
    settle() {
      void qc.invalidateQueries({ queryKey: keys.notifications() })
      void qc.invalidateQueries({ queryKey: keys.notificationsCount() })
    },
  }
}

export function useMarkNotificationRead() {
  const o = useOptimisticRead()
  return useMutation({
    mutationFn: markNotificationRead,
    onMutate: (id: string) => {
      const now = new Date().toISOString()
      let changed = false
      return o.apply(
        (p) => ({
          ...p,
          items: p.items.map((n) => {
            if (n.id !== id || n.readAt) return n
            changed = true
            return { ...n, readAt: now }
          }),
        }),
        (c) => (changed ? Math.max(0, c - 1) : c),
      )
    },
    onError: (_e, _v, ctx) => o.rollback(ctx),
    onSettled: () => o.settle(),
  })
}

export function useMarkAllNotificationsRead() {
  const o = useOptimisticRead()
  return useMutation({
    mutationFn: markAllNotificationsRead,
    onMutate: () => {
      const now = new Date().toISOString()
      return o.apply((p) => ({ ...p, unreadCount: 0, items: p.items.map((n) => ({ ...n, readAt: n.readAt ?? now })) }), () => 0)
    },
    onError: (_e, _v, ctx) => o.rollback(ctx),
    onSettled: () => o.settle(),
  })
}

/** Notification and payments toggles: saved optimistically on the member, rolled back on failure. */
export function usePatchPreferences() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: patchPreferences,
    onMutate: async (patch: Partial<Preferences>) => {
      await qc.cancelQueries({ queryKey: keys.me() })
      const before = qc.getQueryData<Member>(keys.me())
      qc.setQueryData<Member>(keys.me(), (m) =>
        m
          ? {
              ...m,
              preferences: {
                ...m.preferences,
                ...patch,
                notifications: { ...m.preferences.notifications, ...patch.notifications },
              },
            }
          : m,
      )
      return { before }
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.before) qc.setQueryData(keys.me(), ctx.before)
    },
    onSuccess: (prefs) => qc.setQueryData<Member>(keys.me(), (m) => (m ? { ...m, preferences: prefs } : m)),
  })
}

export function useChangePassword() {
  return useMutation({
    networkMode: 'online',
    mutationFn: ({ current, next }: { current: string; next: string }) => changePassword(current, next),
  })
}

export const billingQuery = (rid: string) =>
  queryOptions({ queryKey: keys.billing(rid), queryFn: ({ signal }) => getBilling(rid, signal) })
