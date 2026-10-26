import { HttpResponse, http } from 'msw'
import { devDemoItems } from '../fixtures/dev'
import { langOf, url } from '../http'
import { currentScenario } from '../scenarios'

export const devHandlers = [
  http.get(url('/residents/:rid/dev-demo'), ({ request }) => {
    const lang = langOf(request)
    const items = currentScenario() === 'emptyEverything' ? [] : devDemoItems
    return HttpResponse.json({
      items: items.map((i) => ({ ...i, title: i.title[lang] })),
      nextCursor: null,
    })
  }),
]
