import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** Isolates LTR content (phones, dates, IDs, file names, emails, "CARETEX") inside RTL text. */
export function Ltr({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <bdi dir="ltr" className={cn('unicode-bidi-isolate', className)}>
      {children}
    </bdi>
  )
}
