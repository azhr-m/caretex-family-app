import { useQuery } from '@tanstack/react-query'
import { Link, useLocation } from '@tanstack/react-router'
import { Hourglass, Lock } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useMember } from '@/api/queries/me'
import { dashboardQuery, permissionsQuery } from '@/api/queries/residents'
import { Ltr } from '@/components/common/Ltr'
import { count as fmtCount } from '@/lib/format'
import { firstName } from '@/lib/names'
import { cn } from '@/lib/utils'
import { SEGMENTS } from '../segments'

/** Horizontal pill bar: icon + label, lock / hourglass for denied / not shared, hidden ones omitted. */
export function SegmentBar({ rid }: { rid: string }) {
  const { t } = useTranslation('resident')
  const pathname = useLocation({ select: (l) => l.pathname })
  const permissions = useQuery(permissionsQuery(rid)).data
  const badge = useQuery({ ...dashboardQuery(rid), select: (d) => d.counts.tabs.resident }).data ?? 0
  const name = firstName(useMember()?.residents.find((r) => r.id === rid)?.name ?? '')
  const activeRef = useRef<HTMLAnchorElement>(null)

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest', inline: 'center' })
  }, [pathname])

  return (
    <nav aria-label={t('segments.label')} className="-mx-4 -mt-1 mb-3.5">
      <div className="scrollbar-none flex snap-x gap-2 overflow-x-auto px-4 py-1">
        {SEGMENTS.map((s) => {
          const value = permissions?.[s.permission] ?? 'allowed'
          if (value === 'hidden') return null
          const active = pathname.startsWith(`/r/${rid}/resident/${s.key}`)
          const Icon = value === 'denied' ? Lock : value === 'not_shared' ? Hourglass : s.icon
          const label = t(s.labelKey, { name })
          const count = s.key === 'updates' && value === 'allowed' && !active ? badge : 0
          return (
            <Link
              key={s.key}
              ref={active ? activeRef : undefined}
              to={`/r/$rid/resident/${s.key}`}
              params={{ rid }}
              aria-current={active ? 'page' : undefined}
              aria-label={
                value === 'denied'
                  ? t('segments.denied', { label })
                  : value === 'not_shared'
                    ? t('segments.notShared', { label })
                    : undefined
              }
              className={cn(
                'text-secondary relative flex h-11 shrink-0 snap-start items-center gap-1.5 rounded-[22px] border px-3.5 font-extrabold whitespace-nowrap',
                active ? 'border-primary bg-primary text-on-primary' : 'border-border bg-surface text-text',
              )}
            >
              <Icon aria-hidden size={17} className="shrink-0" />
              <span>{label}</span>
              {count > 0 && (
                <span className="bg-danger text-micro flex h-[18px] min-w-[18px] items-center justify-center rounded-[9px] px-1 text-white">
                  <Ltr>{fmtCount(count)}</Ltr>
                </span>
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
