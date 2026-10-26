import { createFileRoute } from '@tanstack/react-router'
import { StubScreen } from '@/components/app/ComingSoon'

export const Route = createFileRoute('/_auth/r/$rid/more/surveys/$surveyId/q/$questionId')({
  component: () => <StubScreen phase={4} route="/r/$rid/more/surveys/$surveyId/q/$questionId" />,
})
