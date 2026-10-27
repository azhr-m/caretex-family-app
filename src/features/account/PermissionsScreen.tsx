import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import {
  CalendarCheck,
  Check,
  ClipboardList,
  HeartPulse,
  Hourglass,
  Info,
  MessageSquarePlus,
  MessagesSquare,
  Newspaper,
  Signature,
  Sun,
  UserRound,
  Wallet,
  Wrench,
  X,
  type LucideIcon,
} from 'lucide-react'
import { ToggleGroup } from 'radix-ui'
import { Trans, useTranslation } from 'react-i18next'
import { useMember } from '@/api/queries/me'
import { permissionsQuery } from '@/api/queries/residents'
import type { PermissionKey, PermissionValue } from '@/api/schemas/resident'
import { AppFrame, ScreenContent } from '@/components/app/AppFrame'
import { TopBar } from '@/components/app/TopBar'
import { Avatar } from '@/components/common/Avatar'
import { IconTile } from '@/components/common/IconTile'
import { Ltr } from '@/components/common/Ltr'
import { StatusChip } from '@/components/common/StatusChip'
import { QueryBoundary } from '@/components/states/QueryBoundary'
import { Button } from '@/components/ui/button'
import { ListSkeleton } from '@/components/ui/skeleton'
import { residentTone } from '@/lib/avatar'
import { date } from '@/lib/format'
import { toneClasses } from '@/lib/status'
import { cn } from '@/lib/utils'

const ROWS: { key: PermissionKey; icon: LucideIcon }[] = [
  { key: 'general', icon: Info },
  { key: 'updates', icon: Newspaper },
  { key: 'medical', icon: HeartPulse },
  { key: 'carePlan', icon: ClipboardList },
  { key: 'schedule', icon: Sun },
  { key: 'documents', icon: Signature },
  { key: 'inquiries', icon: MessagesSquare },
  { key: 'serviceRequests', icon: Wrench },
  { key: 'billing', icon: Wallet },
]

function PermissionChip({ value }: { value: PermissionValue }) {
  const { t } = useTranslation('settings')
  if (value === 'allowed') return <StatusChip tone="green" icon={Check} label={t('permissions.allowed')} size="sm" />
  if (value === 'not_shared') return <StatusChip tone="amber" icon={Hourglass} label={t('permissions.notShared')} size="sm" />
  return <StatusChip tone="red" icon={X} label={t('permissions.notAllowed')} size="sm" />
}

/** Read-only view of what the member may see per resident (6.8). */
export function PermissionsScreen({ rid, resident }: { rid: string; resident?: string }) {
  const { t } = useTranslation(['settings', 'common', 'auth'])
  const navigate = useNavigate()
  const member = useMember()
  const residents = member?.residents ?? []
  const current = residents.find((r) => r.id === resident) ?? residents.find((r) => r.id === rid) ?? residents[0]
  const query = useQuery({ ...permissionsQuery(current?.id ?? rid), enabled: !!current })
  const b = toneClasses.blue

  return (
    <AppFrame>
      <TopBar title={t('permissions.title')} backLabel={t('common:tabs.more')} fallbackHref={`/r/${rid}/more`} />
      <ScreenContent className="flex flex-col gap-4">
        <div className={cn('rounded-input text-secondary flex items-start gap-2.5 border p-3.5', b.bg, b.bd)}>
          <Info aria-hidden size={19} className={cn('mt-px shrink-0', b.fg)} />
          <span className="min-w-0 flex-1">{t('permissions.intro')}</span>
        </div>

        {residents.length > 1 && (
          <ToggleGroup.Root
            type="single"
            value={current?.id}
            onValueChange={(v) =>
              v && void navigate({ to: '/r/$rid/more/permissions', params: { rid }, search: { resident: v }, replace: true })
            }
            aria-label={t('permissions.residentLabel')}
            className="rounded-btn bg-surface-2 flex gap-1 p-1"
          >
            {residents.map((r, i) => (
              <ToggleGroup.Item
                key={r.id}
                value={r.id}
                className="rounded-tile text-secondary text-text-2 data-[state=on]:bg-surface data-[state=on]:text-text data-[state=on]:shadow-seg flex min-h-12 min-w-0 flex-1 items-center justify-center gap-2 px-2 font-extrabold"
              >
                <Avatar initials={r.initials} photoUrl={r.photoUrl} tone={residentTone(i)} size={28} />
                <span className="truncate">{r.name}</span>
              </ToggleGroup.Item>
            ))}
          </ToggleGroup.Root>
        )}

        <QueryBoundary query={query} skeleton={<ListSkeleton rows={5} />}>
          {(p) => (
            <>
              <div className="flex flex-wrap gap-2">
                {current && (
                  <StatusChip
                    tone="pink"
                    icon={UserRound}
                    label={
                      current.isPrimaryContact
                        ? `${t(`auth:relation.${current.relation}`)} · ${t('permissions.primaryContact')}`
                        : t(`auth:relation.${current.relation}`)
                    }
                  />
                )}
                <span className="rounded-pill bg-surface-2 text-tag inline-flex items-center gap-[5px] px-2.5 py-1 font-bold">
                  <CalendarCheck aria-hidden size={14} />
                  <Trans t={t} i18nKey="permissions.updated" values={{ date: date(p.updatedAt) }} components={{ ltr: <Ltr /> }} />
                </span>
              </div>
              <ul className="rounded-card border-border bg-surface m-0 flex list-none flex-col border p-0">
                {ROWS.map((row) => (
                  <li key={row.key} className="border-border flex min-h-16 items-center gap-3 border-b px-3.5 py-3 last:border-b-0">
                    <IconTile icon={row.icon} tone="slate" size={36} />
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="text-body-sm font-extrabold wrap-break-word">{t(`permissions.items.${row.key}.label`)}</span>
                      <span className="text-meta text-text-2 wrap-break-word">
                        {p.notes[row.key] ?? t(`permissions.items.${row.key}.desc`)}
                      </span>
                    </div>
                    <PermissionChip value={p[row.key]} />
                  </li>
                ))}
              </ul>
            </>
          )}
        </QueryBoundary>

        <Button asChild variant="secondary" block>
          <Link to="/r/$rid/staff/new" params={{ rid }} search={{ dept: 'social_work', subject: t('permissions.askSubject') }}>
            <MessageSquarePlus aria-hidden size={20} />
            {t('permissions.ask')}
          </Link>
        </Button>
      </ScreenContent>
    </AppFrame>
  )
}
