import {
  Archive,
  Ban,
  CircleAlert,
  CircleCheck,
  CircleDashed,
  Clock,
  ClockAlert,
  Eye,
  Hourglass,
  Loader,
  Lock,
  PenLine,
  Reply,
  Save,
  Sparkles,
  UserCheck,
  type LucideIcon,
} from 'lucide-react'

export type Tone = 'blue' | 'amber' | 'violet' | 'green' | 'red' | 'slate' | 'teal' | 'pink'

export const TONES: Tone[] = ['blue', 'amber', 'violet', 'green', 'red', 'slate', 'teal', 'pink']

/** Literal class strings so Tailwind can see them. */
export const toneClasses: Record<Tone, { fg: string; bg: string; bd: string; solid: string }> = {
  blue: { fg: 'text-blue-fg', bg: 'bg-blue-bg', bd: 'border-blue-bd', solid: 'bg-blue-fg' },
  amber: { fg: 'text-amber-fg', bg: 'bg-amber-bg', bd: 'border-amber-bd', solid: 'bg-amber-fg' },
  violet: { fg: 'text-violet-fg', bg: 'bg-violet-bg', bd: 'border-violet-bd', solid: 'bg-violet-fg' },
  green: { fg: 'text-green-fg', bg: 'bg-green-bg', bd: 'border-green-bd', solid: 'bg-green-fg' },
  red: { fg: 'text-red-fg', bg: 'bg-red-bg', bd: 'border-red-bd', solid: 'bg-red-fg' },
  slate: { fg: 'text-slate-fg', bg: 'bg-slate-bg', bd: 'border-slate-bd', solid: 'bg-slate-fg' },
  teal: { fg: 'text-teal-fg', bg: 'bg-teal-bg', bd: 'border-teal-bd', solid: 'bg-teal-fg' },
  pink: { fg: 'text-pink-fg', bg: 'bg-pink-bg', bd: 'border-pink-bd', solid: 'bg-pink-fg' },
}

export type Status =
  | 'new'
  | 'not_started'
  | 'in_progress'
  | 'needs_action'
  | 'waiting_for_you'
  | 'to_sign'
  | 'to_confirm'
  | 'to_approve'
  | 'completed'
  | 'handled'
  | 'signed'
  | 'confirmed'
  | 'achieved'
  | 'overdue'
  | 'blocked'
  | 'closed'
  | 'no_permission'
  | 'coming_soon'
  | 'not_shared'
  | 'awaiting_rsvp'
  | 'draft'
  | 'read'
  | 'assigned'
  | 'waiting_to_send'

export type StatusMeta = { tone: Tone; icon: LucideIcon; labelKey: `status.${Status}` }

const m = (tone: Tone, icon: LucideIcon, s: Status): StatusMeta => ({ tone, icon, labelKey: `status.${s}` })

export const STATUS: Record<Status, StatusMeta> = {
  new: m('blue', Sparkles, 'new'),
  not_started: m('blue', CircleDashed, 'not_started'),
  in_progress: m('amber', Loader, 'in_progress'),
  needs_action: m('violet', CircleAlert, 'needs_action'),
  waiting_for_you: m('violet', Reply, 'waiting_for_you'),
  to_sign: m('violet', PenLine, 'to_sign'),
  to_confirm: m('violet', Eye, 'to_confirm'),
  to_approve: m('violet', CircleCheck, 'to_approve'),
  completed: m('green', CircleCheck, 'completed'),
  handled: m('green', CircleCheck, 'handled'),
  signed: m('green', CircleCheck, 'signed'),
  confirmed: m('green', CircleCheck, 'confirmed'),
  achieved: m('green', CircleCheck, 'achieved'),
  overdue: m('red', ClockAlert, 'overdue'),
  blocked: m('slate', Ban, 'blocked'),
  closed: m('slate', Archive, 'closed'),
  no_permission: m('slate', Lock, 'no_permission'),
  coming_soon: m('slate', Clock, 'coming_soon'),
  not_shared: m('amber', Hourglass, 'not_shared'),
  awaiting_rsvp: m('amber', Hourglass, 'awaiting_rsvp'),
  draft: m('amber', Save, 'draft'),
  read: m('slate', Eye, 'read'),
  assigned: m('violet', UserCheck, 'assigned'),
  waiting_to_send: m('amber', Clock, 'waiting_to_send'),
}
