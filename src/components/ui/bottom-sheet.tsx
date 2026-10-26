import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Drawer } from 'vaul'
import { dirOf } from '@/lib/i18n'
import { cn } from '@/lib/utils'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: ReactNode
  description?: ReactNode
  children: ReactNode
  /** False for session lock and while submitting. */
  dismissible?: boolean
  className?: string
}

export function BottomSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  dismissible = true,
  className,
}: Props) {
  const { i18n } = useTranslation()
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange} dismissible={dismissible} direction="bottom">
      <Drawer.Portal>
        <Drawer.Overlay className="bg-scrim fixed inset-0 z-50" />
        <Drawer.Content
          dir={dirOf(i18n.language)}
          className={cn(
            'rounded-t-sheet bg-bg fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[92dvh] w-full max-w-[480px] flex-col px-5 pt-2.5 outline-none',
            className,
          )}
          style={{ paddingBottom: 'calc(34px + env(safe-area-inset-bottom))' }}
        >
          <div aria-hidden className="bg-border mx-auto mb-4 h-[5px] w-11 shrink-0 rounded-[3px]" />
          <Drawer.Title className="text-title-sm m-0 font-extrabold text-pretty">{title}</Drawer.Title>
          {description ? (
            <Drawer.Description className="text-secondary text-text-2 mt-1.5">
              {description}
            </Drawer.Description>
          ) : (
            <Drawer.Description className="sr-only">{title}</Drawer.Description>
          )}
          <div className="mt-4 min-h-0 overflow-y-auto overscroll-contain">{children}</div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
