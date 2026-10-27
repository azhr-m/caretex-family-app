import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { HeartHandshake, ShieldCheck } from 'lucide-react'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { appTarget, bootstrapSession } from '@/app/session'
import { Ltr } from '@/components/common/Ltr'
import { usePrefsStore } from '@/stores/prefs'
import { useSessionStore } from '@/stores/session'

const MIN_DISPLAY_MS = 800
const SPLASH_COLOR = '#1F2A44'

export function SplashView() {
  const { t } = useTranslation('auth')
  return (
    <div className="bg-splash relative flex min-h-dvh flex-col items-center justify-center gap-[18px] px-6 text-white">
      <div className="flex size-[104px] items-center justify-center rounded-[30px] border border-white/20 bg-white/10">
        <HeartHandshake aria-hidden size={54} strokeWidth={1.75} />
      </div>
      <Ltr className="font-brand ms-[.18em] text-[38px] font-black tracking-[.18em]">CARETEX</Ltr>
      <span className="text-secondary rounded-pill bg-white/[.12] px-3.5 py-[5px] font-extrabold tracking-[.04em]">
        {t('familyApp')}
      </span>
      <p className="text-body-sm m-0 max-w-[260px] text-center opacity-80">{t('splash.tagline')}</p>
      <div role="status" className="absolute bottom-16 flex flex-col items-center gap-2.5 opacity-80">
        <div aria-hidden className="flex gap-1.5">
          <span className="size-2 animate-pulse rounded-full bg-white" />
          <span className="size-2 animate-pulse rounded-full bg-white/50 [animation-delay:150ms]" />
          <span className="size-2 animate-pulse rounded-full bg-white/25 [animation-delay:300ms]" />
        </div>
        <span className="text-meta flex items-center gap-1.5">
          <ShieldCheck aria-hidden size={15} />
          {t('splash.connecting')}
        </span>
      </div>
    </div>
  )
}

/** Shows the splash for at least 800 ms while the session is restored, then routes the user. */
export function SplashScreen() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]')
    const previous = meta?.getAttribute('content')
    meta?.setAttribute('content', SPLASH_COLOR)

    let cancelled = false
    void Promise.all([bootstrapSession(queryClient), new Promise((r) => setTimeout(r, MIN_DISPLAY_MS))]).then(
      () => {
        if (cancelled) return
        if (!usePrefsStore.getState().language) return navigate({ to: '/welcome/language', replace: true })
        if (useSessionStore.getState().accessToken)
          return navigate({ ...appTarget({ preferLast: true }), replace: true })
        return navigate({ to: '/login', replace: true })
      },
    )
    return () => {
      cancelled = true
      if (previous) meta?.setAttribute('content', previous)
    }
  }, [navigate, queryClient])

  return <SplashView />
}
