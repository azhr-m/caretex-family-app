import { ArrowDown, LoaderCircle } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'

const TRIGGER = 64
const MAX = 96
const HOLD = 48

/**
 * Touch pull-to-refresh on the nearest `[data-scroll-root]` (the tab shell's main area).
 * Only starts when that area is scrolled to the top; failures show an error toast, success is silent.
 */
export function PullToRefresh({ onRefresh, children }: { onRefresh: () => Promise<unknown>; children: ReactNode }) {
  const { t } = useTranslation()
  const ref = useRef<HTMLDivElement>(null)
  const [pull, setPull] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const refreshRef = useRef(onRefresh)
  useEffect(() => {
    refreshRef.current = onRefresh
  })

  useEffect(() => {
    const root = ref.current?.closest<HTMLElement>('[data-scroll-root]')
    if (!root) return
    let startY: number | null = null
    let distance = 0
    let busy = false

    const onStart = (e: TouchEvent) => {
      startY = !busy && root.scrollTop <= 0 && e.touches.length === 1 ? e.touches[0]!.clientY : null
    }
    const onMove = (e: TouchEvent) => {
      if (startY === null) return
      const dy = e.touches[0]!.clientY - startY
      if (dy <= 0) {
        distance = 0
        setPull(0)
        return
      }
      if (e.cancelable) e.preventDefault()
      distance = Math.min(MAX, dy * 0.5)
      setPull(distance)
    }
    const onEnd = () => {
      if (startY === null) return
      startY = null
      if (distance < TRIGGER) {
        distance = 0
        setPull(0)
        return
      }
      busy = true
      distance = 0
      setPull(HOLD)
      setRefreshing(true)
      refreshRef
        .current()
        .catch(() => toast.error({ title: t('refresh.failed') }))
        .finally(() => {
          busy = false
          setRefreshing(false)
          setPull(0)
        })
    }

    root.addEventListener('touchstart', onStart, { passive: true })
    root.addEventListener('touchmove', onMove, { passive: false })
    root.addEventListener('touchend', onEnd)
    root.addEventListener('touchcancel', onEnd)
    return () => {
      root.removeEventListener('touchstart', onStart)
      root.removeEventListener('touchmove', onMove)
      root.removeEventListener('touchend', onEnd)
      root.removeEventListener('touchcancel', onEnd)
    }
  }, [t])

  const ready = pull >= TRIGGER
  const label = refreshing ? t('refresh.refreshing') : ready ? t('refresh.release') : t('refresh.pull')
  return (
    <div ref={ref}>
      <div
        aria-hidden={pull === 0}
        className={cn(
          'flex items-end justify-center overflow-hidden',
          pull === 0 || refreshing ? 'transition-[height] duration-200' : '',
        )}
        style={{ height: pull }}
      >
        <div className="text-text-2 text-meta flex items-center gap-2 pb-2 font-bold">
          <span className="bg-surface border-border shadow-card flex size-8 items-center justify-center rounded-full border">
            {refreshing ? (
              <LoaderCircle aria-hidden size={18} className="animate-spin" />
            ) : (
              <ArrowDown
                aria-hidden
                size={18}
                className={cn('transition-transform', ready && 'rotate-180')}
              />
            )}
          </span>
          <span role="status">{pull > 0 ? label : ''}</span>
        </div>
      </div>
      {children}
    </div>
  )
}

/** Refetches several queries; rejects if any of them ends in an error (for the error toast). */
export async function refetchAll(...refetches: (() => Promise<{ isError: boolean }>)[]) {
  const results = await Promise.all(refetches.map((r) => r()))
  if (results.some((r) => r.isError)) throw new Error('refresh failed')
}
