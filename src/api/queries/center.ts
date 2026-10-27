import { queryOptions } from '@tanstack/react-query'
import { getCenterPublic } from '../endpoints/center'
import { keys } from '../keys'

export const centerPublicQuery = () =>
  queryOptions({
    queryKey: keys.centerPublic(),
    queryFn: ({ signal }) => getCenterPublic(signal),
    staleTime: 60 * 60_000,
  })
