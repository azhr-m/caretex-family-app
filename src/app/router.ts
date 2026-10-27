import { createRouter } from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'
import { routeTree } from '@/routeTree.gen'

export function createAppRouter(queryClient: QueryClient) {
  return createRouter({
    routeTree,
    context: { queryClient },
    defaultPreload: 'intent',
    defaultPendingMs: 300,
    scrollRestoration: true,
    // The tab shell scrolls inside <main>, not the window: new pages start at the top, Back restores.
    scrollToTopSelectors: ['#app-main'],
  })
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createAppRouter>
  }
  interface StaticDataRouteOption {
    /** Route renders inside the AppHeader + TabBar shell. */
    tabs?: boolean
  }
}
