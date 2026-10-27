import {
  CalendarDays,
  Music,
  PartyPopper,
  Scissors,
  Stethoscope,
  Footprints,
  Syringe,
  Video,
  type LucideIcon,
} from 'lucide-react'
import type { CalendarItemSummary } from '@/api/schemas/calendar'
import type { DepartmentCode } from '@/api/schemas/common'
import type { Tone } from '@/lib/status'

export const CATEGORY_ICON: Record<CalendarItemSummary['category'], LucideIcon> = {
  doctor: Stethoscope,
  therapy: Footprints,
  hair: Scissors,
  vaccine: Syringe,
  call: Video,
  activity: Music,
  event: PartyPopper,
  other: CalendarDays,
}

/** Personal items are blue with a dot; center events are pink with a diamond. */
export const kindTone = (kind: CalendarItemSummary['kind']): Extract<Tone, 'blue' | 'pink'> =>
  kind === 'personal' ? 'blue' : 'pink'

/** Department for "Ask a question" about an appointment. */
export const CATEGORY_DEPARTMENT: Record<CalendarItemSummary['category'], DepartmentCode> = {
  doctor: 'doctor',
  vaccine: 'nursing',
  therapy: 'physiotherapy',
  hair: 'management',
  call: 'social_work',
  activity: 'activities',
  event: 'activities',
  other: 'other',
}
