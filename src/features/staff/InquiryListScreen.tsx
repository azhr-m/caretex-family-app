import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import {
  Archive,
  ArrowDownUp,
  Building2,
  ChevronDown,
  ChevronRight,
  CircleCheck,
  Eye,
  FilterX,
  List,
  Loader,
  MessageSquareDot,
  MessageSquarePlus,
  MessagesSquare,
  Reply,
  SearchX,
  Sparkles,
} from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMember } from '@/api/queries/me'
import { departmentsQuery, inquiriesQuery } from '@/api/queries/inquiries'
import type { DepartmentCode } from '@/api/schemas/common'
import type { InquiryStatus, InquirySummary } from '@/api/schemas/inquiries'
import { PullToRefresh, refetchAll } from '@/components/app/PullToRefresh'
import { DirIcon } from '@/components/common/DirIcon'
import { IconTile } from '@/components/common/IconTile'
import { LoadMore } from '@/components/common/LoadMore'
import { Ltr } from '@/components/common/Ltr'
import { StatusChip } from '@/components/common/StatusChip'
import { QueryBoundary } from '@/components/states/QueryBoundary'
import { EmptyState } from '@/components/states/states'
import { StateView } from '@/components/states/StateView'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { Button } from '@/components/ui/button'
import { Fab } from '@/components/ui/fab'
import { SearchField } from '@/components/ui/search-field'
import { FilterChips, type ChipOption } from '@/components/ui/filter-chips'
import { ListSkeleton } from '@/components/ui/skeleton'
import { DEPARTMENT_META } from '@/lib/departments'
import { date } from '@/lib/format'
import { INQUIRY_CHIP } from '@/lib/inquiry'
import { firstName } from '@/lib/names'
import { toneClasses } from '@/lib/status'
import { cn } from '@/lib/utils'

export type InquiryListSearch = {
  q?: string
  dept?: DepartmentCode
  status?: InquiryStatus
  sort?: 'newest' | 'oldest'
}

const STATUS_FILTERS = [
  { value: 'all', icon: List },
  { value: 'waiting_for_family', icon: Reply },
  { value: 'in_progress', icon: Loader },
  { value: 'new', icon: Sparkles },
  { value: 'read', icon: Eye },
  { value: 'handled', icon: CircleCheck },
  { value: 'closed', icon: Archive },
] as const

export function InquiryListScreen({ rid, search }: { rid: string; search: InquiryListSearch }) {
  const { t } = useTranslation(['staff', 'common'])
  const navigate = useNavigate()
  const name = firstName(useMember()?.residents.find((r) => r.id === rid)?.name ?? '')
  const filters = { q: search.q, department: search.dept, status: search.status, sort: search.sort }
  const query = useInfiniteQuery(inquiriesQuery(rid, filters))
  const [deptOpen, setDeptOpen] = useState(false)

  const setSearch = (patch: Partial<InquiryListSearch>) =>
    void navigate({
      to: '/r/$rid/staff',
      params: { rid },
      search: (prev) => ({ ...prev, ...patch }),
      replace: true,
    })
  const filtered = !!(search.q || search.dept || search.status)
  const clearAll = () => setSearch({ q: undefined, dept: undefined, status: undefined })
  const counts = query.data?.pages[0]?.counts
  const sort = search.sort ?? 'newest'

  const statusOptions: ChipOption<(typeof STATUS_FILTERS)[number]['value']>[] = STATUS_FILTERS.map((f) => ({
    value: f.value,
    icon: f.icon,
    label: f.value === 'all' ? t('list.all') : t(`common:status.${INQUIRY_CHIP[f.value]}`),
    count: counts?.[f.value],
  }))

  return (
    <div className="flex flex-col gap-3.5 pb-[100px]">
      <div className="flex flex-col gap-1">
        <h1 className="text-title-lg m-0 font-extrabold">{t('list.title')}</h1>
        <p className="text-secondary text-text-2 m-0">{t('list.sub')}</p>
      </div>

      <SearchField
        committed={search.q ?? ''}
        onSearch={(q) => setSearch({ q: q || undefined })}
        label={t('list.searchLabel')}
        placeholder={t('list.searchPlaceholder')}
        clearLabel={t('list.clear')}
      />

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setDeptOpen(true)}
          aria-haspopup="dialog"
          className={cn(
            'text-secondary flex min-h-11 min-w-0 items-center gap-1.5 rounded-[12px] border px-3 font-extrabold',
            search.dept ? 'border-primary bg-pill' : 'border-border bg-surface',
          )}
        >
          <Building2 aria-hidden size={17} className="shrink-0" />
          <span className="truncate">{search.dept ? t(`departments.${search.dept}`) : t('list.allDepartments')}</span>
          <ChevronDown aria-hidden size={16} className="shrink-0" />
        </button>
        <button
          type="button"
          onClick={() => setSearch({ sort: sort === 'newest' ? 'oldest' : undefined })}
          className="border-border bg-surface text-secondary flex min-h-11 items-center gap-1.5 rounded-[12px] border px-3 font-extrabold"
        >
          <ArrowDownUp aria-hidden size={17} />
          {t(`list.sort.${sort}`)}
        </button>
      </div>

      <FilterChips
        label={t('list.statusLabel')}
        value={search.status ?? 'all'}
        onChange={(v) => setSearch({ status: v === 'all' ? undefined : v })}
        options={statusOptions}
      />

      <PullToRefresh onRefresh={() => refetchAll(query.refetch)}>
        <QueryBoundary
          query={query}
          skeleton={<ListSkeleton rows={4} />}
          isEmpty={(d) => d.pages[0]?.items.length === 0}
          empty={
            filtered ? (
              <NoResults search={search} onClear={clearAll} rid={rid} />
            ) : (
              <EmptyState
                icon={MessagesSquare}
                title={t('list.empty')}
                body={t('list.emptyBody', { name })}
                action={
                  <Button asChild block>
                    <Link to="/r/$rid/staff/new" params={{ rid }}>
                      <MessageSquarePlus aria-hidden size={20} />
                      {t('new.title')}
                    </Link>
                  </Button>
                }
              />
            )
          }
        >
          {(d) => (
            <div className="flex flex-col gap-2.5">
              {d.pages
                .flatMap((p) => p.items)
                .map((q) => (
                  <InquiryCard key={q.id} inquiry={q} rid={rid} />
                ))}
              <LoadMore
                hasNext={query.hasNextPage}
                loading={query.isFetchingNextPage}
                onLoad={() => void query.fetchNextPage()}
                loadingLabel={t('list.loadingMore')}
              />
            </div>
          )}
        </QueryBoundary>
      </PullToRefresh>

      <DepartmentSheet
        open={deptOpen}
        onOpenChange={setDeptOpen}
        value={search.dept}
        onChange={(dept) => {
          setDeptOpen(false)
          setSearch({ dept })
        }}
      />

      <Fab
        icon={MessageSquarePlus}
        label={t('new.title')}
        onClick={() => void navigate({ to: '/r/$rid/staff/new', params: { rid } })}
      />
    </div>
  )
}

function InquiryCard({ inquiry: q, rid }: { inquiry: InquirySummary; rid: string }) {
  const { t } = useTranslation('staff')
  const meta = DEPARTMENT_META[q.department]
  const preview = q.lastMessagePreview
  return (
    <Link
      to="/r/$rid/staff/$inquiryId"
      params={{ rid, inquiryId: q.id }}
      className={cn(
        'rounded-card bg-surface shadow-card flex flex-col gap-2.5 border p-3.5 text-start',
        q.hasUnreadReply ? toneClasses.blue.bd : 'border-border',
      )}
    >
      <div className="flex items-start gap-3">
        <IconTile icon={meta.icon} tone={meta.tone} size={44} />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-body leading-[1.3] font-extrabold text-pretty wrap-break-word">{q.subject}</span>
          <span className="text-meta text-text-2">
            {t(`departments.${q.department}`)} · <Ltr>{date(q.lastMessageAt)}</Ltr>
          </span>
        </div>
        {q.hasUnreadReply && (
          <span className="rounded-pill bg-danger text-tag flex shrink-0 items-center gap-1 px-2 py-0.5 font-extrabold whitespace-nowrap text-white">
            <MessageSquareDot aria-hidden size={13} />
            {t('list.newReply')}
          </span>
        )}
      </div>
      <span className="text-secondary text-text-2 line-clamp-2 wrap-break-word">
        {preview.isYou
          ? t('list.youPreview', { text: preview.text })
          : t('list.preview', { name: preview.authorName, text: preview.text })}
      </span>
      <div className="flex items-center justify-between gap-2">
        <StatusChip status={INQUIRY_CHIP[q.status]} />
        <span className="text-meta text-text-2 flex items-center gap-1 font-bold">
          <Ltr>{q.ref}</Ltr>
          <DirIcon icon={ChevronRight} size={17} />
        </span>
      </div>
    </Link>
  )
}

function NoResults({ search, onClear, rid }: { search: InquiryListSearch; onClear: () => void; rid: string }) {
  const { t } = useTranslation('staff')
  const dept = search.dept ? t(`departments.${search.dept}`) : undefined
  const body = search.q
    ? dept
      ? t('list.noResultsQueryDept', { q: search.q, dept })
      : t('list.noResultsQuery', { q: search.q })
    : t('list.noResultsFilters')
  return (
    <StateView
      icon={SearchX}
      tone="slate"
      title={t('list.noResultsTitle')}
      body={body}
      actions={
        <>
          <Button variant="secondary" icon={FilterX} block onClick={onClear}>
            {t('list.clearAll')}
          </Button>
          <Button asChild block>
            <Link to="/r/$rid/staff/new" params={{ rid }} search={search.dept ? { dept: search.dept } : {}}>
              <MessageSquarePlus aria-hidden size={20} />
              {t('new.title')}
            </Link>
          </Button>
        </>
      }
    />
  )
}

function DepartmentSheet({
  open,
  onOpenChange,
  value,
  onChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  value?: DepartmentCode
  onChange: (dept: DepartmentCode | undefined) => void
}) {
  const { t } = useTranslation(['staff', 'common'])
  const departments = useQuery(departmentsQuery()).data
  const options: (DepartmentCode | undefined)[] = [undefined, ...(departments?.map((d) => d.code) ?? [])]
  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title={t('list.departmentSheet')}>
      <div role="radiogroup" aria-label={t('list.departmentSheet')} className="flex flex-col gap-2">
        {options.map((code) => {
          const selected = code === value
          const meta = code ? DEPARTMENT_META[code] : { icon: Building2, tone: 'slate' as const }
          return (
            <button
              key={code ?? 'all'}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(code)}
              className={cn(
                'text-body-sm flex min-h-14 items-center gap-3 rounded-[16px] border-2 px-3 text-start font-extrabold',
                selected ? 'border-primary bg-pill' : 'border-border bg-surface',
              )}
            >
              <IconTile icon={meta.icon} tone={meta.tone} size={36} />
              <span className="min-w-0 flex-1">{code ? t(`departments.${code}`) : t('list.allDepartments')}</span>
              {selected && <CircleCheck aria-hidden size={20} className="text-green-fg shrink-0" />}
            </button>
          )
        })}
      </div>
    </BottomSheet>
  )
}
