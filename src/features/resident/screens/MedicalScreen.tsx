import { useQuery } from '@tanstack/react-query'
import { Building2, HeartPulse, Info, TriangleAlert } from 'lucide-react'
import { Trans, useTranslation } from 'react-i18next'
import { useMember } from '@/api/queries/me'
import { medicalQuery } from '@/api/queries/residents'
import type { Medical, MedicalCategoryCode } from '@/api/schemas/resident'
import { PullToRefresh, refetchAll } from '@/components/app/PullToRefresh'
import { IconTile } from '@/components/common/IconTile'
import { Ltr } from '@/components/common/Ltr'
import { StatusChip } from '@/components/common/StatusChip'
import { QueryBoundary } from '@/components/states/QueryBoundary'
import { EmptyState } from '@/components/states/states'
import { ListSkeleton } from '@/components/ui/skeleton'
import { date } from '@/lib/format'
import { firstName } from '@/lib/names'
import { toneClasses } from '@/lib/status'
import { cn } from '@/lib/utils'
import { SectionGate, permissionStates } from '../components/SectionGate'
import { MEDICAL_CATEGORY } from '../meta'

type Category = Extract<Medical, { state: 'ok' }>['categories'][number]

const ORDER = Object.keys(MEDICAL_CATEGORY) as MedicalCategoryCode[]

export function MedicalScreen({ rid }: { rid: string }) {
  return (
    <SectionGate rid={rid} permission="medical">
      <MedicalQuery rid={rid} />
    </SectionGate>
  )
}

function MedicalQuery({ rid }: { rid: string }) {
  const { t } = useTranslation('resident')
  const query = useQuery(medicalQuery(rid))
  const name = firstName(useMember()?.residents.find((r) => r.id === rid)?.name ?? '')
  const visible = (m: Medical) =>
    m.state === 'ok'
      ? m.categories
          .filter((c) => c.items.length > 0)
          .sort((a, b) => ORDER.indexOf(a.code) - ORDER.indexOf(b.code))
      : []
  return (
    <PullToRefresh onRefresh={() => refetchAll(query.refetch)}>
      <QueryBoundary
        query={query}
        skeleton={<ListSkeleton rows={4} />}
        permission={permissionStates(rid, 'medical')}
        isNotShared={(m) => m.state === 'not_shared'}
        isEmpty={(m) => visible(m).length === 0}
        empty={<EmptyState icon={HeartPulse} title={t('medical.empty')} body={t('medical.emptyBody', { name })} />}
      >
        {(m) => (
          <div className="flex flex-col gap-3.5">
            <div
              className={cn(
                'rounded-input text-secondary flex items-start gap-2.5 border p-3.5',
                toneClasses.blue.bg,
                toneClasses.blue.bd,
              )}
            >
              <Info aria-hidden size={19} className={cn('mt-px shrink-0', toneClasses.blue.fg)} />
              <span className="text-text min-w-0 flex-1 wrap-break-word">{t('medical.intro')}</span>
            </div>
            {visible(m).map((c) => (
              <CategoryCard key={c.code} category={c} />
            ))}
          </div>
        )}
      </QueryBoundary>
    </PullToRefresh>
  )
}

function CategoryCard({ category: c }: { category: Category }) {
  const { t } = useTranslation('resident')
  const meta = MEDICAL_CATEGORY[c.code]
  return (
    <section className="rounded-card border-border bg-surface shadow-card [&>*:not(:last-child)]:border-border overflow-hidden border [&>*:not(:last-child)]:border-b">
      <div className="flex items-center gap-2.5 px-3.5 py-3">
        <IconTile icon={meta.icon} tone={meta.tone} size={36} />
        <h2 className="text-body m-0 min-w-0 flex-1 font-extrabold wrap-break-word">
          {t(`medical.category.${c.code}`)}
        </h2>
        <CategoryCount category={c} />
      </div>
      {c.items.map((i) => (
        <div key={i.id} className="flex flex-col gap-[3px] px-3.5 py-3">
          <div className="flex items-center gap-2">
            <span className="text-body-sm min-w-0 flex-1 font-extrabold wrap-break-word">{i.name}</span>
            {i.flag === 'allergy' && (
              <StatusChip tone="red" icon={TriangleAlert} label={t('medical.allergy')} size="sm" />
            )}
          </div>
          <span className="text-secondary text-text-2 wrap-break-word">{i.detail}</span>
          <span className="text-tag text-label flex items-center gap-[5px]">
            <Building2 aria-hidden size={13} className="shrink-0" />
            <span className="min-w-0">
              <Trans t={t} i18nKey="medical.sharedOn" values={{ date: date(i.sharedAt) }} components={{ ltr: <Ltr /> }} />
            </span>
          </span>
        </div>
      ))}
    </section>
  )
}

/** Medications: "3 active"; doctor visits: date of the latest; nutrition / physiotherapy: nothing. */
function CategoryCount({ category: c }: { category: Category }) {
  const { t } = useTranslation('resident')
  let content: React.ReactNode
  if (c.code === 'medications') content = t('medical.active', { count: c.items.length })
  else if (c.code === 'doctor_visits') {
    const last = c.items.map((i) => i.sharedAt).sort().at(-1)!
    content = <Trans t={t} i18nKey="medical.last" values={{ date: date(last) }} components={{ ltr: <Ltr /> }} />
  } else if (c.code === 'nutrition' || c.code === 'physiotherapy') return null
  else content = <Ltr>{c.items.length}</Ltr>
  return <span className="text-meta text-text-2 shrink-0 font-bold">{content}</span>
}
