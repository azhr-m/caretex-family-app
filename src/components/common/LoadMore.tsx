import { LoaderCircle } from 'lucide-react'
import { useEffect, useRef } from 'react'

/** Infinite scroll: loads the next page when this sentinel scrolls into view. */
export function LoadMore({
  hasNext,
  loading,
  onLoad,
  loadingLabel,
  endLabel,
}: {
  hasNext: boolean
  loading: boolean
  onLoad: () => void
  loadingLabel: string
  endLabel?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const onLoadRef = useRef(onLoad)
  useEffect(() => {
    onLoadRef.current = onLoad
  })
  useEffect(() => {
    const el = ref.current
    if (!el || !hasNext) return
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) onLoadRef.current()
    })
    io.observe(el)
    return () => io.disconnect()
  }, [hasNext, loading])

  if (!hasNext) {
    return endLabel ? <p className="text-meta text-text-2 m-0 py-2 text-center">{endLabel}</p> : null
  }
  return (
    <div ref={ref} className="text-meta text-text-2 flex min-h-11 items-center justify-center gap-2 py-2" role="status">
      {loading && (
        <>
          <LoaderCircle aria-hidden size={16} className="animate-spin" />
          {loadingLabel}
        </>
      )}
    </div>
  )
}
