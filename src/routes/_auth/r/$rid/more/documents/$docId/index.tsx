import { createFileRoute } from '@tanstack/react-router'
import { DocumentScreen } from '@/features/documents/DocumentScreen'

export const Route = createFileRoute('/_auth/r/$rid/more/documents/$docId/')({
  component: function DocumentScreenRoute() {
    const { rid, docId } = Route.useParams()
    return <DocumentScreen key={docId} rid={rid} docId={docId} />
  },
})
