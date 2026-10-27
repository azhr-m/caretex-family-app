import { http } from 'msw'
import { apiError, url } from '../http'
import { simulatorHandler } from '../simulator'
import { authHandlers } from './auth'
import { calendarHandlers } from './calendar'
import { devHandlers } from './dev'
import { inquiryHandlers } from './inquiries'
import { meHandlers } from './me'
import { residentHandlers } from './residents'

const notFound = http.all(url('/*'), () => apiError(404, 'NOT_FOUND', 'Not found'))

export const handlers = [simulatorHandler, ...authHandlers, ...meHandlers, ...residentHandlers,
  ...inquiryHandlers,
  ...calendarHandlers,
  ...devHandlers, notFound]
