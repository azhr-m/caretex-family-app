import { useQuery } from '@tanstack/react-query'
import { Link, Navigate } from '@tanstack/react-router'
import { CircleCheck, Download, FileSignature, FileText, FolderOpen, Hash, UserRound } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { documentQuery } from '@/api/queries/more'
import { AppFrame } from '@/components/app/AppFrame'
import { ListGroup } from '@/components/common/ListRow'
import { Ltr } from '@/components/common/Ltr'
import { SummaryRow } from '@/components/common/SummaryRow'
import { QueryBoundary } from '@/components/states/QueryBoundary'
import { ResultScreen } from '@/components/states/states'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { bidiIsolate, dateTime } from '@/lib/format'

/** Result after signing or approving (design `docSigned` / `docApproved`). */
export function DocumentDoneScreen({ rid, docId }: { rid: string; docId: string }) {
  const { t } = useTranslation(['documents', 'staff'])
  const query = useQuery(documentQuery(docId))
  return (
    <AppFrame>
      <QueryBoundary query={query} skeleton={<Skeleton className="m-6 h-80 rounded-[18px]" />}>
        {(d) => {
          if (!d.completion || (d.status !== 'signed' && d.status !== 'approved')) {
            return <Navigate to="/r/$rid/more/documents/$docId" params={{ rid, docId }} replace />
          }
          const signed = d.status === 'signed'
          const dept = t(`staff:departments.${d.from.department}`)
          return (
            <ResultScreen
              icon={signed ? FileSignature : CircleCheck}
              tone="green"
              statusLabel={t(signed ? 'result.signedChip' : 'result.approvedChip', { date: bidiIsolate(dateTime(d.completion.at)) })}
              statusIcon={CircleCheck}
              title={signed ? t('result.signedTitle') : t('result.approvedTitle')}
              body={signed ? t('result.signedBody', { dept }) : t('result.approvedBody', { dept })}
              actions={
                <>
                  <Button asChild block>
                    <Link to="/r/$rid/more/documents" params={{ rid }} replace>
                      <FolderOpen aria-hidden size={20} />
                      {t('result.back')}
                    </Link>
                  </Button>
                  {signed ? (
                    <Button asChild variant="secondary" block>
                      <a href={d.fileUrl} target="_blank" rel="noreferrer">
                        <Download aria-hidden size={20} />
                        {t('result.downloadSigned')}
                      </a>
                    </Button>
                  ) : (
                    <Button asChild variant="secondary" block>
                      <Link to="/r/$rid/more/documents/$docId" params={{ rid, docId }} replace>
                        <FileText aria-hidden size={20} />
                        {t('result.viewDocument')}
                      </Link>
                    </Button>
                  )}
                </>
              }
            >
              <ListGroup>
                <SummaryRow icon={FileText} label={t('result.document')}>
                  {d.title}
                </SummaryRow>
                <SummaryRow icon={UserRound} label={signed ? t('result.signedBy') : t('result.approvedBy')}>
                  {d.completion.by}
                </SummaryRow>
                <SummaryRow icon={Hash} label={t('result.confirmation')}>
                  <Ltr>{d.completion.confirmationCode}</Ltr>
                </SummaryRow>
              </ListGroup>
            </ResultScreen>
          )
        }}
      </QueryBoundary>
    </AppFrame>
  )
}
