import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import {
  BedDouble,
  Building,
  Cake,
  CalendarPlus,
  ContactRound,
  IdCard,
  Languages,
  MessageSquarePlus,
  Phone,
  UserRoundCheck,
  type LucideIcon,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { residentQuery } from '@/api/queries/residents'
import type { Resident } from '@/api/schemas/resident'
import { PullToRefresh, refetchAll } from '@/components/app/PullToRefresh'
import { Avatar } from '@/components/common/Avatar'
import { Card } from '@/components/common/Card'
import { IconTile } from '@/components/common/IconTile'
import { ListGroup } from '@/components/common/ListRow'
import { Ltr } from '@/components/common/Ltr'
import { SectionHeader } from '@/components/common/SectionHeader'
import { QueryBoundary } from '@/components/states/QueryBoundary'
import { Button } from '@/components/ui/button'
import { ListSkeleton, Skeleton } from '@/components/ui/skeleton'
import { age, date, dayInstant, formatPhone } from '@/lib/format'
import { ROLE_META } from '@/lib/staff'
import { SectionGate, permissionStates } from '../components/SectionGate'

export function GeneralScreen({ rid }: { rid: string }) {
  return (
    <SectionGate rid={rid} permission="general">
      <GeneralQuery rid={rid} />
    </SectionGate>
  )
}

function GeneralQuery({ rid }: { rid: string }) {
  const query = useQuery(residentQuery(rid))
  return (
    <PullToRefresh onRefresh={() => refetchAll(query.refetch)}>
      <QueryBoundary query={query} skeleton={<GeneralSkeleton />} permission={permissionStates(rid, 'general')}>
        {(r) => <General resident={r} rid={rid} />}
      </QueryBoundary>
    </PullToRefresh>
  )
}

function General({ resident: r, rid }: { resident: Resident; rid: string }) {
  const { t } = useTranslation('resident')
  return (
    <div className="flex flex-col gap-5">
      <Card className="flex flex-col items-center gap-2 px-4 py-5 text-center">
        {r.photoUrl ? (
          <img src={r.photoUrl} alt={t('general.photoLabel', { name: r.name })} className="size-24 rounded-full object-cover" />
        ) : (
          <div aria-hidden className="stripes size-24 rounded-full" />
        )}
        <h1 className="text-title-md m-0 font-extrabold wrap-break-word">{r.name}</h1>
        <div className="flex flex-wrap justify-center gap-1.5">
          <NeutralChip icon={Building}>{r.ward}</NeutralChip>
          <NeutralChip icon={BedDouble}>{r.room}</NeutralChip>
        </div>
      </Card>

      <section className="flex flex-col gap-2.5">
        <SectionHeader icon={IdCard}>{t('general.details')}</SectionHeader>
        <ListGroup>
          <DetailRow icon={Cake} label={t('general.dob')}>
            <Trans
              t={t}
              i18nKey="general.dobValue"
              values={{ date: date(dayInstant(r.dateOfBirth)), age: age(r.dateOfBirth) }}
              components={{ ltr: <Ltr /> }}
            />
          </DetailRow>
          <DetailRow icon={Building} label={t('general.ward')}>
            {r.ward}
          </DetailRow>
          <DetailRow icon={BedDouble} label={t('general.room')}>
            {r.room}
          </DetailRow>
          <DetailRow icon={CalendarPlus} label={t('general.admitted')}>
            <Ltr>{date(dayInstant(r.admittedOn))}</Ltr>
          </DetailRow>
          <DetailRow icon={Languages} label={t('general.languages')}>
            {r.languages.join(', ')}
          </DetailRow>
          <DetailRow icon={UserRoundCheck} label={t('general.primaryContact')}>
            {r.primaryFamilyContact.isYou
              ? t('general.you', { name: r.primaryFamilyContact.name })
              : r.primaryFamilyContact.name}
          </DetailRow>
        </ListGroup>
      </section>

      <section className="flex flex-col gap-2.5">
        <SectionHeader icon={ContactRound}>{t('general.staffContacts')}</SectionHeader>
        {r.staffContacts.map((s) => {
          const role = ROLE_META[s.roleCode]
          const RoleIcon = role.icon
          return (
            <Card key={s.id} className="flex items-center gap-3 rounded-[16px] shadow-none">
              <Avatar initials={s.initials} photoUrl={s.photoUrl} tone={role.tone} size={44} />
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="text-body-sm font-extrabold wrap-break-word">{s.name}</span>
                <span className="text-meta text-text-2 flex items-center gap-[5px]">
                  <RoleIcon aria-hidden size={14} className="shrink-0" />
                  <span className="min-w-0 wrap-break-word">{s.role}</span>
                </span>
              </div>
              <Link
                to="/r/$rid/staff/new"
                params={{ rid }}
                search={{ dept: s.department }}
                aria-label={t('general.inquiryLabel', { name: s.name })}
                className="border-border bg-surface-2 flex min-h-[50px] min-w-16 shrink-0 flex-col items-center justify-center gap-0.5 rounded-[12px] border px-1"
              >
                <MessageSquarePlus aria-hidden size={18} />
                <span className="text-micro font-extrabold">{t('general.inquiry')}</span>
              </Link>
            </Card>
          )
        })}
        <Card className="flex items-center gap-3 rounded-[16px] shadow-none">
          <IconTile icon={Phone} tone="green" size={44} />
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="text-body-sm font-extrabold wrap-break-word">{r.wardPhone.label}</span>
            <Ltr className="text-secondary text-text-2 text-start">{formatPhone(r.wardPhone.phone)}</Ltr>
          </div>
          <Button asChild size="compact" className="px-3.5">
            <a href={`tel:${r.wardPhone.phone}`} aria-label={t('general.callLabel', { label: r.wardPhone.label })}>
              <Phone aria-hidden size={16} />
              {t('general.call')}
            </a>
          </Button>
        </Card>
      </section>
    </div>
  )
}

function NeutralChip({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return (
    <span className="rounded-pill bg-surface-2 text-meta inline-flex items-center gap-[5px] px-2.5 py-1 font-bold">
      <Icon aria-hidden size={14} className="shrink-0" />
      {children}
    </span>
  )
}

function DetailRow({ icon: Icon, label, children }: { icon: LucideIcon; label: string; children: ReactNode }) {
  return (
    <div className="flex min-h-11 items-center gap-3 px-3.5 py-3">
      <Icon aria-hidden size={19} className="text-text-2 shrink-0" />
      <span className="text-secondary text-text-2 min-w-0 flex-1 wrap-break-word">{label}</span>
      <span className="text-body-sm max-w-[60%] text-end font-bold wrap-break-word">{children}</span>
    </div>
  )
}

function GeneralSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-card border-border bg-surface flex flex-col items-center gap-3 border px-4 py-5">
        <Skeleton className="size-24 rounded-full" />
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="h-4 w-1/3 opacity-70" />
      </div>
      <ListSkeleton rows={4} />
    </div>
  )
}
