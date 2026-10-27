import { createFileRoute } from '@tanstack/react-router'
import { SurveyIntroScreen } from '@/features/surveys/SurveyIntroScreen'

export const Route = createFileRoute('/_auth/r/$rid/more/surveys/$surveyId/')({
  component: function SurveyIntroScreenRoute() {
    const { rid, surveyId } = Route.useParams()
    return <SurveyIntroScreen rid={rid} surveyId={surveyId} />
  },
})
