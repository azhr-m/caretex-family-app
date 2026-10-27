import { useEffect, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

const TOAST_OFFSET = '128px'

/** StickyActionBar: surface, top border, padding 12/16 + safe area. Lifts toasts above itself. */
export function ActionBar({ children, className }: { children: ReactNode; className?: string }) {
  useEffect(() => {
    document.documentElement.style.setProperty('--toast-offset', TOAST_OFFSET)
    return () => {
      document.documentElement.style.removeProperty('--toast-offset')
    }
  }, [])
  return (
    <div
      className={cn('bg-surface border-border sticky bottom-0 z-20 flex flex-col gap-2.5 border-t px-4 pt-3', className)}
      style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
    >
      {children}
    </div>
  )
}
