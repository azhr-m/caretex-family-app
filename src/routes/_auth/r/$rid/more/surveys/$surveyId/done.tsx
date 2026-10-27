import { createFileRoute } from '@tanstack/react-router'
import { SurveyDoneScreen } from '@/features/surveys/SurveyDoneScreen'

export const Route = createFileRoute('/_auth/r/$rid/more/surveys/$surveyId/done')({
  component: function SurveyDoneScreenRoute() {
    const { rid, surveyId } = Route.useParams()
    return <SurveyDoneScreen rid={rid} surveyId={surveyId} />
  },
})
