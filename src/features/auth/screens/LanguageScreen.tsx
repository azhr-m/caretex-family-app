import { useNavigate } from '@tanstack/react-router'
import { ArrowRight, Circle, CircleCheck, Languages, Settings } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Ltr } from '@/components/common/Ltr'
import { InfoBox } from '@/components/common/Card'
import { Button } from '@/components/ui/button'
import { AppFrame } from '@/components/app/AppFrame'
import { OfflineBanner } from '@/components/app/OfflineBanner'
import { cn } from '@/lib/utils'
import { usePrefsStore, type Language } from '@/stores/prefs'

const OPTIONS: { code: Language; dir: 'ltr' | 'rtl'; font: string }[] = [
  { code: 'en', dir: 'ltr', font: 'font-brand' },
  { code: 'he', dir: 'rtl', font: "font-['Rubik',sans-serif]" },
]

export function LanguageScreen() {
  const { t, i18n } = useTranslation('auth')
  const navigate = useNavigate()
  const setLanguage = usePrefsStore((s) => s.setLanguage)
  const current: Language = i18n.language === 'he' ? 'he' : 'en'

  const onContinue = () => {
    setLanguage(current)
    void navigate({ to: '/login', replace: true })
  }

  return (
    <AppFrame>
      <OfflineBanner />
      <main className="flex min-h-dvh flex-col gap-7 px-6 pt-10 pb-9">
        <div className="flex flex-col items-center gap-3.5 text-center">
          <div className="bg-navy flex size-[76px] items-center justify-center rounded-[22px] text-white">
            <Languages aria-hidden size={38} />
          </div>
          <Ltr className="font-brand text-body-sm text-text-2 font-black tracking-[.18em]">
            CARETEX · FAMILY
          </Ltr>
          <h1 className="m-0 flex flex-col gap-0.5">
            <span lang="en" dir="ltr" className="font-brand text-title-xl font-extrabold">
              {t('lang.titleEn')}
            </span>
            <span lang="he" dir="rtl" className="text-title-lg font-['Rubik',sans-serif] font-bold">
              {t('lang.titleHe')}
            </span>
          </h1>
          <p className="text-body-sm text-text-2 m-0 max-w-[300px]">{t('lang.sub')}</p>
        </div>

        <div
          role="radiogroup"
          aria-label={`${t('lang.titleEn')} · ${t('lang.titleHe')}`}
          className="flex flex-col gap-3"
        >
          {OPTIONS.map(({ code, dir, font }) => {
            const selected = code === current
            return (
              <button
                key={code}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setLanguage(code)}
                className={cn(
                  'rounded-card flex min-h-20 items-center gap-3.5 border-2 p-[18px] text-start transition-colors',
                  selected ? 'border-primary bg-pill' : 'border-border bg-surface',
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    'bg-surface-2 rounded-input flex size-12 shrink-0 items-center justify-center font-black',
                    font,
                  )}
                >
                  {t(`lang.${code}.code`)}
                </span>
                <span lang={code} dir={dir} className={cn('flex min-w-0 flex-1 flex-col text-start', font)}>
                  <span className="text-title-sm font-extrabold">{t(`lang.${code}.label`)}</span>
                  <span className="text-secondary text-text-2">{t(`lang.${code}.sub`)}</span>
                </span>
                <span
                  className={cn(
                    'flex shrink-0 flex-col items-center gap-0.5',
                    selected ? 'text-primary' : 'text-text-2',
                  )}
                >
                  {selected ? <CircleCheck aria-hidden size={26} /> : <Circle aria-hidden size={26} />}
                  <span className="text-micro font-bold">
                    {selected ? t('lang.selected') : t('lang.select')}
                  </span>
                </span>
              </button>
            )
          })}
        </div>

        <InfoBox icon={Settings}>{t('lang.later')}</InfoBox>
        <div className="flex-1" />
        <Button block iconEnd={ArrowRight} onClick={onContinue}>
          {t('continue')}
        </Button>
      </main>
    </AppFrame>
  )
}
