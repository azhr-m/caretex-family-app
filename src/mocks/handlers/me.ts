import { HttpResponse, http } from 'msw'
import { centerPublicFixture } from '../fixtures/center'
import { memberFixture } from '../fixtures/member'
import { apiError, langOf, url } from '../http'
import { currentScenario } from '../scenarios'

const authed = (request: Request) => request.headers.get('Authorization')?.startsWith('Bearer ')

export const meHandlers = [
  http.get(url('/me'), ({ request }) => {
    if (!authed(request)) return apiError(401, 'TOKEN_EXPIRED', 'Access token expired')
    return HttpResponse.json(
      memberFixture(langOf(request), { singleResident: currentScenario() === 'singleResident' }),
    )
  }),

  http.get(url('/center/public'), ({ request }) => HttpResponse.json(centerPublicFixture(langOf(request)))),
]
