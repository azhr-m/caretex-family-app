import { cn } from '@/lib/utils'

export function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <div aria-hidden className={cn('shimmer rounded-sm', className)} style={style} />
}

/** Generic list skeleton: card rows with tile + two lines. */
export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-2.5">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="rounded-card border-border bg-surface flex items-center gap-3 border p-3.5">
          <Skeleton className="rounded-tile size-[42px] shrink-0" />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Skeleton className="h-3.5 w-3/4" />
            <Skeleton className="h-3 w-1/2 opacity-70" />
          </div>
        </div>
      ))}
    </div>
  )
}
