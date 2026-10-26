import { queryOptions, useQuery } from '@tanstack/react-query'
import { useSessionStore } from '@/stores/session'
import { getMe } from '../endpoints/me'
import { keys } from '../keys'

/** Also mirrors the member into the session store, which guards read synchronously. */
export const meQuery = () =>
  queryOptions({
    queryKey: keys.me(),
    queryFn: async ({ signal }) => {
      const member = await getMe(signal)
      useSessionStore.getState().setMember(member)
      return member
    },
  })

export function useMember() {
  const fallback = useSessionStore((s) => s.member)
  const { data } = useQuery({ ...meQuery(), enabled: useSessionStore((s) => !!s.accessToken) })
  return data ?? fallback
}
