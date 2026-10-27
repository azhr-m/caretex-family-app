import type { InquiryStatus } from '@/api/schemas/inquiries'
import type { Status } from './status'

/** Inquiry status → shared chip status (tone, icon, label). */
export const INQUIRY_CHIP: Record<InquiryStatus, Status> = {
  new: 'new',
  read: 'read',
  in_progress: 'in_progress',
  waiting_for_family: 'waiting_for_you',
  handled: 'handled',
  closed: 'closed',
}

/** Stepper order: New → Read → In progress → Waiting for you → Handled → Closed. */
export const INQUIRY_STEPS: InquiryStatus[] = ['new', 'read', 'in_progress', 'waiting_for_family', 'handled', 'closed']

/** Index of the active step; closed marks every step done. */
export const stepIndex = (s: InquiryStatus) => (s === 'closed' ? INQUIRY_STEPS.length : INQUIRY_STEPS.indexOf(s))
