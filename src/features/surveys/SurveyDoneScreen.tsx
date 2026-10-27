import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { CircleCheck, ClipboardList, EyeOff, HeartHandshake, House, ListChecks, UserRound } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { centerPublicQuery } from '@/api/queries/center'
import { useMember } from '@/api/queries/me'
import { surveyDraftQuery, surveyQuery } from '@/api/queries/more'
import { AppFrame } from '@/components/app/AppFrame'
import { ListGroup } from '@/components/common/ListRow'
import { SummaryRow } from '@/components/common/SummaryRow'
import { QueryBoundary } from '@/components/states/QueryBoundary'
import { ResultScreen } from '@/components/states/states'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { bidiIsolate, dateTime } from '@/lib/format'
import { answeredCount, visibleQuestions } from '@/lib/survey'

export function SurveyDoneScreen({ rid, surveyId }: { rid: string; surveyId: string }) {
  const { t } = useTranslation('surveys')
  const survey = useQuery(surveyQuery(surveyId))
  const final = useQuery(surveyDraftQuery(surveyId)).data
  const member = useMember()
  const center = useQuery(centerPublicQuery()).data
  return (
    <AppFrame>
      <QueryBoundary query={survey} skeleton={<Skeleton className="m-6 h-80 rounded-[18px]" />}>
        {(s) => {
          const answers = final?.answers ?? {}
          return (
            <ResultScreen
              icon={HeartHandshake}
              tone="green"
              statusLabel={final ? t('thanks.chip', { date: bidiIsolate(dateTime(final.savedAt)) }) : undefined}
              statusIcon={CircleCheck}
              title={t('thanks.title', { name: member?.firstName ?? '' })}
              body={
                s.anonymous
                  ? t('thanks.bodyAnon', { center: center?.name ?? '' })
                  : t('thanks.bodyIdent', { center: center?.name ?? '' })
              }
              actions={
                <>
                  <Button asChild block>
                    <Link to="/r/$rid/more/surveys" params={{ rid }} replace>
                      <ClipboardList aria-hidden size={20} />
                      {t('thanks.back')}
                    </Link>
                  </Button>
                  <Button asChild variant="secondary" block>
                    <Link to="/r/$rid/home" params={{ rid }} replace>
                      <House aria-hidden size={20} />
                      {t('thanks.home')}
                    </Link>
                  </Button>
                </>
              }
            >
              <ListGroup>
                <SummaryRow icon={ClipboardList} label={t('thanks.survey')}>
                  {s.title}
                </SummaryRow>
                <SummaryRow icon={ListChecks} label={t('thanks.answered')}>
                  {t('thanks.answeredValue', {
                    answered: answeredCount(s.questions, answers),
                    total: visibleQuestions(s.questions, answers).length,
                  })}
                </SummaryRow>
                <SummaryRow icon={s.anonymous ? EyeOff : UserRound} label={t('thanks.identity')}>
                  {s.anonymous ? t('list.anonymous') : t('list.identified')}
                </SummaryRow>
              </ListGroup>
            </ResultScreen>
          )
        }}
      </QueryBoundary>
    </AppFrame>
  )
}
