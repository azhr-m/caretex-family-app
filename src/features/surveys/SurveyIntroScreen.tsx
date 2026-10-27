import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import {
  CalendarX,
  ClipboardList,
  Eye,
  EyeOff,
  Info,
  ListChecks,
  Play,
  Save,
  StepForward,
  Timer,
  UserRound,
  type LucideIcon,
} from 'lucide-react'
import { Trans, useTranslation } from 'react-i18next'
import { useMember } from '@/api/queries/me'
import { surveyQuery } from '@/api/queries/more'
import type { SurveyDetail } from '@/api/schemas/surveys'
import { AppFrame, ScreenContent } from '@/components/app/AppFrame'
import { TopBar } from '@/components/app/TopBar'
import { InfoBox } from '@/components/common/Card'
import { IconTile } from '@/components/common/IconTile'
import { Ltr } from '@/components/common/Ltr'
import { QueryBoundary } from '@/components/states/QueryBoundary'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { date } from '@/lib/format'
import { firstName } from '@/lib/names'
import { toneClasses } from '@/lib/status'
import { resumeTarget } from '@/lib/survey'
import { cn } from '@/lib/utils'
import { useSurveyAnswers } from './useSurveyDraft'

export function SurveyIntroScreen({ rid, surveyId }: { rid: string; surveyId: string }) {
  const { t } = useTranslation('surveys')
  const query = useQuery(surveyQuery(surveyId))
  return (
    <AppFrame>
      <TopBar title={t('intro.title')} backLabel={t('list.title')} fallbackHref={`/r/${rid}/more/surveys`} />
      <ScreenContent>
        <QueryBoundary query={query} skeleton={<Skeleton className="h-96 w-full rounded-[18px]" />}>
          {(s) => <Intro survey={s} rid={rid} />}
        </QueryBoundary>
      </ScreenContent>
    </AppFrame>
  )
}

function Intro({ survey: s, rid }: { survey: SurveyDetail; rid: string }) {
  const { t } = useTranslation('surveys')
  const name = firstName(useMember()?.residents.find((r) => r.id === rid)?.name ?? '')
  const { answers, ready } = useSurveyAnswers(s.id, s.questions)
  const started = Object.keys(answers).length > 0
  const target = resumeTarget(s.questions, answers)
  const done = s.status === 'submitted' || s.status === 'closed'
  const b = toneClasses.blue
  const go =
    target === 'review'
      ? ({ to: '/r/$rid/more/surveys/$surveyId/review', params: { rid, surveyId: s.id } } as const)
      : ({ to: '/r/$rid/more/surveys/$surveyId/q/$questionId', params: { rid, surveyId: s.id, questionId: target } } as const)

  return (
    <div className="flex flex-col gap-4">
      <IconTile icon={ClipboardList} tone="teal" size={64} />
      <h1 className="text-title-md m-0 font-extrabold text-pretty wrap-break-word">{s.title}</h1>
      <p className="text-body text-text-2 m-0 wrap-break-word">{s.description}</p>
      <div className="grid grid-cols-3 gap-2">
        <Fact icon={Timer} value={t('intro.minutes', { count: s.estimatedMinutes })} label={t('intro.estimated')} />
        <Fact icon={ListChecks} value={<Ltr>{s.questionCount}</Ltr>} label={t('intro.questions')} />
        <Fact icon={CalendarX} value={<Ltr>{date(s.closesAt).slice(0, 5)}</Ltr>} label={t('intro.closes')} />
      </div>
      <div className={cn('rounded-input flex items-start gap-2.5 border p-3.5', b.bg, b.bd)}>
        {s.anonymous ? (
          <EyeOff aria-hidden size={20} className={cn('mt-px shrink-0', b.fg)} />
        ) : (
          <UserRound aria-hidden size={20} className={cn('mt-px shrink-0', b.fg)} />
        )}
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className={cn('text-body-sm font-extrabold', b.fg)}>
            {s.anonymous ? t('intro.anonTitle') : t('intro.identTitle')}
          </span>
          <span className="text-secondary">{s.anonymous ? t('intro.anonBody', { name }) : t('intro.identBody')}</span>
        </div>
      </div>
      {!done && (
        <InfoBox icon={Save}>
          <Trans t={t} i18nKey="intro.draftNote" values={{ date: date(s.closesAt) }} components={{ ltr: <Ltr /> }} />
        </InfoBox>
      )}
      {done ? (
        <Button asChild block variant="secondary">
          <Link to="/r/$rid/more/surveys/$surveyId/review" params={{ rid, surveyId: s.id }}>
            <Eye aria-hidden size={20} />
            {t('intro.viewAnswers')}
          </Link>
        </Button>
      ) : (
        <Button asChild block aria-disabled={!ready}>
          <Link {...go}>
            {started ? <StepForward aria-hidden size={20} /> : <Play aria-hidden size={20} />}
            {started ? t('intro.continue') : t('intro.start')}
          </Link>
        </Button>
      )}
      {s.status === 'closed' && (
        <InfoBox icon={Info}>
          <Trans t={t} i18nKey="intro.closedNote" values={{ date: date(s.closesAt) }} components={{ ltr: <Ltr /> }} />
        </InfoBox>
      )}
    </div>
  )
}

function Fact({ icon: Icon, value, label }: { icon: LucideIcon; value: React.ReactNode; label: string }) {
  return (
    <div className="rounded-card border-border bg-surface flex flex-col items-center gap-1 border px-2 py-3 text-center">
      <Icon aria-hidden size={20} className="text-text-2" />
      <span className="text-body font-extrabold">{value}</span>
      <span className="text-tag text-text-2 font-bold">{label}</span>
    </div>
  )
}
