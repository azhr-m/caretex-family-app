import { http } from 'msw'
import { apiError, url } from '../http'
import { simulatorHandler } from '../simulator'
import { authHandlers } from './auth'
import { devHandlers } from './dev'
import { meHandlers } from './me'

const notFound = http.all(url('/*'), () => apiError(404, 'NOT_FOUND', 'Not found'))

export const handlers = [simulatorHandler, ...authHandlers, ...meHandlers, ...devHandlers, notFound]
