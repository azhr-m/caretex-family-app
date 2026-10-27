import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { CircleCheck, ClipboardList, Eye, Play, Save, StepForward } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { surveysQuery } from '@/api/queries/more'
import type { SurveySummary } from '@/api/schemas/surveys'
import { AppFrame, ScreenContent } from '@/components/app/AppFrame'
import { PullToRefresh, refetchAll } from '@/components/app/PullToRefresh'
import { TopBar } from '@/components/app/TopBar'
import { Card } from '@/components/common/Card'
import { IconTile } from '@/components/common/IconTile'
import { ProgressBar } from '@/components/common/Stepper'
import { StatusChip } from '@/components/common/StatusChip'
import { QueryBoundary } from '@/components/states/QueryBoundary'
import { EmptyState } from '@/components/states/states'
import { Button } from '@/components/ui/button'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { ListSkeleton } from '@/components/ui/skeleton'
import { bidiIsolate, date } from '@/lib/format'

export type SurveysTab = 'active' | 'completed'

export function surveyMeta(s: SurveySummary, t: (k: string, o?: Record<string, unknown>) => string) {
  return [
    s.anonymous ? t('list.anonymous') : t('list.identified'),
    t('list.questions', { count: s.questionCount }),
    t('list.closes', { date: bidiIsolate(date(s.closesAt)) }),
  ].join(' · ')
}

export function SurveysListScreen({ rid, tab }: { rid: string; tab: SurveysTab }) {
  const { t } = useTranslation(['surveys', 'common'])
  const navigate = useNavigate()
  const active = useQuery(surveysQuery(rid, 'active'))
  const completed = useQuery(surveysQuery(rid, 'completed'))
  const query = tab === 'active' ? active : completed
  return (
    <AppFrame>
      <TopBar title={t('list.title')} backLabel={t('common:tabs.more')} fallbackHref={`/r/${rid}/more`} />
      <ScreenContent className="flex flex-col gap-3.5">
        <p className="text-secondary text-text-2 m-0">{t('list.intro')}</p>
        <SegmentedControl
          label={t('list.title')}
          value={tab}
          onChange={(v) =>
            void navigate({ to: '/r/$rid/more/surveys', params: { rid }, search: v === 'active' ? {} : { tab: v }, replace: true })
          }
          options={[
            { value: 'active', label: withCount(t('list.active'), active.data?.items.length) },
            { value: 'completed', label: withCount(t('list.completed'), completed.data?.items.length) },
          ]}
        />
        <PullToRefresh onRefresh={() => refetchAll(query.refetch)}>
          <QueryBoundary
            query={query}
            skeleton={<ListSkeleton rows={2} />}
            isEmpty={(d) => d.items.length === 0}
            empty={
              <EmptyState
                icon={ClipboardList}
                title={tab === 'active' ? t('list.emptyActive') : t('list.emptyCompleted')}
              />
            }
          >
            {(d) => (
              <div className="flex flex-col gap-2.5">
                {d.items.map((s) => (
                  <SurveyCard key={s.id} survey={s} rid={rid} />
                ))}
              </div>
            )}
          </QueryBoundary>
        </PullToRefresh>
      </ScreenContent>
    </AppFrame>
  )
}

const withCount = (label: string, n?: number) => (n === undefined ? label : `${label} (${n})`)

function SurveyCard({ survey: s, rid }: { survey: SurveySummary; rid: string }) {
  const { t } = useTranslation(['surveys', 'common'])
  const done = s.status === 'submitted' || s.status === 'closed'
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <IconTile icon={ClipboardList} tone={done ? 'green' : 'teal'} size={44} />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-body font-extrabold text-pretty wrap-break-word">{s.title}</span>
          <span className="text-meta text-text-2 wrap-break-word">{surveyMeta(s, t)}</span>
        </div>
      </div>
      {!done && <ProgressBar value={s.answeredCount} max={Math.max(1, s.questionCount)} tone="bg-teal-fg" label={s.title} />}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {s.status === 'not_started' && <StatusChip status="not_started" />}
        {s.status === 'draft' && (
          <StatusChip
            tone="amber"
            icon={Save}
            label={t('list.draftProgress', { answered: s.answeredCount, total: s.questionCount })}
          />
        )}
        {s.status === 'submitted' && <StatusChip tone="green" icon={CircleCheck} label={t('list.submitted')} />}
        {s.status === 'closed' && <StatusChip status="closed" />}
        <Button asChild size="compact" variant={done ? 'secondary' : 'primary'}>
          <Link
            to={done ? '/r/$rid/more/surveys/$surveyId/review' : '/r/$rid/more/surveys/$surveyId'}
            params={{ rid, surveyId: s.id }}
          >
            {done ? <Eye aria-hidden size={17} /> : s.status === 'draft' ? <StepForward aria-hidden size={17} /> : <Play aria-hidden size={17} />}
            {done ? t('list.view') : s.status === 'draft' ? t('list.continue') : t('list.start')}
          </Link>
        </Button>
      </div>
    </Card>
  )
}

