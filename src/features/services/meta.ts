import {
  Archive,
  CircleCheck,
  CircleHelp,
  CircleX,
  Loader,
  MessageCircle,
  MessageSquare,
  Package,
  Scissors,
  Shirt,
  Sparkles,
  UserCheck,
  Wallet,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import type { ServiceStatus, ServiceTypeCode } from '@/api/schemas/account'
import type { Tone } from '@/lib/status'

export const TYPE_META: Record<ServiceTypeCode, { icon: LucideIcon; tone: Tone }> = {
  maintenance: { icon: Wrench, tone: 'amber' },
  laundry: { icon: Shirt, tone: 'violet' },
  hairdresser: { icon: Scissors, tone: 'pink' },
  equipment: { icon: Package, tone: 'blue' },
  conversation: { icon: MessageCircle, tone: 'teal' },
  finance: { icon: Wallet, tone: 'green' },
  other: { icon: CircleHelp, tone: 'slate' },
}

export const STATUS_META: Record<ServiceStatus | 'comment', { icon: LucideIcon; tone: Tone }> = {
  opened: { icon: Sparkles, tone: 'blue' },
  assigned: { icon: UserCheck, tone: 'violet' },
  in_progress: { icon: Loader, tone: 'amber' },
  handled: { icon: CircleCheck, tone: 'green' },
  closed: { icon: Archive, tone: 'slate' },
  cancelled: { icon: CircleX, tone: 'slate' },
  comment: { icon: MessageSquare, tone: 'slate' },
}

/** Stepper: Opened → Assigned → In progress → Handled → Closed. */
export const SERVICE_STEPS: ServiceStatus[] = ['opened', 'assigned', 'in_progress', 'handled', 'closed']

export const serviceStepIndex = (s: ServiceStatus) => (s === 'closed' ? SERVICE_STEPS.length : SERVICE_STEPS.indexOf(s))
