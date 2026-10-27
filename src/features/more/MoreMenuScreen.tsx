import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import {
  Building2,
  ChevronRight,
  ClipboardList,
  Clock,
  FolderOpen,
  Newspaper,
  PenLine,
  Settings,
  ShieldCheck,
  Sparkles,
  Wallet,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useMember } from '@/api/queries/me'
import { documentsQuery, feedQuery, surveysQuery } from '@/api/queries/more'
import { Avatar } from '@/components/common/Avatar'
import { NavyCard } from '@/components/common/Card'
import { DirIcon } from '@/components/common/DirIcon'
import { IconTile } from '@/components/common/IconTile'
import { Ltr } from '@/components/common/Ltr'
import { StatusChip } from '@/components/common/StatusChip'
import { MEMBER_TONE } from '@/lib/avatar'
import { formatPhone } from '@/lib/format'
import { useLang } from '@/lib/hooks'
import type { Tone } from '@/lib/status'

const APP_VERSION = (import.meta.env.VITE_APP_VERSION as string | undefined) ?? 'dev'

type Item = {
  key: string
  to: string
  icon: LucideIcon
  tone: Tone
  badge?: { tone: Tone; icon: LucideIcon; label: string } | null
}

/** More tab (design `moreMenu`): profile card, 8 destinations with live badges, app version. */
export function MoreMenuScreen({ rid }: { rid: string }) {
  const { t, i18n } = useTranslation(['common', 'auth'])
  const lang = useLang()
  const member = useMember()
  const docs = useQuery(documentsQuery(rid, { tab: 'sign' })).data?.counts
  const surveys = useQuery(surveysQuery(rid, 'active')).data?.items
  const feed = useInfiniteQuery(feedQuery({ category: 'all' })).data?.pages[0]?.items

  const docsToDo = docs ? docs.sign + docs.confirm : 0
  const surveysNew = surveys?.filter((s) => s.status === 'not_started').length ?? 0
  const feedNew = feed?.filter((f) => (f.requiresReadConfirmation && !f.readConfirmedAt) || (f.eventId && !f.rsvp)).length ?? 0

  const items: Item[] = [
    {
      key: 'documents',
      to: '/r/$rid/more/documents',
      icon: FolderOpen,
      tone: 'violet',
      badge: docsToDo ? { tone: 'violet', icon: PenLine, label: t('more.badge.toDo', { count: docsToDo }) } : null,
    },
    {
      key: 'surveys',
      to: '/r/$rid/more/surveys',
      icon: ClipboardList,
      tone: 'teal',
      badge: surveysNew ? { tone: 'blue', icon: Sparkles, label: t('more.badge.new', { count: surveysNew }) } : null,
    },
    {
      key: 'feed',
      to: '/r/$rid/more/feed',
      icon: Newspaper,
      tone: 'pink',
      badge: feedNew ? { tone: 'blue', icon: Sparkles, label: t('more.badge.new', { count: feedNew }) } : null,
    },
    { key: 'services', to: '/r/$rid/more/services', icon: Wrench, tone: 'amber' },
    { key: 'center', to: '/r/$rid/more/center', icon: Building2, tone: 'blue' },
    { key: 'permissions', to: '/r/$rid/more/permissions', icon: ShieldCheck, tone: 'green' },
    {
      key: 'payments',
      to: '/r/$rid/more/payments',
      icon: Wallet,
      tone: 'slate',
      badge: { tone: 'slate', icon: Clock, label: t('status.coming_soon') },
    },
    { key: 'settings', to: '/r/$rid/more/settings', icon: Settings, tone: 'slate' },
  ]

  const residents = member?.residents ?? []
  const names = new Intl.ListFormat(lang === 'he' ? 'he' : 'en', { type: 'conjunction' }).format(residents.map((r) => r.name))
  const relation = residents[0]?.relation

  return (
    <div className="flex flex-col gap-5">
      {member && (
        <NavyCard className="flex items-center gap-3.5">
          <Avatar initials={member.initials} tone={MEMBER_TONE} size={56} />
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="text-title-sm font-extrabold wrap-break-word">{member.displayName}</span>
            {relation && (
              <span className="text-meta opacity-85 wrap-break-word">
                {t('more.relationOf', { relation: t(`auth:relation.${relation}`), names })}
              </span>
            )}
            <Ltr className="text-meta text-start opacity-75">{formatPhone(member.phone)}</Ltr>
          </div>
        </NavyCard>
      )}

      <nav aria-label={t('tabs.more')}>
        <ul className="rounded-card border-border bg-surface shadow-card m-0 flex list-none flex-col overflow-hidden border p-0">
          {items.map((item) => (
            <li key={item.key} className="border-border border-b last:border-b-0">
              <Link
                to={item.to}
                params={{ rid }}
                className="flex min-h-16 items-center gap-3 px-3.5 py-3 text-start"
              >
                <IconTile icon={item.icon} tone={item.tone} size={42} />
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-body-sm font-extrabold wrap-break-word">{t(`more.items.${item.key}.label`)}</span>
                  <span className="text-meta text-text-2 wrap-break-word">{t(`more.items.${item.key}.desc`)}</span>
                </span>
                {item.badge && (
                  <StatusChip tone={item.badge.tone} icon={item.badge.icon} label={item.badge.label} size="sm" className="shrink-0" />
                )}
                <DirIcon icon={ChevronRight} size={20} className="text-text-2" />
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <p className="text-tag text-text-2 m-0 text-center" lang={i18n.language}>
        {t('more.version')} <Ltr>{APP_VERSION}</Ltr>
      </p>
    </div>
  )
}
