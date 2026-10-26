import { api } from '../client'
import { demoListSchema } from '../schemas/dev'

/** Dev-only resident-scoped list used to exercise the network simulator. */
export function getDevDemo(residentId: string, signal?: AbortSignal) {
  return api(`/residents/${encodeURIComponent(residentId)}/dev-demo`, { schema: demoListSchema, signal })
}
