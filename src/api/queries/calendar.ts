import { keepPreviousData, queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from '@/components/ui/toast'
import i18n from '@/lib/i18n'
import { confirmCalendarItem, getCalendar, getCalendarItem, getEvent } from '../endpoints/calendar'
import { keys } from '../keys'
import type { CalendarItemDetail } from '../schemas/calendar'

export const calendarQuery = (rid: string, from: string, to: string) =>
  queryOptions({
    queryKey: keys.calendar(rid, from, to),
    queryFn: ({ signal }) => getCalendar(rid, from, to, signal),
    placeholderData: keepPreviousData,
  })

export const calendarItemQuery = (id: string) =>
  queryOptions({
    queryKey: keys.calendarItem(id),
    queryFn: ({ signal }) => getCalendarItem(id, signal),
    refetchInterval: 60_000,
  })

export const eventQuery = (id: string) =>
  queryOptions({ queryKey: keys.event(id), queryFn: ({ signal }) => getEvent(id, signal) })

/** Queues offline like replies; `ward` names who gets notified in the toast. */
export function useConfirmItem(rid: string, id: string, ward: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationKey: ['confirm', id],
    scope: { id: `confirm:${id}` },
    mutationFn: (key: string) => confirmCalendarItem(id, key),
    onSuccess: (res) => {
      qc.setQueryData<CalendarItemDetail>(keys.calendarItem(id), (d) =>
        d ? { ...d, confirmation: res.confirmation } : d,
      )
      toast.success({
        title: i18n.t('calendar:appt.confirmedToast'),
        body: i18n.t('calendar:appt.confirmedToastBody', { ward }),
      })
      void qc.invalidateQueries({ queryKey: ['calendar', rid] })
      void qc.invalidateQueries({ queryKey: keys.dashboard(rid) })
    },
  })
}
