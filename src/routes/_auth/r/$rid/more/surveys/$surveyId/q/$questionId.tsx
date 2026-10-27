import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { SurveyQuestionScreen } from '@/features/surveys/SurveyQuestionScreen'

export const Route = createFileRoute('/_auth/r/$rid/more/surveys/$surveyId/q/$questionId')({
  validateSearch: z.object({ review: z.boolean().optional().catch(undefined) }),
  component: function SurveyQuestionScreenRoute() {
    const { rid, surveyId, questionId } = Route.useParams()
    const search = Route.useSearch()
    return <SurveyQuestionScreen rid={rid} surveyId={surveyId} questionId={questionId} fromReview={search.review === true} />
  },
})
