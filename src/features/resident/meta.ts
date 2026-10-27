import {
  Activity,
  Bed,
  CircleCheck,
  CirclePlay,
  CircleX,
  ClipboardPlus,
  Clock,
  Coffee,
  Footprints,
  HeartHandshake,
  HeartPulse,
  Music,
  Pill,
  Salad,
  Scale,
  ShieldAlert,
  Smile,
  Stethoscope,
  Sun,
  Sunrise,
  Tag,
  Target,
  TestTube,
  TrendingUp,
  TriangleAlert,
  Users,
  Utensils,
  type LucideIcon,
} from 'lucide-react'
import type { GoalStatus, MedicalCategoryCode, ScheduleItem, UpdateCategory } from '@/api/schemas/resident'
import type { Tone } from '@/lib/status'

type Meta = { icon: LucideIcon; tone: Tone }

export const SCHEDULE_KIND: Record<ScheduleItem['kind'], Meta> = {
  care: { icon: Sunrise, tone: 'slate' },
  meal: { icon: Utensils, tone: 'amber' },
  activity: { icon: Music, tone: 'teal' },
  therapy: { icon: Footprints, tone: 'blue' },
  rest: { icon: Bed, tone: 'slate' },
  social: { icon: Coffee, tone: 'pink' },
  medical: { icon: Stethoscope, tone: 'red' },
  other: { icon: Clock, tone: 'slate' },
}

export const SCHEDULE_STATUS: Record<ScheduleItem['status'], Meta> = {
  done: { icon: CircleCheck, tone: 'green' },
  now: { icon: CirclePlay, tone: 'amber' },
  upcoming: { icon: Clock, tone: 'slate' },
  cancelled: { icon: CircleX, tone: 'slate' },
}

export const UPDATE_CATEGORY: Record<UpdateCategory, Meta> = {
  activities: { icon: Music, tone: 'teal' },
  health: { icon: HeartPulse, tone: 'blue' },
  social: { icon: Users, tone: 'violet' },
  daily_life: { icon: Sun, tone: 'amber' },
  other: { icon: Tag, tone: 'slate' },
}

/** Display order and look of the medical categories (design `resMedical`). */
export const MEDICAL_CATEGORY: Record<MedicalCategoryCode, Meta> = {
  medications: { icon: Pill, tone: 'blue' },
  diagnoses: { icon: ClipboardPlus, tone: 'violet' },
  allergies: { icon: ShieldAlert, tone: 'red' },
  doctor_visits: { icon: Stethoscope, tone: 'teal' },
  tests: { icon: TestTube, tone: 'amber' },
  nutrition: { icon: Salad, tone: 'green' },
  physiotherapy: { icon: Footprints, tone: 'pink' },
}

export const GOAL_STATUS: Record<GoalStatus, Meta> = {
  on_track: { icon: TrendingUp, tone: 'amber' },
  achieved: { icon: CircleCheck, tone: 'green' },
  monitoring: { icon: Activity, tone: 'amber' },
  needs_attention: { icon: TriangleAlert, tone: 'red' },
}

/** The API sends a Lucide name hint per goal; unknown names fall back to a target. */
const GOAL_ICONS: Record<string, LucideIcon> = {
  footprints: Footprints,
  users: Users,
  scale: Scale,
  'heart-pulse': HeartPulse,
  'heart-handshake': HeartHandshake,
  smile: Smile,
  utensils: Utensils,
  bed: Bed,
  activity: Activity,
}

export const goalIcon = (name: string) => GOAL_ICONS[name] ?? Target

/** Goal tiles have no color in the API; they cycle through the design's tile tones. */
const GOAL_TONES: Tone[] = ['blue', 'teal', 'amber', 'violet', 'pink', 'green']
export const goalTone = (index: number) => GOAL_TONES[index % GOAL_TONES.length]!
