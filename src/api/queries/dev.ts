import { queryOptions } from '@tanstack/react-query'
import { getDevDemo } from '../endpoints/dev'
import { keys } from '../keys'

export const devDemoQuery = (residentId: string) =>
  queryOptions({
    queryKey: keys.devDemo(residentId),
    queryFn: ({ signal }) => getDevDemo(residentId, signal),
  })
