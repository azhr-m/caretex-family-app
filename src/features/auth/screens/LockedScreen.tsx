import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import {
  ArrowLeft,
  CircleCheck,
  Clock,
  KeyRound,
  Lock,
  LogIn,
  Phone,
  Timer,
  type LucideIcon,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { centerPublicQuery } from '@/api/queries/center'
import { SectionHeader } from '@/components/common/SectionHeader'
import { ResultScreen } from '@/components/states/states'
import { Button } from '@/components/ui/button'
import { formatOfficeHours } from '@/lib/center'
import { bidiIsolate, formatPhone, time } from '@/lib/format'
import { useNow } from '@/lib/hooks'
import { useAuthFlowStore } from '@/stores/authFlow'
import { AuthScreen } from '../components/AuthScreen'

function StepCard({ icon: Icon, title, body }: { icon: LucideIcon; title: string; body?: string }) {
  return (
    <div className="rounded-btn border-border bg-surface flex items-start gap-3 border p-3.5">
      <div className="bg-surface-2 rounded-tile flex size-10 shrink-0 items-center justify-center">
        <Icon aria-hidden size={20} />
      </div>
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-body-sm font-extrabold">{title}</span>
        {body && <span className="text-secondary text-text-2 wrap-break-word">{body}</span>}
      </div>
    </div>
  )
}

export function LockedScreen() {
  const { t } = useTranslation('auth')
  const navigate = useNavigate()
  const lock = useAuthFlowStore((s) => s.lock)!
  const center = useQuery(centerPublicQuery()).data
  const until = new Date(lock.lockedUntil).getTime()
  const now = useNow(1000)
  const unlocked = now >= until
  const untilTime = time(until)

  const toLogin = () => {
    if (unlocked) useAuthFlowStore.getState().setLock(null)
    void navigate({ to: '/login', replace: true })
  }

  return (
    <AuthScreen className="p-0">
      <ResultScreen
        icon={Lock}
        tone={unlocked ? 'green' : 'red'}
        statusLabel={unlocked ? t('locked.unlockedChip') : t('locked.chip', { time: bidiIsolate(untilTime) })}
        statusIcon={unlocked ? CircleCheck : Clock}
        title={t('locked.title')}
        body={t('locked.body', { attempts: lock.attemptsAllowed, minutes: lock.lockMinutes })}
        actions={
          <>
            {unlocked ? (
              <Button block icon={LogIn} onClick={toLogin}>
                {t('login.signIn')}
              </Button>
            ) : (
              <Button
                block
                icon={KeyRound}
                onClick={() => void navigate({ to: '/forgot', search: { step: 'phone' } })}
              >
                {t('locked.resetBtn')}
              </Button>
            )}
            {center && (
              <Button asChild variant="secondary" block>
                <a href={`tel:${center.phone}`}>
                  <Phone aria-hidden size={20} />
                  {t('locked.callBtn')}
                </a>
              </Button>
            )}
            {!unlocked && (
              <Button variant="link" size="link" icon={ArrowLeft} onClick={toLogin} className="self-center">
                {t('forgot.backToSignIn')}
              </Button>
            )}
          </>
        }
      >
        <div className="flex flex-col gap-2.5">
          <SectionHeader>{t('locked.nextSteps')}</SectionHeader>
          <StepCard
            icon={Timer}
            title={t('locked.wait', { count: lock.lockMinutes })}
            body={t('locked.waitBody', { time: bidiIsolate(untilTime) })}
          />
          <StepCard icon={KeyRound} title={t('locked.reset')} body={t('locked.resetBody')} />
          <StepCard
            icon={Phone}
            title={t('locked.call')}
            body={
              center
                ? t('locked.callBody', {
                    office: center.familyOfficeName,
                    hours: formatOfficeHours(center.officeHours, t),
                    phone: bidiIsolate(formatPhone(center.phone)),
                  })
                : undefined
            }
          />
        </div>
      </ResultScreen>
    </AuthScreen>
  )
}
