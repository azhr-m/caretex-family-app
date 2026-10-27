import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { CircleAlert, EyeOff, Pencil, Send, UserRound, WifiOff } from 'lucide-react'
import { useRef, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { isApiError } from '@/api/errors'
import { surveyDraftQuery, surveyQuery, useSubmitSurvey } from '@/api/queries/more'
import type { SurveyDetail } from '@/api/schemas/surveys'
import { ActionBar } from '@/components/app/ActionBar'
import { AppFrame, ScreenContent } from '@/components/app/AppFrame'
import { TopBar } from '@/components/app/TopBar'
import { Alert } from '@/components/common/Alert'
import { InfoBox } from '@/components/common/Card'
import { Ltr } from '@/components/common/Ltr'
import { QueryBoundary } from '@/components/states/QueryBoundary'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { dateTime } from '@/lib/format'
import { answerError, pruneHidden, visibleQuestions, type Answers } from '@/lib/survey'
import { cn, uuid } from '@/lib/utils'
import { selectOnline, useNetworkStore } from '@/stores/network'
import { useSurveyDraftsStore } from '@/stores/surveyDrafts'
import { answerText } from './answers'
import { useSurveyAnswers } from './useSurveyDraft'

export function SurveyReviewScreen({ rid, surveyId }: { rid: string; surveyId: string }) {
  const { t } = useTranslation('surveys')
  const query = useQuery(surveyQuery(surveyId))
  const readOnly = query.data?.status === 'submitted' || query.data?.status === 'closed'
  return (
    <AppFrame>
      <TopBar
        title={readOnly ? t('review.readOnlyTitle') : t('review.topTitle')}
        backLabel={t('review.back')}
        fallbackHref={`/r/${rid}/more/surveys`}
      />
      <QueryBoundary query={query} skeleton={<Skeleton className="m-4 h-96 rounded-[18px]" />}>
        {(s) => (readOnly ? <ReadOnly survey={s} /> : <Editable survey={s} rid={rid} />)}
      </QueryBoundary>
    </AppFrame>
  )
}

function ReadOnly({ survey: s }: { survey: SurveyDetail }) {
  const { t } = useTranslation('surveys')
  const final = useQuery(surveyDraftQuery(s.id))
  return (
    <ScreenContent className="flex flex-col gap-4">
      <h1 className="text-title-md m-0 font-extrabold">{s.title}</h1>
      <QueryBoundary query={final} skeleton={<Skeleton className="h-64 w-full rounded-[18px]" />}>
        {(d) => (
          <>
            {d && (
              <p className="text-secondary text-text-2 m-0">
                <Trans t={t} i18nKey="review.submittedOn" values={{ date: dateTime(d.savedAt) }} components={{ ltr: <Ltr /> }} />
              </p>
            )}
            <AnswerList survey={s} answers={d?.answers ?? {}} />
          </>
        )}
      </QueryBoundary>
    </ScreenContent>
  )
}

function Editable({ survey: s, rid }: { survey: SurveyDetail; rid: string }) {
  const { t } = useTranslation(['surveys', 'states'])
  const navigate = useNavigate()
  const { answers, ready } = useSurveyAnswers(s.id, s.questions)
  const submit = useSubmitSurvey(rid, s.id)
  const online = useNetworkStore(selectOnline)
  const [missing, setMissing] = useState<string[]>([])
  const [failure, setFailure] = useState<'deadline' | 'generic' | null>(null)
  const key = useRef(uuid())

  if (!ready) return <Skeleton className="m-4 h-96 rounded-[18px]" />

  const send = async () => {
    const final = pruneHidden(s.questions, answers)
    const open = visibleQuestions(s.questions, final).filter((q) => answerError(q, final[q.id]))
    if (open.length) {
      setMissing(open.map((q) => q.id))
      return
    }
    setMissing([])
    setFailure(null)
    try {
      await submit.mutateAsync({ answers: final, key: key.current })
      useSurveyDraftsStore.getState().removeDraft(s.id)
      await navigate({ to: '/r/$rid/more/surveys/$surveyId/done', params: { rid, surveyId: s.id }, replace: true })
    } catch (e) {
      if (isApiError(e) && e.code === 'VALIDATION_FAILED' && e.fields) setMissing(Object.keys(e.fields))
      else setFailure(isApiError(e) && e.code === 'DEADLINE_PASSED' ? 'deadline' : 'generic')
    }
  }

  return (
    <>
      <ScreenContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-title-md m-0 font-extrabold">{t('review.title')}</h1>
          <p className="text-secondary text-text-2 m-0">{t('review.sub')}</p>
        </div>
        {missing.length > 0 && <Alert title={t('review.missing')} />}
        <AnswerList survey={s} answers={answers} editable rid={rid} missing={missing} />
        <InfoBox icon={s.anonymous ? EyeOff : UserRound}>
          {s.anonymous ? t('review.anonReminder') : t('review.identReminder')}
        </InfoBox>
        {failure === 'deadline' && <Alert tone="amber" title={t('states:deadline', { date: dateTime(s.closesAt) })} />}
        {failure === 'generic' && <Alert title={t('states:mutationError.title')}>{t('states:mutationError.body')}</Alert>}
      </ScreenContent>
      <ActionBar>
        <Button block icon={Send} loading={submit.isPending} disabled={!online || failure === 'deadline'} onClick={() => void send()}>
          {t('review.submit')}
        </Button>
        {!online && (
          <p className="text-meta text-text-2 m-0 flex items-center justify-center gap-1.5">
            <WifiOff aria-hidden size={15} />
            {t('review.offline')}
          </p>
        )}
      </ActionBar>
    </>
  )
}

function AnswerList({
  survey: s,
  answers,
  editable = false,
  rid,
  missing = [],
}: {
  survey: SurveyDetail
  answers: Answers
  editable?: boolean
  rid?: string
  missing?: string[]
}) {
  const { t } = useTranslation('surveys')
  const visible = visibleQuestions(s.questions, answers)
  return (
    <ol className="rounded-card border-border bg-surface m-0 flex list-none flex-col border p-0">
      {visible.map((q, i) => {
        const text = answerText(q, answers[q.id], t)
        const bad = missing.includes(q.id)
        return (
          <li
            key={q.id}
            className={cn('border-border flex items-start gap-3 border-b px-3.5 py-3 last:border-b-0', bad && 'bg-red-bg')}
          >
            <span className="bg-surface-2 text-tag flex size-7 shrink-0 items-center justify-center rounded-full font-extrabold tabular-nums">
              {i + 1}
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-secondary text-text-2 font-bold wrap-break-word">{q.title}</span>
              {text ? (
                <span className="text-body-sm font-extrabold whitespace-pre-line wrap-break-word">{text}</span>
              ) : (
                <span className={cn('text-body-sm', bad ? 'text-danger flex items-center gap-1 font-bold' : 'text-text-2 italic')}>
                  {bad && <CircleAlert aria-hidden size={15} />}
                  {bad ? t('question.required') : t('review.noAnswer')}
                </span>
              )}
            </div>
            {editable && rid && (
              <Link
                to="/r/$rid/more/surveys/$surveyId/q/$questionId"
                params={{ rid, surveyId: s.id, questionId: q.id }}
                search={{ review: true }}
                className="text-link flex min-h-11 min-w-11 shrink-0 flex-col items-center justify-center gap-0.5"
              >
                <Pencil aria-hidden size={17} />
                <span className="text-micro font-extrabold">
                  {t('review.edit')}
                  <span className="sr-only">, {t('review.editSr', { n: i + 1 })}</span>
                </span>
              </Link>
            )}
          </li>
        )
      })}
    </ol>
  )
}

