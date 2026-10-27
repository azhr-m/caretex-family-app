import {
  BriefcaseMedical,
  Building2,
  CircleHelp,
  Footprints,
  HandHeart,
  Palette,
  Salad,
  Stethoscope,
  Wallet,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import type { DepartmentCode } from '@/api/schemas/common'
import type { Tone } from './status'

/** Design `D` map: tile icon and tone per department. Labels are localized from the code. */
export const DEPARTMENT_META: Record<DepartmentCode, { icon: LucideIcon; tone: Tone }> = {
  nursing: { icon: Stethoscope, tone: 'teal' },
  doctor: { icon: BriefcaseMedical, tone: 'blue' },
  social_work: { icon: HandHeart, tone: 'violet' },
  physiotherapy: { icon: Footprints, tone: 'pink' },
  nutrition: { icon: Salad, tone: 'green' },
  activities: { icon: Palette, tone: 'amber' },
  management: { icon: Building2, tone: 'slate' },
  finance: { icon: Wallet, tone: 'blue' },
  maintenance: { icon: Wrench, tone: 'amber' },
  other: { icon: CircleHelp, tone: 'slate' },
}
