import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-card border-border bg-surface shadow-card border p-3.5', className)}
      {...props}
    />
  )
}

/** Hero block on navy with white text (resident card, care plan header, center header). */
export function NavyCard({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-card bg-navy p-4 text-white', className)} {...props} />
}

export function InfoBox({
  icon: Icon,
  children,
  className,
}: {
  icon?: React.ComponentType<{ size?: number; className?: string; 'aria-hidden'?: boolean }>
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'rounded-input bg-surface-2 text-secondary text-text-2 flex items-start gap-2.5 p-3.5',
        className,
      )}
    >
      {Icon && <Icon aria-hidden size={18} className="mt-px shrink-0" />}
      <div className="min-w-0 flex-1 text-pretty wrap-break-word">{children}</div>
    </div>
  )
}
