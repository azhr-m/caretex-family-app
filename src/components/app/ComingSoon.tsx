import { Construction } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Ltr } from '@/components/common/Ltr'
import { StateView } from '@/components/states/StateView'
import { AppFrame, ScreenContent } from './AppFrame'
import { TopBar } from './TopBar'

/** Placeholder for routes that later phases implement. */
export function ComingSoon({ phase, route }: { phase: number; route: string }) {
  const { t } = useTranslation()
  return (
    <StateView
      icon={Construction}
      tone="amber"
      status="coming_soon"
      title={t('stub.comingIn', { phase })}
      body={<Ltr className="text-meta font-mono">{route}</Ltr>}
    />
  )
}

/** Route stub: inside the tab shell it renders content only; elsewhere it adds a TopBar or its own frame. */
export function StubScreen({ phase, route, tabs = false }: { phase: number; route: string; tabs?: boolean }) {
  const { t } = useTranslation()
  if (tabs) return <ComingSoon phase={phase} route={route} />
  const inApp = route.startsWith('/r/')
  return (
    <AppFrame>
      {inApp && <TopBar title="" backLabel={t('actions.back')} fallbackHref="/" />}
      <ScreenContent>
        <ComingSoon phase={phase} route={route} />
      </ScreenContent>
    </AppFrame>
  )
}
