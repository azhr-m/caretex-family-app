import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { CircleCheck, Eye, Hash, List, Send, Sparkles, Type, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { departmentsQuery, inquiryQuery } from '@/api/queries/inquiries'
import { AppFrame } from '@/components/app/AppFrame'
import { ListGroup } from '@/components/common/ListRow'
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
                <Row icon={Hash} label={t('sent.reference')}>
                  <Ltr>{q.ref}</Ltr>
                </Row>
                <Row icon={DEPARTMENT_META[q.department].icon} label={t('sent.department')}>
                  {deptLabel}
                </Row>
                <Row icon={Type} label={t('sent.subject')}>
                  {q.subject}
                </Row>
                <Row icon={Sparkles} label={t('sent.status')}>
                  {t(`common:status.${INQUIRY_CHIP[q.status]}`)}
                </Row>
              </ListGroup>
            </ResultScreen>
          )
        }}
      </QueryBoundary>
    </AppFrame>
  )
}

function Row({ icon: Icon, label, children }: { icon: LucideIcon; label: string; children: ReactNode }) {
  return (
    <div className="flex min-h-11 items-center gap-3 px-3.5 py-3">
      <Icon aria-hidden size={19} className="text-text-2 shrink-0" />
      <span className="text-secondary text-text-2 min-w-0 flex-1">{label}</span>
      <span className="text-body-sm max-w-[60%] text-end font-bold wrap-break-word">{children}</span>
    </div>
  )
}
