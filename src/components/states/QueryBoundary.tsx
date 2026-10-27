import type { FetchStatus } from '@tanstack/react-query'
import { useEffect, useState, type ReactNode } from 'react'
import { isApiError } from '@/api/errors'
import { ErrorState, PermissionState, SlowNotice } from './states'

const SKELETON_DELAY_MS = 300
const SLOW_AFTER_MS = 8000

/** True once `active` has been continuously true for `ms`. */
export function useElapsed(active: boolean, ms: number) {
  const [elapsed, setElapsed] = useState(false)
  useEffect(() => {
    if (!active) return
    const id = setTimeout(() => setElapsed(true), ms)
    return () => {
      clearTimeout(id)
      setElapsed(false)
    }
  }, [active, ms])
  return active && elapsed
}

/** The parts of a query (regular or infinite) the boundary reads. */
export type BoundaryQuery<T> = {
  data: T | undefined
  error: unknown
  isPending: boolean
  isError: boolean
  isRefetching: boolean
  fetchStatus: FetchStatus
  refetch: () => Promise<unknown>
}

type Props<T> = {
  query: BoundaryQuery<T>
  skeleton: ReactNode
  children: (data: T) => ReactNode
  isEmpty?: (data: T) => boolean
  empty?: ReactNode
  /** For resident-scoped `{ state: "not_shared" }` responses. */
  isNotShared?: (data: T) => boolean
  permission?: { denied?: ReactNode; notShared?: ReactNode }
  onRetry?: () => void
  contactPhone?: string
}

/**
 * Renders the right state for a query: delayed skeleton → slow notice, offline, error + retry,
 * permission denied / not shared, empty, or the data (with a thin progress line while refetching).
 */
export function QueryBoundary<T>({
  query,
  skeleton,
  children,
  isEmpty,
  empty,
  isNotShared,
  permission,
  onRetry,
  contactPhone,
}: Props<T>) {
  const retry = onRetry ?? (() => void query.refetch())
  const loading = query.isPending && query.fetchStatus === 'fetching'
  const showSkeleton = useElapsed(loading, SKELETON_DELAY_MS)
  const slow = useElapsed(loading, SLOW_AFTER_MS)

  if (query.data !== undefined) {
    const data = query.data
    if (isNotShared?.(data)) return permission?.notShared ?? <PermissionState kind="notShared" />
    return (
      <>
        {query.isRefetching && <RefetchLine />}
        {isEmpty?.(data) ? empty : children(data)}
      </>
    )
  }

  if (query.isError) {
    const err = query.error
    if (isApiError(err)) {
      if (err.code === 'PERMISSION_DENIED') return permission?.denied ?? <PermissionState kind="denied" />
      if (err.code === 'NOT_FOUND') return <ErrorState variant="notFound" />
      if (err.code === 'NETWORK') return <ErrorState variant="offline" onRetry={retry} />
    }
    return (
      <ErrorState
        onRetry={retry}
        requestId={isApiError(err) ? err.requestId : undefined}
        contactPhone={contactPhone}
      />
    )
  }

  if (query.isPending && query.fetchStatus === 'paused')
    return <ErrorState variant="offline" onRetry={retry} />

  return (
    <div aria-busy="true">
      {showSkeleton && skeleton}
      {slow && <SlowNotice onRetry={retry} />}
    </div>
  )
}

function RefetchLine() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-40 mx-auto h-0.5 max-w-[480px] overflow-hidden"
    >
      <div className="shimmer h-full w-full opacity-80 [--skeleton-2:var(--link)]" />
    </div>
  )
}
