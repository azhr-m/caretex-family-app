import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

export type DetailRow = { icon: LucideIcon; label: string; value: ReactNode }

/** DetailsList: card of rows, icon · label (12/700 text-2) over value (15/700). */
export function DetailRows({ rows }: { rows: DetailRow[] }) {
  return (
    <dl className="rounded-card border-border bg-surface m-0 flex flex-col border">
      {rows.map((r) => (
        <div key={r.label} className="border-border relative flex flex-col border-b py-3 ps-[46px] pe-3.5 last:border-b-0">
          <dt className="text-tag text-text-2 font-bold">
            <r.icon aria-hidden size={20} className="text-text-2 absolute start-3.5 top-3.5" />
            {r.label}
          </dt>
          <dd className="text-body-sm m-0 font-bold wrap-break-word">{r.value}</dd>
        </div>
      ))}
    </dl>
  )
}
