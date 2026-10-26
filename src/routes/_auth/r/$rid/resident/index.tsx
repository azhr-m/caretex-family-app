import { createFileRoute, redirect } from '@tanstack/react-router'

// Phase 2 redirects to the first permitted segment.
export const Route = createFileRoute('/_auth/r/$rid/resident/')({
  beforeLoad: ({ params }) => {
    throw redirect({ to: '/r/$rid/resident/general', params, replace: true })
  },
})
