import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import {
  CalendarRange,
  Check,
  ChevronDown,
  ChevronRight,
  CircleCheck,
  Clock,
  ClockAlert,
  Eye,
  FileCheck,
  FilePen,
  FileSignature,
  FileText,
  FolderOpen,
  Handshake,
  PenLine,
  Signature,
  type LucideIcon,
} from 'lucide-react'
import { useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import type { DocumentTab } from '@/api/endpoints/more'
import { documentsQuery } from '@/api/queries/more'
import type { DocumentSummary, DocumentType } from '@/api/schemas/documents'
import { AppFrame, ScreenContent } from '@/components/app/AppFrame'
import { PullToRefresh, refetchAll } from '@/components/app/PullToRefresh'
import { TopBar } from '@/components/app/TopBar'
import { DirIcon } from '@/components/common/DirIcon'
import { IconTile } from '@/components/common/IconTile'
import { Ltr } from '@/components/common/Ltr'
import { QueryBoundary } from '@/components/states/QueryBoundary'
import { EmptyState } from '@/components/states/states'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { Button } from '@/components/ui/button'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { ListSkeleton } from '@/components/ui/skeleton'
import { appDate } from '@/lib/clock'
import { date, dateTime } from '@/lib/format'
import type { Tone } from '@/lib/status'
import { toneClasses } from '@/lib/status'
import { cn } from '@/lib/utils'
import { DocumentStatusChip } from './status'

export type DocumentsSearch = { tab?: DocumentTab; type?: string; year?: number }

const TYPES: DocumentType[] = ['consent', 'approval', 'policy', 'agreement', 'form', 'other']

export const TYPE_META: Record<DocumentType, { icon: LucideIcon; tone: Tone }> = {
  consent: { icon: Signature, tone: 'violet' },
  approval: { icon: Handshake, tone: 'blue' },
  policy: { icon: FileCheck, tone: 'teal' },
  agreement: { icon: FileSignature, tone: 'green' },
  form: { icon: FilePen, tone: 'amber' },
  other: { icon: FileText, tone: 'slate' },
}

export function DocumentsListScreen({ rid, search }: { rid: string; search: DocumentsSearch }) {
  const { t } = useTranslation(['documents', 'common'])
  const navigate = useNavigate()
  const tab = search.tab ?? 'sign'
  const type = TYPES.includes(search.type as DocumentType) ? (search.type as DocumentType) : undefined
  const query = useQuery(documentsQuery(rid, { tab, type, year: search.year }))
  const counts = query.data?.counts
  const [sheet, setSheet] = useState<'type' | 'year' | null>(null)
  const thisYear = appDate().getFullYear()

  const set = (patch: DocumentsSearch) =>
    void navigate({ to: '/r/$rid/more/documents', params: { rid }, search: { ...search, ...patch }, replace: true })
  const label = (key: DocumentTab) => (counts ? `${t(`list.tabs.${key}`)} (${counts[key]})` : t(`list.tabs.${key}`))

  return (
    <AppFrame>
      <TopBar title={t('list.title')} backLabel={t('common:tabs.more')} fallbackHref={`/r/${rid}/more`} />
      <ScreenContent className="flex flex-col gap-3.5">
        <p className="text-secondary text-text-2 m-0">{t('list.intro')}</p>
        <SegmentedControl
          label={t('list.title')}
          value={tab}
          onChange={(v) => set({ tab: v === 'sign' ? undefined : v })}
          options={[
            { value: 'sign', label: label('sign'), icon: PenLine },
            { value: 'confirm', label: label('confirm'), icon: Eye },
            { value: 'done', label: label('done'), icon: CircleCheck },
          ]}
        />
        <div className="flex flex-wrap gap-2">
          <FilterButton icon={FolderOpen} active={!!type} onClick={() => setSheet('type')}>
            {type ? t(`types.${type}`) : t('list.allTypes')}
          </FilterButton>
          <FilterButton icon={CalendarRange} active={!!search.year} onClick={() => setSheet('year')}>
            {search.year ? <Ltr>{search.year}</Ltr> : t('list.allYears')}
          </FilterButton>
        </div>
        <PullToRefresh onRefresh={() => refetchAll(query.refetch)}>
          <QueryBoundary
            query={query}
            skeleton={<ListSkeleton rows={3} />}
            isEmpty={(d) => d.items.length === 0}
            empty={
              <EmptyState
                icon={FolderOpen}
                tone="green"
                title={tab === 'done' ? t('list.emptyDone') : t('list.empty')}
                action={
                  tab !== 'done' && (
                    <Button variant="secondary" block icon={CircleCheck} onClick={() => set({ tab: 'done' })}>
                      {t('list.viewCompleted')}
                    </Button>
                  )
                }
              />
            }
          >
            {(d) => (
              <div className="flex flex-col gap-2.5">
                {d.items.map((doc) => (
                  <DocumentCard key={doc.id} doc={doc} rid={rid} />
                ))}
              </div>
            )}
          </QueryBoundary>
        </PullToRefresh>
      </ScreenContent>

      <BottomSheet open={sheet === 'type'} onOpenChange={(o) => setSheet(o ? 'type' : null)} title={t('list.typeLabel')}>
        <Choices
          options={[{ value: undefined, label: t('list.allTypes') }, ...TYPES.map((x) => ({ value: x, label: t(`types.${x}`) }))]}
          value={type}
          onPick={(v) => {
            setSheet(null)
            set({ type: v })
          }}
        />
      </BottomSheet>
      <BottomSheet open={sheet === 'year'} onOpenChange={(o) => setSheet(o ? 'year' : null)} title={t('list.yearLabel')}>
        <Choices
          options={[
            { value: undefined, label: t('list.allYears') },
            ...[thisYear, thisYear - 1, thisYear - 2].map((y) => ({ value: y, label: String(y) })),
          ]}
          value={search.year}
          onPick={(v) => {
            setSheet(null)
            set({ year: v })
          }}
        />
      </BottomSheet>
    </AppFrame>
  )
}

function FilterButton({
  icon: Icon,
  active,
  onClick,
  children,
}: {
  icon: LucideIcon
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-haspopup="dialog"
      className={cn(
        'text-secondary flex min-h-11 items-center gap-1.5 rounded-[12px] border px-3 font-extrabold',
        active ? 'border-primary bg-pill' : 'border-border bg-surface',
      )}
    >
      <Icon aria-hidden size={17} />
      {children}
      <ChevronDown aria-hidden size={16} />
    </button>
  )
}

function Choices<T extends string | number | undefined>({
  options,
  value,
  onPick,
}: {
  options: { value: T; label: string }[]
  value: T
  onPick: (v: T) => void
}) {
  return (
    <div role="radiogroup" className="flex flex-col gap-2">
      {options.map((o) => {
        const selected = o.value === value
        return (
          <button
            key={String(o.value ?? 'all')}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onPick(o.value)}
            className={cn(
              'text-body-sm flex min-h-14 items-center gap-3 rounded-[16px] border-2 px-4 text-start font-extrabold',
              selected ? 'border-primary bg-pill' : 'border-border bg-surface',
            )}
          >
            <span className="min-w-0 flex-1">{o.label}</span>
            {selected && <Check aria-hidden size={20} className="text-primary shrink-0" />}
          </button>
        )
      })}
    </div>
  )
}

function DocumentCard({ doc: d, rid }: { doc: DocumentSummary; rid: string }) {
  const { t } = useTranslation(['documents', 'staff'])
  const meta = TYPE_META[d.type]
  const done = !!d.completedAt
  const dueLine = done ? (
    <span className={cn('flex items-center gap-1.5', toneClasses.green.fg)}>
      <Check aria-hidden size={15} />
      <Ltr>{dateTime(d.completedAt!)}</Ltr>
    </span>
  ) : d.status === 'overdue' && d.dueAt ? (
    <span className={cn('flex items-center gap-1.5', toneClasses.red.fg)}>
      <ClockAlert aria-hidden size={15} />
      <Trans t={t} i18nKey="list.overdue" values={{ date: date(d.dueAt) }} components={{ ltr: <Ltr /> }} />
    </span>
  ) : d.dueAt ? (
    <span className={cn('flex items-center gap-1.5', toneClasses.amber.fg)}>
      <Clock aria-hidden size={15} />
      <Trans t={t} i18nKey="list.due" values={{ date: date(d.dueAt) }} components={{ ltr: <Ltr /> }} />
    </span>
  ) : null
  return (
    <Link
      to="/r/$rid/more/documents/$docId"
      params={{ rid, docId: d.id }}
      className="rounded-card border-border bg-surface shadow-card flex flex-col gap-2.5 border p-3.5 text-start"
    >
      <div className="flex items-start gap-3">
        <IconTile icon={meta.icon} tone={done ? 'green' : meta.tone} size={44} />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-body leading-[1.3] font-extrabold text-pretty wrap-break-word">{d.title}</span>
          <span className="text-meta text-text-2">
            <Trans
              t={t}
              i18nKey="list.fromSent"
              values={{ from: t(`staff:departments.${d.from.department}`), date: date(d.sentAt) }}
              components={{ ltr: <Ltr /> }}
            />
          </span>
        </div>
        <DirIcon icon={ChevronRight} size={20} className="text-text-2 mt-1" />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <DocumentStatusChip doc={d} />
        {dueLine && <span className="text-meta font-bold">{dueLine}</span>}
      </div>
    </Link>
  )
}

