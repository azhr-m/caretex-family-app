import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Ban, Mail, Phone, ShieldOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { centerPublicQuery } from '@/api/queries/center'
import { ResultScreen } from '@/components/states/states'
import { Button } from '@/components/ui/button'
import { AuthScreen } from '../components/AuthScreen'
import { CenterContactCard } from '../components/CenterContactCard'

export function BlockedScreen() {
  const { t } = useTranslation('auth')
  const navigate = useNavigate()
  const center = useQuery(centerPublicQuery()).data

  return (
    <AuthScreen className="p-0">
      <ResultScreen
        icon={ShieldOff}
        tone="slate"
        statusLabel={t('blocked.chip')}
        statusIcon={Ban}
        title={t('blocked.title')}
        body={t('blocked.body')}
        actions={
          <>
            <Button asChild block>
              <a href={center ? `tel:${center.phone}` : undefined} aria-disabled={!center}>
                <Phone aria-hidden size={20} />
                {t('blocked.callBtn')}
              </a>
            </Button>
            <Button asChild variant="secondary" block>
              <a href={center ? `mailto:${center.email}` : undefined} aria-disabled={!center}>
                <Mail aria-hidden size={20} />
                {t('blocked.emailBtn')}
              </a>
            </Button>
            <Button
              variant="link"
              size="link"
              icon={ArrowLeft}
              onClick={() => void navigate({ to: '/login', replace: true })}
              className="self-center"
            >
              {t('forgot.backToSignIn')}
            </Button>
          </>
        }
      >
        <CenterContactCard center={center} />
      </ResultScreen>
    </AuthScreen>
  )
}
