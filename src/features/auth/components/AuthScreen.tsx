import { HeartHandshake } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { AppFrame } from '@/components/app/AppFrame'
import { OfflineBanner } from '@/components/app/OfflineBanner'
import { TopBar } from '@/components/app/TopBar'
import { Ltr } from '@/components/common/Ltr'
import { cn } from '@/lib/utils'

type TopBarProps = { title: string; backLabel: string; onBack?: () => void; fallbackHref?: string }

/** Public/auth screen frame: optional TopBar (which carries the offline banner) and padded content. */
export function AuthScreen({
  topBar,
  children,
  className,
}: {
  topBar?: TopBarProps
  children: ReactNode
  className?: string
}) {
  return (
    <AppFrame>
      {topBar ? <TopBar {...topBar} /> : <OfflineBanner />}
      <main className={cn('flex min-w-0 flex-1 flex-col gap-5 px-5 pt-2 pb-8', className)}>{children}</main>
    </AppFrame>
  )
}

export function BrandRow() {
  const { t } = useTranslation('auth')
  return (
    <div className="flex items-center gap-3">
      <div className="bg-navy rounded-btn flex size-[52px] shrink-0 items-center justify-center text-white">
        <HeartHandshake aria-hidden size={28} />
      </div>
      <div className="flex min-w-0 flex-col">
        <Ltr className="font-brand self-start text-[22px] font-black tracking-[.14em]">CARETEX</Ltr>
        <span className="text-meta text-text-2 font-bold">{t('familyApp')}</span>
      </div>
    </div>
  )
}

export function ScreenTitle({
  title,
  sub,
  size = 'lg',
}: {
  title: ReactNode
  sub?: ReactNode
  size?: 'display' | 'xl' | 'lg'
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <h1
        className={cn(
          'm-0 font-extrabold text-pretty wrap-break-word',
          size === 'display' ? 'text-display' : size === 'xl' ? 'text-title-xl' : 'text-title-lg',
        )}
      >
        {title}
      </h1>
      {sub && <p className="text-body-sm text-text-2 m-0 text-pretty wrap-break-word">{sub}</p>}
    </div>
  )
}
