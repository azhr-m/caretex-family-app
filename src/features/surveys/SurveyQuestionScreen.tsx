import { useQuery } from '@tanstack/react-query'
import { Navigate, useNavigate } from '@tanstack/react-router'
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  CircleAlert,
  CircleDot,
  CircleHelp,
  Gauge,
  GitBranch,
  List,
  ListChecks,
  LogOut,
  Pencil,
  Save,
  Smile,
  Star,
  StepForward,
  Timer,
  X,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useId, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { surveyQuery } from '@/api/queries/more'
import type { Question, SurveyDetail } from '@/api/schemas/surveys'
import { ActionBar } from '@/components/app/ActionBar'
import { AppFrame, ScreenContent } from '@/components/app/AppFrame'
import { TopBar } from '@/components/app/TopBar'
import { IconTile } from '@/components/common/IconTile'
import { Ltr } from '@/components/common/Ltr'
import { ProgressBar } from '@/components/common/Stepper'
import { StatusChip } from '@/components/common/StatusChip'
import { QueryBoundary } from '@/components/states/QueryBoundary'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { date } from '@/lib/format'
import { answerError, answeredCount, resumeTarget, visibleQuestions } from '@/lib/survey'
import { cn } from '@/lib/utils'
import { AnswerInput, answerText } from './answers'
import { useDraftSync, useSurveyAnswers } from './useSurveyDraft'

const HELP_ICON: Record<Question['type'], LucideIcon> = {
  single: CircleDot,
  multiple: ListChecks,
  yes_no: CircleHelp,
  number: Gauge,
  stars: Star,
  satisfaction: Smile,
  text: Pencil,
  date: Calendar,
  dropdown: List,
}

export function SurveyQuestionScreen({
  rid,
  surveyId,
  questionId,
  fromReview,
}: {
  rid: string
  surveyId: string
  questionId: string
  fromReview: boolean
}) {
  const query = useQuery(surveyQuery(surveyId))
  return (
    <QueryBoundary query={query} skeleton={<Skeleton className="m-4 h-96 rounded-[18px]" />}>
      {(s) => <QuestionView survey={s} rid={rid} questionId={questionId} fromReview={fromReview} />}
    </QueryBoundary>
  )
}

function QuestionView({
  survey: s,
  rid,
  questionId,
  fromReview,
}: {
  survey: SurveyDetail
  rid: string
  questionId: string
  fromReview: boolean
}) {
  const { t } = useTranslation(['surveys', 'common'])
  const navigate = useNavigate()
  const { answers, setAnswer, setCurrent, ready } = useSurveyAnswers(s.id, s.questions)
  const { syncNow } = useDraftSync(s.id)
  const [attempted, setAttempted] = useState(false)
  const [sheet, setSheet] = useState(false)
  const titleId = useId()

  const visible = visibleQuestions(s.questions, answers)
  const index = visible.findIndex((q) => q.id === questionId)
  const q = visible[index]

  useEffect(() => {
    if (q && ready) setCurrent(q.id)
  }, [q, ready, setCurrent])

  if (!ready) return <Skeleton className="m-4 h-96 rounded-[18px]" />
  if (s.status === 'submitted' || s.status === 'closed') {
    return <Navigate to="/r/$rid/more/surveys/$surveyId/review" params={{ rid, surveyId: s.id }} replace />
  }
  if (!q) {
    // Unknown or now-hidden question (its condition changed): go where the survey should continue.
    const target = resumeTarget(s.questions, answers)
    return target === 'review' ? (
      <Navigate to="/r/$rid/more/surveys/$surveyId/review" params={{ rid, surveyId: s.id }} replace />
    ) : (
      <Navigate to="/r/$rid/more/surveys/$surveyId/q/$questionId" params={{ rid, surveyId: s.id, questionId: target }} replace />
    )
  }

  const error = answerError(q, answers[q.id])
  const total = visible.length
  const n = index + 1
  const minutesLeft = Math.max(1, Math.ceil(((total - n) * s.estimatedMinutes) / Math.max(1, total)))
  const isLast = index === total - 1
  const trigger = q.showIf ? s.questions.find((x) => x.id === q.showIf!.questionId) : undefined
  const triggerAnswer = trigger ? answerText(trigger, answers[trigger.id], t) : null

  const goQuestion = (id: string) =>
    void navigate({ to: '/r/$rid/more/surveys/$surveyId/q/$questionId', params: { rid, surveyId: s.id, questionId: id } })
  const goReview = () => void navigate({ to: '/r/$rid/more/surveys/$surveyId/review', params: { rid, surveyId: s.id } })

  const next = () => {
    if (error) return setAttempted(true)
    setAttempted(false)
    // Recompute: this answer may have shown or hidden the next question.
    const now = visibleQuestions(s.questions, answers)
    const after = now[now.findIndex((x) => x.id === q.id) + 1]
    if (fromReview || !after) goReview()
    else goQuestion(after.id)
  }
  const back = () => {
    setAttempted(false)
    const before = visible[index - 1]
    if (before) goQuestion(before.id)
    else void navigate({ to: '/r/$rid/more/surveys/$surveyId', params: { rid, surveyId: s.id } })
  }
  const openSheet = () => {
    void syncNow().catch(() => undefined)
    setSheet(true)
  }

  const helpKey = q.type === 'text' ? (q.required ? 'help.textRequired' : 'help.text') : q.type === 'multiple' && q.max ? 'help.multipleMax' : `help.${q.type}`

  return (
    <AppFrame>
      <TopBar
        title={t('intro.title')}
        backLabel={t('question.exit')}
        backIcon={X}
        onBack={openSheet}
        end={
          <button type="button" onClick={openSheet} className="text-body-sm text-link flex min-h-11 items-center gap-1 px-1 font-bold">
            <Save aria-hidden size={18} />
            <span className="truncate">{t('question.saveDraft')}</span>
          </button>
        }
      />
      <ScreenContent className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <div className="text-meta text-text-2 flex items-center justify-between gap-2 font-bold">
            <span>{q.showIf ? t('question.progressFollow', { n, total }) : t('question.progress', { n, total })}</span>
            <span className="flex items-center gap-1">
              <Timer aria-hidden size={14} />
              {t('question.left', { count: minutesLeft })}
            </span>
          </div>
          <ProgressBar value={n} max={total} tone="bg-teal-fg" label={t('question.progress', { n, total })} />
        </div>
        {q.showIf && triggerAnswer && (
          <StatusChip tone="violet" icon={GitBranch} label={t('question.followUp', { answer: triggerAnswer })} className="self-start" />
        )}
        <div className="flex flex-col gap-1.5">
          <h1 id={titleId} className="text-title-md m-0 leading-[1.25] font-extrabold text-pretty wrap-break-word">
            {q.title}
          </h1>
          <span className="text-secondary text-text-2 flex items-center gap-1.5">
            {(() => {
              const Icon = HELP_ICON[q.type]
              return <Icon aria-hidden size={15} className="shrink-0" />
            })()}
            {q.help ??
              t(helpKey, {
                max: q.type === 'text' ? q.maxLength : q.type === 'multiple' ? q.max : undefined,
              })}
          </span>
        </div>
        <AnswerInput question={q} value={answers[q.id]} onChange={(v) => setAnswer(q.id, v)} labelledBy={titleId} />
        {attempted && error && (
          <p role="alert" className="text-meta text-danger m-0 flex items-center gap-1.5 font-bold">
            <CircleAlert aria-hidden size={15} />
            {t(error.key, error.values)}
          </p>
        )}
      </ScreenContent>
      <ActionBar>
        <div className="flex gap-2.5">
          <Button variant="secondary" icon={ArrowLeft} onClick={back} className="flex-1">
            {t('question.back')}
          </Button>
          <Button
            icon={isLast || fromReview ? StepForward : undefined}
            iconEnd={isLast || fromReview ? undefined : ArrowRight}
            onClick={next}
            aria-disabled={!!error}
            className={cn('flex-[1.4]', error && 'bg-disabled text-disabled-text')}
          >
            {isLast || fromReview ? t('question.review') : t('question.next')}
          </Button>
        </div>
      </ActionBar>
      <BottomSheet open={sheet} onOpenChange={setSheet} title={t('draft.title')}>
        <div className="flex flex-col items-center gap-3 text-center">
          <IconTile icon={Save} tone="green" size={64} />
          <p className="text-body-sm text-text-2 m-0">
            <Trans
              t={t}
              i18nKey="draft.body"
              values={{ answered: answeredCount(s.questions, answers), total, date: date(s.closesAt) }}
              components={{ ltr: <Ltr /> }}
            />
          </p>
          <ProgressBar value={answeredCount(s.questions, answers)} max={total} tone="bg-green-fg" label={t('draft.title')} />
          <div className="flex w-full flex-col gap-2.5 pt-2">
            <Button block icon={StepForward} onClick={() => setSheet(false)}>
              {t('draft.continue')}
            </Button>
            <Button
              block
              variant="secondary"
              icon={LogOut}
              onClick={() => {
                setSheet(false)
                void navigate({ to: '/r/$rid/more/surveys', params: { rid } })
              }}
            >
              {t('draft.exit')}
            </Button>
          </div>
        </div>
      </BottomSheet>
    </AppFrame>
  )
}
