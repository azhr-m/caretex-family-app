import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { Check, ChevronRight, Heart, Sparkles, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { centerPublicQuery } from '@/api/queries/center'
import { useMember } from '@/api/queries/me'
import { AppFrame } from '@/components/app/AppFrame'
import { OfflineBanner } from '@/components/app/OfflineBanner'
import { Avatar } from '@/components/common/Avatar'
import { InfoBox } from '@/components/common/Card'
import { DirIcon } from '@/components/common/DirIcon'
import { StatusChip } from '@/components/common/StatusChip'
import { ListSkeleton } from '@/components/ui/skeleton'
import { residentTone } from '@/lib/avatar'
import { useSessionStore } from '@/stores/session'

export function ResidentPickerScreen() {
  const { t } = useTranslation('auth')
  const navigate = useNavigate()
  const member = useMember()
  const center = useQuery(centerPublicQuery()).data
  const setActiveResident = useSessionStore((s) => s.setActiveResident)

  const pick = (rid: string) => {
    setActiveResident(rid)
    void navigate({ to: '/r/$rid/home', params: { rid } })
  }

  return (
    <AppFrame>
      <OfflineBanner />
      <main className="flex flex-col gap-[18px] px-5 pt-7 pb-8">
        {!member ? (
          <ListSkeleton rows={2} />
        ) : (
          <>
            <div className="flex flex-col gap-1.5">
              <span className="text-body-sm text-text-2 font-bold">
                {t('picker.hello', { name: member.firstName })}
              </span>
              <h1 className="text-title-xl m-0 font-extrabold text-pretty">{t('picker.title')}</h1>
              {center && (
                <p className="text-body-sm text-text-2 m-0">
                  {t('picker.sub', { count: member.residents.length, center: center.name })}
                </p>
              )}
            </div>
            <ul className="m-0 flex list-none flex-col gap-3 p-0">
              {member.residents.map((r, i) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => pick(r.id)}
                    className="rounded-card border-border bg-surface shadow-card flex w-full items-center gap-3.5 border p-4 text-start active:brightness-[.97]"
                  >
                    <Avatar initials={r.initials} photoUrl={r.photoUrl} tone={residentTone(i)} size={60} />
                    <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
                      <span className="text-title-xs font-extrabold wrap-break-word">{r.name}</span>
                      <span className="text-secondary text-text-2">
                        {r.ward} · {r.room}
                      </span>
                      <span className="text-meta text-text-2 flex items-center gap-[5px]">
                        <Heart aria-hidden size={14} className="shrink-0" />
                        {t('picker.relation', { relation: t(`relation.${r.relation}`) })}
                      </span>
                      <span className="mt-1">
                        {r.newItemsCount > 0 ? (
                          <StatusChip
                            tone="blue"
                            icon={Sparkles}
                            label={t('picker.newCount', { count: r.newItemsCount })}
                          />
                        ) : (
                          <StatusChip tone="green" icon={Check} label={t('picker.noNew')} />
                        )}
                      </span>
                    </div>
                    <DirIcon icon={ChevronRight} size={22} className="text-text-2" />
                  </button>
                </li>
              ))}
            </ul>
            <InfoBox icon={Users}>{t('picker.note')}</InfoBox>
          </>
        )}
      </main>
    </AppFrame>
  )
}
