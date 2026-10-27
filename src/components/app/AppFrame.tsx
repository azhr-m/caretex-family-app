import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** Centered mobile column (max 480) on the app background. */
export function AppFrame({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('bg-bg mx-auto flex min-h-dvh w-full max-w-[480px] flex-col', className)}>
      {children}
    </div>
  )
}

/** Scrollable content area with standard screen padding. */
export function ScreenContent({ children, className }: { children: ReactNode; className?: string }) {
  return <main className={cn('min-w-0 flex-1 px-4 pt-4 pb-7', className)}>{children}</main>
}
