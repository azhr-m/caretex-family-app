import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

export type DetailRow = { icon: LucideIcon; label: string; value: ReactNode }

/** DetailsList: card of rows, icon · label (12/700 text-2) over value (15/700). */
export function DetailRows({ rows }: { rows: DetailRow[] }) {
  return (
    <dl className="rounded-card border-border bg-surface m-0 flex flex-col border">
      {rows.map((r) => (
        <div key={r.label} className="border-border flex items-start gap-3 border-b px-3.5 py-3 last:border-b-0">
          <r.icon aria-hidden size={20} className="text-text-2 mt-0.5 shrink-0" />
          <div className="flex min-w-0 flex-1 flex-col">
            <dt className="text-tag text-text-2 font-bold">{r.label}</dt>
            <dd className="text-body-sm m-0 font-bold wrap-break-word">{r.value}</dd>
          </div>
        </div>
      ))}
    </dl>
  )
}
