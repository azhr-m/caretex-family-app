import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { CircleCheck, Eye, Hash, List, Send, Sparkles, Type } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { departmentsQuery, inquiryQuery } from '@/api/queries/inquiries'
import { AppFrame } from '@/components/app/AppFrame'
import { ListGroup } from '@/components/common/ListRow'
import { SummaryRow } from '@/components/common/SummaryRow'
import { Ltr } from '@/components/common/Ltr'
import { QueryBoundary } from '@/components/states/QueryBoundary'
import { ResultScreen } from '@/components/states/states'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { DEPARTMENT_META } from '@/lib/departments'
import { bidiIsolate, dateTime } from '@/lib/format'
import { INQUIRY_CHIP } from '@/lib/inquiry'

export function InquirySentScreen({ rid, inquiryId }: { rid: string; inquiryId: string }) {
  const { t } = useTranslation(['staff', 'common'])
  const query = useQuery(inquiryQuery(inquiryId))
  const departments = useQuery(departmentsQuery()).data
  return (
    <AppFrame>
      <QueryBoundary query={query} skeleton={<Skeleton className="m-6 h-80 rounded-[18px]" />}>
        {(q) => {
          const deptLabel = t(`departments.${q.department}`)
          const expected = departments?.find((d) => d.code === q.department)?.expectedResponse
          return (
            <ResultScreen
              icon={Send}
              tone="green"
              statusLabel={t('sent.chip', { date: bidiIsolate(dateTime(q.createdAt)) })}
              statusIcon={CircleCheck}
              title={t('sent.title')}
              body={expected ? t('sent.body', { dept: deptLabel, expected }) : undefined}
              actions={
                <>
                  <Button asChild block>
                    <Link to="/r/$rid/staff/$inquiryId" params={{ rid, inquiryId }} replace>
                      <Eye aria-hidden size={20} />
                      {t('sent.view')}
                    </Link>
                  </Button>
                  <Button asChild variant="secondary" block>
                    <Link to="/r/$rid/staff" params={{ rid }} replace>
                      <List aria-hidden size={20} />
                      {t('sent.back')}
                    </Link>
                  </Button>
                </>
              }
            >
              <ListGroup>
                <SummaryRow icon={Hash} label={t('sent.reference')}>
                  <Ltr>{q.ref}</Ltr>
                </SummaryRow>
                <SummaryRow icon={DEPARTMENT_META[q.department].icon} label={t('sent.department')}>
                  {deptLabel}
                </SummaryRow>
                <SummaryRow icon={Type} label={t('sent.subject')}>
                  {q.subject}
                </SummaryRow>
                <SummaryRow icon={Sparkles} label={t('sent.status')}>
                  {t(`common:status.${INQUIRY_CHIP[q.status]}`)}
                </SummaryRow>
              </ListGroup>
            </ResultScreen>
          )
        }}
      </QueryBoundary>
    </AppFrame>
  )
}
