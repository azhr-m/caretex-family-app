import {
  Briefcase,
  Footprints,
  HandHeart,
  HeartPulse,
  Palette,
  Salad,
  Shirt,
  Stethoscope,
  UserRound,
  Wallet,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import type { StaffRole } from '@/api/schemas/common'
import type { Tone } from './status'

/** Role icon and avatar tone. The API has no color field; tones follow the design (nurses teal, etc.). */
export const ROLE_META: Record<StaffRole, { icon: LucideIcon; tone: Tone }> = {
  nurse: { icon: Stethoscope, tone: 'teal' },
  head_nurse: { icon: Stethoscope, tone: 'teal' },
  physician: { icon: HeartPulse, tone: 'blue' },
  social_worker: { icon: HandHeart, tone: 'violet' },
  physiotherapist: { icon: Footprints, tone: 'blue' },
  dietitian: { icon: Salad, tone: 'green' },
  activities: { icon: Palette, tone: 'pink' },
  management: { icon: Briefcase, tone: 'slate' },
  finance: { icon: Wallet, tone: 'slate' },
  maintenance: { icon: Wrench, tone: 'amber' },
  laundry: { icon: Shirt, tone: 'amber' },
  reception: { icon: UserRound, tone: 'slate' },
  other: { icon: UserRound, tone: 'slate' },
}
