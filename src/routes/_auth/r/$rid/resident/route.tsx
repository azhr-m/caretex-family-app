import { Outlet, createFileRoute, useMatches } from '@tanstack/react-router'
import { SegmentBar } from '@/features/resident/components/SegmentBar'

/** Segment bar above the tab segments; detail routes (update, photo viewer) render on their own. */
export const Route = createFileRoute('/_auth/r/$rid/resident')({
  component: function ResidentLayout() {
    const { rid } = Route.useParams()
    const tabs = useMatches({ select: (ms) => ms.at(-1)?.staticData.tabs === true })
    if (!tabs) return <Outlet />
    return (
      <>
        <SegmentBar rid={rid} />
        <Outlet />
      </>
    )
  },
})
