import { createFileRoute } from '@tanstack/react-router'
import { DocumentDoneScreen } from '@/features/documents/DocumentDoneScreen'

export const Route = createFileRoute('/_auth/r/$rid/more/documents/$docId/done')({
  component: function DocumentDoneScreenRoute() {
    const { rid, docId } = Route.useParams()
    return <DocumentDoneScreen rid={rid} docId={docId} />
  },
})
