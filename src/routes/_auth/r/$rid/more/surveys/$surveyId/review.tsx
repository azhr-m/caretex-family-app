import { createFileRoute } from '@tanstack/react-router'
import { SurveyReviewScreen } from '@/features/surveys/SurveyReviewScreen'

export const Route = createFileRoute('/_auth/r/$rid/more/surveys/$surveyId/review')({
  component: function SurveyReviewScreenRoute() {
    const { rid, surveyId } = Route.useParams()
    return <SurveyReviewScreen rid={rid} surveyId={surveyId} />
  },
})
