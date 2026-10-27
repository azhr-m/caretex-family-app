import { Wifi, WifiOff } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Ltr } from '@/components/common/Ltr'
import { Banner } from '@/components/ui/banner'
import { time } from '@/lib/format'
import { selectOnline, useNetworkStore, useOnline } from '@/stores/network'

const BACK_ONLINE_MS = 3000

export function OfflineBanner() {
  const { t } = useTranslation('states')
  const online = useOnline()
  const lastSuccessAt = useNetworkStore((s) => s.lastSuccessAt)
  const [mountedAt] = useState(() => Date.now())
  const [backOnlineAt, setBackOnlineAt] = useState<number | null>(null)

  useEffect(
    () =>
      useNetworkStore.subscribe((s, prev) => {
        if (selectOnline(s) && !selectOnline(prev)) setBackOnlineAt(Date.now())
      }),
    [],
  )

  useEffect(() => {
    if (backOnlineAt === null) return
    const id = setTimeout(() => setBackOnlineAt(null), BACK_ONLINE_MS)
    return () => clearTimeout(id)
  }, [backOnlineAt])

  const showOnline = online && backOnlineAt !== null
  const savedAt = time(lastSuccessAt ?? mountedAt)

  return (
    (!online || showOnline) && (
      <div key={online ? 'online' : 'offline'} className="animate-reveal grid grid-rows-[1fr]">
        <div className="min-h-0 overflow-hidden">
          {online ? (
            <Banner variant="online" icon={Wifi} title={t('backOnline')} />
          ) : (
            <Banner
              variant="offline"
              icon={WifiOff}
              title={t('offline.title')}
              body={
                <Trans
                  t={t}
                  i18nKey="offline.body"
                  values={{ time: savedAt }}
                  components={{ ltr: <Ltr /> }}
                />
              }
            />
          )}
        </div>
      </div>
    )
  )
}
