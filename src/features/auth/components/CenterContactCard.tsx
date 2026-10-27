import { Building2, Clock, Mail, MapPin, Phone, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { CenterPublic } from '@/api/schemas/center'
import { Ltr } from '@/components/common/Ltr'
import { Skeleton } from '@/components/ui/skeleton'
import { formatOfficeHours } from '@/lib/center'
import { formatPhone } from '@/lib/format'

function Row({ icon: Icon, label, children }: { icon: LucideIcon; label: string; children: ReactNode }) {
  return (
    <div className="flex min-h-11 items-center gap-3 px-3.5 py-3">
      <Icon aria-hidden size={20} className="text-text-2 shrink-0" />
      <div className="flex min-w-0 flex-col">
        <span className="text-tag text-text-2 font-bold">{label}</span>
        <span className="text-body-sm font-bold wrap-break-word">{children}</span>
      </div>
    </div>
  )
}

export function CenterContactCard({ center }: { center?: CenterPublic }) {
  const { t } = useTranslation('center')
  if (!center) return <Skeleton className="rounded-btn h-64" />
  return (
    <div className="rounded-btn border-border bg-surface flex flex-col border">
      <div className="border-border flex items-center gap-3 border-b p-3.5">
        <div className="bg-navy rounded-tile flex size-11 shrink-0 items-center justify-center text-white">
          <Building2 aria-hidden size={22} />
        </div>
        <div className="flex min-w-0 flex-col">
          <span className="font-extrabold wrap-break-word">{center.name}</span>
          <span className="text-meta text-text-2">{center.familyOfficeName}</span>
        </div>
      </div>
      <Row icon={Phone} label={t('phone')}>
        <Ltr>{formatPhone(center.phone)}</Ltr>
      </Row>
      <Row icon={Mail} label={t('email')}>
        <Ltr className="break-all">{center.email}</Ltr>
      </Row>
      <Row icon={MapPin} label={t('address')}>
        {center.address}
      </Row>
      <Row icon={Clock} label={t('officeHours')}>
        {formatOfficeHours(center.officeHours, t)}
      </Row>
    </div>
  )
}
