import { useLocation, useNavigate } from '@tanstack/react-router'
import { ChevronRight, CircleCheck, Info, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useMember } from '@/api/queries/me'
import { Avatar } from '@/components/common/Avatar'
import { DirIcon } from '@/components/common/DirIcon'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { toast } from '@/components/ui/toast'
import { residentTone } from '@/lib/avatar'
import { cn } from '@/lib/utils'
import { useSessionStore } from '@/stores/session'
import { useUiStore } from '@/stores/ui'

const TAB_ROUTES = {
  home: '/r/$rid/home',
  resident: '/r/$rid/resident',
  staff: '/r/$rid/staff',
  calendar: '/r/$rid/calendar',
  more: '/r/$rid/more',
} as const

export function ResidentSwitcherSheet({ rid }: { rid: string }) {
  const { t } = useTranslation('auth')
  const open = useUiStore((s) => s.residentSheetOpen)
  const setOpen = useUiStore((s) => s.setResidentSheetOpen)
  const member = useMember()
  const navigate = useNavigate()
  const pathname = useLocation({ select: (l) => l.pathname })

  const select = (id: string, name: string) => {
    setOpen(false)
    if (id === rid) return
    useSessionStore.getState().setActiveResident(id)
    const segment = pathname.split('/')[3] as keyof typeof TAB_ROUTES
    void navigate({ to: TAB_ROUTES[segment] ?? TAB_ROUTES.home, params: { rid: id } })
    toast.success({ title: t('switcher.nowViewing', { name }) })
  }

  return (
    <BottomSheet
      open={open}
      onOpenChange={setOpen}
      title={
        <span className="flex items-center gap-2.5">
          <span className="flex min-w-0 flex-1 flex-col">
            <span>{t('switcher.title')}</span>
            <span className="text-secondary text-text-2 font-normal">{t('switcher.sub')}</span>
          </span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="border-border bg-surface flex min-h-[52px] min-w-14 shrink-0 flex-col items-center justify-center gap-0.5 rounded-[14px] border"
          >
            <X aria-hidden size={20} />
            <span className="text-micro font-extrabold">{t('common:actions.close')}</span>
          </button>
        </span>
      }
    >
      <div className="flex flex-col gap-3">
        {member?.residents.map((r, i) => {
          const selected = r.id === rid
          return (
            <button
              key={r.id}
              type="button"
              aria-current={selected ? 'true' : undefined}
              onClick={() => select(r.id, r.name)}
              className={cn(
                'rounded-btn bg-surface flex items-center gap-3 border-2 p-3.5 text-start',
                selected ? 'border-primary' : 'border-border',
              )}
            >
              <Avatar initials={r.initials} photoUrl={r.photoUrl} tone={residentTone(i)} size={52} />
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-[17px] font-extrabold wrap-break-word">{r.name}</span>
                <span className="text-secondary text-text-2">
                  {r.ward} · {r.room}
                </span>
              </span>
              <span
                className={cn(
                  'flex shrink-0 flex-col items-center gap-0.5',
                  selected ? 'text-green-fg' : 'text-text-2',
                )}
              >
                {selected ? <CircleCheck aria-hidden size={22} /> : <DirIcon icon={ChevronRight} size={22} />}
                <span className="text-micro font-extrabold">
                  {selected ? t('switcher.viewing') : t('switcher.view')}
                </span>
              </span>
            </button>
          )
        })}
        <p className="text-meta text-text-2 m-0 flex gap-2.5">
          <Info aria-hidden size={16} className="mt-px shrink-0" />
          {t('picker.note')}
        </p>
      </div>
    </BottomSheet>
  )
}
