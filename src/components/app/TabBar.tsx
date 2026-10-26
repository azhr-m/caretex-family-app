import { Link, useLocation } from '@tanstack/react-router'
import { CalendarDays, House, LayoutGrid, MessagesSquare, UserRound, type LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Ltr } from '@/components/common/Ltr'
import { count as fmtCount } from '@/lib/format'
import { cn } from '@/lib/utils'

export type TabKey = 'home' | 'resident' | 'staff' | 'calendar' | 'more'

const TABS = [
  { key: 'home', icon: House, to: '/r/$rid/home' },
  { key: 'resident', icon: UserRound, to: '/r/$rid/resident' },
  { key: 'staff', icon: MessagesSquare, to: '/r/$rid/staff' },
  { key: 'calendar', icon: CalendarDays, to: '/r/$rid/calendar' },
  { key: 'more', icon: LayoutGrid, to: '/r/$rid/more' },
] as const satisfies readonly { key: TabKey; icon: LucideIcon; to: string }[]

export function TabBar({ rid, badges = {} }: { rid: string; badges?: Partial<Record<TabKey, number>> }) {
  const { t } = useTranslation()
  const pathname = useLocation({ select: (l) => l.pathname })
  const active = TABS.find((tab) => pathname.startsWith(`/r/${rid}/${tab.key}`))?.key

  return (
    <nav
      aria-label={t('tabs.label')}
      className="border-border bg-surface flex border-t px-1 pt-1.5"
      style={{ paddingBottom: 'max(6px, env(safe-area-inset-bottom))' }}
    >
      {TABS.map(({ key, icon: Icon, to }) => {
        const isActive = key === active
        const badge = isActive ? 0 : (badges[key] ?? 0)
        const label = t(`tabs.${key}`)
        return (
          <Link
            key={key}
            to={to}
            params={{ rid }}
            aria-current={isActive ? 'page' : undefined}
            aria-label={badge > 0 ? `${label}, ${t('header.tabBadge', { count: badge })}` : undefined}
            className={cn(
              'flex min-h-[54px] min-w-0 flex-1 flex-col items-center justify-center gap-0.5',
              isActive ? 'text-tab-active' : 'text-tab-idle',
            )}
          >
            <span
              aria-hidden
              className={cn(
                'relative flex h-[30px] w-[52px] items-center justify-center rounded-[15px]',
                isActive && 'bg-pill',
              )}
            >
              <Icon size={22} strokeWidth={isActive ? 2.4 : 2} />
              {badge > 0 && (
                <span className="border-surface bg-danger text-micro absolute end-0.5 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-[9px] border-2 px-1 font-extrabold text-white">
                  <Ltr>{fmtCount(badge)}</Ltr>
                </span>
              )}
            </span>
            <span
              className={cn(
                'text-label line-clamp-2 max-w-full text-center leading-[1.15] text-balance',
                isActive ? 'font-extrabold' : 'font-semibold',
              )}
            >
              {label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
