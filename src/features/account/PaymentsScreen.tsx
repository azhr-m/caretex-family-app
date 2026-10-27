import { useQuery } from '@tanstack/react-query'
import { Bell, Clock, FileCheck, Phone, Receipt, Wallet } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { billingQuery, centerQuery, usePatchPreferences } from '@/api/queries/account'
import { useMember } from '@/api/queries/me'
import { AppFrame, ScreenContent } from '@/components/app/AppFrame'
import { TopBar } from '@/components/app/TopBar'
import { IconTile } from '@/components/common/IconTile'
import { Ltr } from '@/components/common/Ltr'
import { StatusChip } from '@/components/common/StatusChip'
import { QueryBoundary } from '@/components/states/QueryBoundary'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/components/ui/toast'
import { ToggleRow } from '@/components/ui/toggle'
import { formatPhone } from '@/lib/format'

/** 6.9: "Coming soon" with a dimmed sample of what the page will show, and a notify-me toggle. */
export function PaymentsScreen({ rid }: { rid: string }) {
  const { t } = useTranslation(['settings', 'common', 'states'])
  const query = useQuery(billingQuery(rid))
  const member = useMember()
  const patch = usePatchPreferences()
  const finance = useQuery(centerQuery()).data?.contacts.find((c) => c.department === 'finance')
  const notify = member?.preferences.notifyPaymentsAvailable ?? false

  return (
    <AppFrame>
      <TopBar title={t('payments.title')} backLabel={t('common:tabs.more')} fallbackHref={`/r/${rid}/more`} />
      <ScreenContent>
        <QueryBoundary query={query} skeleton={<Skeleton className="h-96 w-full rounded-[18px]" />}>
          {() => (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col items-center gap-3 text-center">
                <IconTile icon={Wallet} tone="slate" size={88} bordered />
                <StatusChip status="coming_soon" icon={Clock} size="lg" />
                <h1 className="text-title-sm m-0 font-extrabold">{t('payments.heading')}</h1>
                <p className="text-body text-text-2 m-0 max-w-[340px]">{t('payments.body')}</p>
              </div>

              <div aria-hidden className="relative">
                <div className="flex flex-col gap-2.5 opacity-40 select-none">
                  <div className="rounded-card bg-navy flex flex-col gap-1 p-4 text-white">
                    <span className="text-meta opacity-80">{t('payments.preview.balance')}</span>
                    <span className="h-7 w-28 rounded-sm bg-white/25" />
                    <span className="text-meta opacity-80">{t('payments.preview.upToDate')}</span>
                  </div>
                  {[Receipt, Receipt, FileCheck].map((Icon, i) => (
                    <div key={i} className="rounded-card border-border bg-surface flex items-center gap-3 border p-3.5">
                      <Icon size={20} className="text-text-2 shrink-0" />
                      <div className="flex flex-1 flex-col gap-1.5">
                        <span className="bg-skeleton h-3 w-2/3 rounded-sm" />
                        <span className="bg-skeleton h-2.5 w-1/3 rounded-sm" />
                      </div>
                      <span className="bg-skeleton h-3 w-14 rounded-sm" />
                    </div>
                  ))}
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="rounded-pill bg-surface border-border text-meta shadow-card border px-3 py-1 font-extrabold">
                    {t('payments.preview.pill')}
                  </span>
                </div>
              </div>

              <div className="rounded-card border-border bg-surface overflow-hidden border">
                <ToggleRow
                  icon={Bell}
                  tone="blue"
                  label={t('payments.notify')}
                  description={t('payments.notifySub')}
                  checked={notify}
                  onCheckedChange={(v) =>
                    patch.mutate(
                      { notifyPaymentsAvailable: v },
                      {
                        onSuccess: () => toast.success({ title: t('states:toast.saved') }),
                        onError: () => toast.error({ title: t('notifications.saveFailed') }),
                      },
                    )
                  }
                />
              </div>

              {finance && (
                <p className="text-secondary text-text-2 m-0 flex flex-wrap items-center gap-1.5">
                  <Phone aria-hidden size={16} />
                  {t('payments.meanwhile')}{' '}
                  <a href={`tel:${finance.phone}`} className="text-link font-extrabold">
                    <Ltr>{formatPhone(finance.phone)}</Ltr>
                  </a>
                </p>
              )}
            </div>
          )}
        </QueryBoundary>
      </ScreenContent>
    </AppFrame>
  )
}
