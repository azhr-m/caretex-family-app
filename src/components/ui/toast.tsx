import { Check, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Toaster as Sonner, toast as sonner } from 'sonner'
import { dirOf } from '@/lib/i18n'
import { cn } from '@/lib/utils'

type ToastInput = { title: string; body?: string; action?: { label: string; onClick: () => void } }

function ToastView({
  id,
  kind,
  title,
  body,
  action,
}: ToastInput & { id: string | number; kind: 'success' | 'error' }) {
  return (
    <div className="rounded-btn bg-toast-bg text-toast-fg shadow-toast flex w-[min(448px,calc(100vw-32px))] items-center gap-3 px-4 py-3.5">
      <span
        aria-hidden
        className={cn(
          'flex size-[34px] shrink-0 items-center justify-center rounded-full text-white',
          kind === 'success' ? 'bg-green-fg dark:text-bg' : 'bg-red-fg dark:text-bg',
        )}
      >
        {kind === 'success' ? <Check size={18} strokeWidth={3} /> : <X size={18} strokeWidth={3} />}
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="text-body-sm font-extrabold wrap-break-word">{title}</span>
        {body && <span className="text-meta wrap-break-word opacity-80">{body}</span>}
      </div>
      {action && (
        <button
          type="button"
          onClick={() => {
            action.onClick()
            sonner.dismiss(id)
          }}
          className="rounded-tile text-secondary min-h-11 shrink-0 px-3 font-extrabold underline underline-offset-2"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}

export const toast = {
  success: (input: ToastInput) =>
    sonner.custom((id) => <ToastView id={id} kind="success" {...input} />, { duration: 4000 }),
  error: (input: ToastInput) =>
    sonner.custom((id) => <ToastView id={id} kind="error" {...input} />, { duration: 6000 }),
}

/** Bottom-centered, offset above the tab bar / action bar via --toast-offset. */
export function Toaster() {
  const { i18n } = useTranslation()
  return (
    <Sonner
      position="bottom-center"
      dir={dirOf(i18n.language)}
      offset={{ bottom: 'var(--toast-offset, 104px)' }}
      mobileOffset={{ bottom: 'var(--toast-offset, 104px)' }}
      toastOptions={{ unstyled: true }}
      containerAriaLabel="Notifications"
    />
  )
}
