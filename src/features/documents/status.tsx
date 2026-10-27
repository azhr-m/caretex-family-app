import { CircleCheck, CircleX, Eye, PenLine } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { DocumentSummary } from '@/api/schemas/documents'
import { StatusChip } from '@/components/common/StatusChip'

/** Pending: what you need to do (To sign / To approve / To confirm); overdue: red; done: the outcome. */
export function DocumentStatusChip({ doc: d }: { doc: Pick<DocumentSummary, 'status' | 'requiredAction'> }) {
  const { t } = useTranslation('documents')
  switch (d.status) {
    case 'signed':
      return <StatusChip tone="green" icon={CircleCheck} label={t('status.signed')} />
    case 'approved':
      return <StatusChip tone="green" icon={CircleCheck} label={t('status.approved')} />
    case 'declined':
      return <StatusChip tone="slate" icon={CircleX} label={t('status.declined')} />
    case 'read_confirmed':
      return <StatusChip tone="green" icon={CircleCheck} label={t('status.read_confirmed')} />
    case 'overdue':
      return <StatusChip status="overdue" />
    default:
      return d.requiredAction === 'sign' ? (
        <StatusChip status="to_sign" icon={PenLine} />
      ) : d.requiredAction === 'approve' ? (
        <StatusChip status="to_approve" />
      ) : (
        <StatusChip status="to_confirm" icon={Eye} />
      )
  }
}
