import {
  Ban,
  Building2,
  Clock,
  CloudAlert,
  FileQuestion,
  Hourglass,
  Lock,
  Phone,
  RotateCw,
  Snail,
  WifiOff,
  type LucideIcon,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { InfoBox } from '@/components/common/Card'
import { Ltr } from '@/components/common/Ltr'
import { Button } from '@/components/ui/button'
import { StateView, type StateViewProps } from './StateView'

export function ResultScreen(props: Omit<StateViewProps, 'size'>) {
  return <StateView size="screen" animate {...props} />
}

export function EmptyState({
  icon,
  tone = 'slate',
  title,
  body,
  action,
}: {
  icon: LucideIcon
  tone?: StateViewProps['tone']
  title: ReactNode
  body?: ReactNode
  action?: ReactNode
}) {
  return <StateView icon={icon} tone={tone} title={title} body={body} actions={action} />
}

export function ErrorState({
  onRetry,
  requestId,
  contactPhone,
  variant = 'error',
}: {
  onRetry?: () => void
  requestId?: string
  contactPhone?: string
  variant?: 'error' | 'offline' | 'notFound'
}) {
  const { t } = useTranslation('states')
  if (variant === 'notFound') {
    return <StateView icon={FileQuestion} tone="slate" title={t('notFound.title')} />
  }
  const offline = variant === 'offline'
  return (
    <StateView
      icon={offline ? WifiOff : CloudAlert}
      tone={offline ? 'slate' : 'red'}
      title={offline ? t('offlineEmpty.title') : t('error.title')}
      body={offline ? t('offlineEmpty.body') : t('error.body')}
      actions={
        <>
          {onRetry && (
            <Button icon={RotateCw} block onClick={onRetry}>
              {t('common:actions.tryAgain')}
            </Button>
          )}
          {!offline && contactPhone && (
            <Button asChild variant="secondary" block>
              <a href={`tel:${contactPhone}`}>
                <Phone aria-hidden size={20} />
                {t('error.contact')}
              </a>
            </Button>
          )}
          {!offline && requestId && (
            <p className="text-micro text-text-2 m-0">
              <Trans
                t={t}
                i18nKey="error.requestId"
                values={{ id: requestId }}
                components={{ ltr: <Ltr /> }}
              />
            </p>
          )}
        </>
      }
    />
  )
}

/** 3.8a no permission (slate lock) / 3.8b not yet shared (amber hourglass), with a note box and actions. */
export function PermissionState({
  kind,
  title,
  body,
  note,
  actions,
}: {
  kind: 'denied' | 'notShared'
  title?: ReactNode
  body?: ReactNode
  note?: ReactNode
  actions?: ReactNode
}) {
  const { t } = useTranslation('states')
  const denied = kind === 'denied'
  return (
    <StateView
      icon={denied ? Lock : Hourglass}
      tone={denied ? 'slate' : 'amber'}
      status={denied ? 'no_permission' : undefined}
      statusLabel={denied ? undefined : t('permission.notSharedChip')}
      statusIcon={denied ? Ban : Clock}
      title={title ?? (denied ? t('permission.noPermissionTitle') : t('permission.notSharedTitle'))}
      body={body ?? (denied ? t('permission.noPermissionBody') : t('permission.notSharedBody'))}
      actions={actions}
    >
      <InfoBox icon={Building2}>
        {note ?? (denied ? t('permission.noPermissionNote') : t('permission.notSharedNote'))}
      </InfoBox>
    </StateView>
  )
}

export function SlowNotice({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation('states')
  return (
    <div
      role="status"
      className="rounded-input bg-slate-bg text-secondary text-slate-fg mt-3 flex items-start gap-2.5 p-3.5"
    >
      <Snail aria-hidden size={18} className="mt-px shrink-0" />
      <div className="flex min-w-0 flex-1 flex-col items-start gap-1">
        <span className="wrap-break-word">{t('slow')}</span>
        <Button variant="link" size="link" icon={RotateCw} onClick={onRetry} className="-ms-1">
          {t('common:actions.tryAgain')}
        </Button>
      </div>
    </div>
  )
}

/** Compact inline error for a Home section. */
export function SectionError({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation('states')
  return (
    <div className="rounded-card border-border bg-surface flex items-center gap-3 border p-3.5">
      <CloudAlert aria-hidden size={20} className="text-red-fg shrink-0" />
      <span className="text-secondary min-w-0 flex-1 font-bold wrap-break-word">{t('sectionError')}</span>
      <Button variant="link" size="link" onClick={onRetry}>
        {t('common:actions.tryAgain')}
      </Button>
    </div>
  )
}
