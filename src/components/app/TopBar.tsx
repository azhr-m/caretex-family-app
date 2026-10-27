import { useCanGoBack, useRouter } from '@tanstack/react-router'
import { ArrowLeft, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { DirIcon } from '@/components/common/DirIcon'
import { OfflineBanner } from './OfflineBanner'

/**
 * Back + title bar for routes without the tab bar. Back uses history when there is any,
 * otherwise `onBack` / `fallbackHref`.
 */
export function TopBar({
  title,
  backLabel,
  backIcon = ArrowLeft,
  onBack,
  fallbackHref,
  end,
}: {
  title: ReactNode
  backLabel: string
  backIcon?: LucideIcon
  onBack?: () => void
  fallbackHref?: string
  end?: ReactNode
}) {
  const router = useRouter()
  const canGoBack = useCanGoBack()
  const back = () => {
    if (onBack) return onBack()
    if (canGoBack) return router.history.back()
    if (fallbackHref) void router.navigate({ to: fallbackHref })
  }
  return (
    <div className="bg-bg sticky top-0 z-20">
      <div className="border-border flex items-center gap-1 border-b px-3 pt-1 pb-2.5">
        <button
          type="button"
          onClick={back}
          className="text-body-sm text-link flex min-h-11 min-w-[92px] shrink-0 items-center gap-1 font-bold"
        >
          <DirIcon icon={backIcon} size={20} />
          <span className="truncate">{backLabel}</span>
        </button>
        <h1 className="text-button-lg m-0 min-w-0 flex-1 truncate text-center font-extrabold">{title}</h1>
        <div className="flex min-w-[92px] shrink-0 justify-end">{end}</div>
      </div>
      <OfflineBanner />
    </div>
  )
}
