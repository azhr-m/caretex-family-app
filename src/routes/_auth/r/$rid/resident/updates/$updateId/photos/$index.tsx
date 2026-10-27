import { createFileRoute } from '@tanstack/react-router'
import { PhotoViewerScreen } from '@/features/resident/screens/PhotoViewerScreen'

export const Route = createFileRoute('/_auth/r/$rid/resident/updates/$updateId/photos/$index')({
  component: function PhotoViewerRoute() {
    const { rid, updateId, index } = Route.useParams()
    return <PhotoViewerScreen rid={rid} updateId={updateId} index={Number.parseInt(index, 10) || 1} />
  },
})
