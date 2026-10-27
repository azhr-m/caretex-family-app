import { createFileRoute } from '@tanstack/react-router'
import { PaymentsScreen } from '@/features/account/PaymentsScreen'

export const Route = createFileRoute('/_auth/r/$rid/more/payments')({
  component: function PaymentsScreenRoute() {
    const { rid } = Route.useParams()
    return <PaymentsScreen rid={rid} />
  },
})
