import { CircleCheck, CircleX } from 'lucide-react'
import { Trans, useTranslation } from 'react-i18next'
import { Ltr } from '@/components/common/Ltr'
import type { PasswordPolicy } from '@/api/schemas/auth'
import { passwordRules, passwordStrength, type Strength } from '@/lib/validation'
import { cn } from '@/lib/utils'

const LEVEL: Record<Exclude<Strength, 0>, { key: string; fill: string; text: string }> = {
  1: { key: 'weak', fill: 'bg-red-fg', text: 'text-red-fg' },
  2: { key: 'medium', fill: 'bg-amber-fg', text: 'text-amber-fg' },
  3: { key: 'good', fill: 'bg-green-fg', text: 'text-green-fg' },
  4: { key: 'strong', fill: 'bg-green-fg', text: 'text-green-fg' },
}

export function StrengthMeter({ policy, password }: { policy: PasswordPolicy; password: string }) {
  const { t } = useTranslation('auth')
  const strength = passwordStrength(policy, password)
  const level = strength ? LEVEL[strength] : null
  return (
    <div className="flex flex-col gap-1.5">
      <div className="text-meta flex items-center justify-between gap-2 font-bold">
        <span>{t('password.strength')}</span>
        {level && (
          <span aria-live="polite" className={level.text}>
            {t(`password.${level.key}`)}
          </span>
        )}
      </div>
      <div aria-hidden className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={cn(
              'h-1.5 flex-1 rounded-[3px] transition-colors duration-300',
              level && i <= strength ? level.fill : 'bg-border',
            )}
          />
        ))}
      </div>
    </div>
  )
}

export function PasswordRules({
  policy,
  password,
  confirm,
}: {
  policy: PasswordPolicy
  password: string
  confirm: string
}) {
  const { t } = useTranslation('auth')
  const rules = passwordRules(policy, password, confirm)
  return (
    <div className="rounded-btn border-border bg-surface flex flex-col border">
      <h2 className="text-tag text-label text-tag text-label m-0 px-3.5 pt-3 pb-1 font-extrabold tracking-[.06em] rtl:tracking-normal">
        {t('password.rules')}
      </h2>
      <ul className="m-0 list-none p-0">
        {rules.map(({ key, ok }) => (
          <li
            key={key}
            className={cn('flex items-center gap-2.5 px-3.5 py-2.5', ok ? 'text-green-fg' : 'text-red-fg')}
          >
            {ok ? <CircleCheck aria-hidden size={20} /> : <CircleX aria-hidden size={20} />}
            <span className="text-body-sm text-text min-w-0 flex-1 wrap-break-word">
              <Trans
                t={t}
                i18nKey={`password.rule.${key}`}
                values={{ count: policy.minLength }}
                components={{ ltr: <Ltr /> }}
              />
            </span>
            <span className="text-tag text-label font-extrabold">{ok ? t('password.met') : t('password.notYet')}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
