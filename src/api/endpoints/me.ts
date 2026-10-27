import { api } from '../client'
import { memberSchema } from '../schemas/me'

export const getMe = (signal?: AbortSignal) => api('/me', { schema: memberSchema, signal })
