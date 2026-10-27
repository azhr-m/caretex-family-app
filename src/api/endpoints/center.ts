import { api } from '../client'
import { centerPublicSchema } from '../schemas/center'

export const getCenterPublic = (signal?: AbortSignal) =>
  api('/center/public', { schema: centerPublicSchema, auth: false, signal })
