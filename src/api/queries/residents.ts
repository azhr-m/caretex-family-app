import { infiniteQueryOptions, queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useSessionStore } from '@/stores/session'
import {
  getCarePlan,
  getDashboard,
  getMedical,
  getPermissions,
  getResident,
  getSchedule,
  getUpdate,
  getUpdates,
  markUpdateSeen,
  postVisit,
} from '../endpoints/residents'
import { keys } from '../keys'

export const residentQuery = (rid: string) =>
  queryOptions({ queryKey: keys.resident(rid), queryFn: ({ signal }) => getResident(rid, signal) })

export const permissionsQuery = (rid: string) =>
  queryOptions({ queryKey: keys.permissions(rid), queryFn: ({ signal }) => getPermissions(rid, signal) })

export const dashboardQuery = (rid: string) =>
  queryOptions({ queryKey: keys.dashboard(rid), queryFn: ({ signal }) => getDashboard(rid, signal) })

export const updatesQuery = (rid: string) =>
  infiniteQueryOptions({
    queryKey: keys.updates(rid),
    queryFn: ({ pageParam, signal }) => getUpdates(rid, pageParam, signal),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  })

export const updateQuery = (id: string) =>
  queryOptions({ queryKey: keys.update(id), queryFn: ({ signal }) => getUpdate(id, signal) })

export const medicalQuery = (rid: string) =>
  queryOptions({ queryKey: keys.medical(rid), queryFn: ({ signal }) => getMedical(rid, signal) })

export const carePlanQuery = (rid: string) =>
  queryOptions({ queryKey: keys.carePlan(rid), queryFn: ({ signal }) => getCarePlan(rid, signal) })

export const scheduleQuery = (rid: string, date: string) =>
  queryOptions({
    queryKey: keys.schedule(rid, date),
    queryFn: ({ signal }) => getSchedule(rid, date, signal),
  })

const visited = new Set<string>()

/** `POST /me/visits` once per app session per resident; it defines "Since your last visit". */
export function useRecordVisit(rid: string) {
  const session = useSessionStore((s) => s.refreshToken)
  useEffect(() => {
    const key = `${session}:${rid}`
    if (!session || visited.has(key)) return
    visited.add(key)
    postVisit(rid).catch(() => visited.delete(key))
  }, [session, rid])
}

export function useMarkUpdateSeen(rid: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: markUpdateSeen,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: keys.updates(rid) })
      void qc.invalidateQueries({ queryKey: keys.dashboard(rid) })
      void qc.invalidateQueries({ queryKey: keys.notificationsCount() })
    },
  })
}
