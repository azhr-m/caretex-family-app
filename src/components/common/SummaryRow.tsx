import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

/** Result-screen summary row (inside a ListGroup): icon · label · value at the end. */
export function SummaryRow({ icon: Icon, label, children }: { icon: LucideIcon; label: string; children: ReactNode }) {
  return (
    <div className="flex min-h-11 items-center gap-3 px-3.5 py-3">
      <Icon aria-hidden size={19} className="text-text-2 shrink-0" />
      <span className="text-secondary text-text-2 min-w-0 flex-1">{label}</span>
      <span className="text-body-sm max-w-[60%] text-end font-bold wrap-break-word">{children}</span>
    </div>
  )
}
