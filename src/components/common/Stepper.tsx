import { Check, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export type StepperStep = { label: string; icon?: LucideIcon }

/** Horizontal status stepper. Mirrors in RTL through flex order + logical insets. */
export function Stepper({
  steps,
  current,
  className,
}: {
  steps: StepperStep[]
  current: number
  className?: string
}) {
  return (
    <ol className={cn('m-0 flex list-none p-0', className)}>
      {steps.map((step, i) => {
        const state = i < current ? 'done' : i === current ? 'active' : 'future'
        const Icon = state === 'done' ? Check : step.icon
        return (
          <li
            key={step.label}
            aria-current={state === 'active' ? 'step' : undefined}
            className="relative flex min-w-0 flex-1 flex-col items-center gap-1.5"
          >
            {i < steps.length - 1 && (
              <span
                aria-hidden
                className={cn(
                  'absolute start-1/2 top-[15px] h-0.5 w-full transition-colors duration-300',
                  i < current ? 'bg-green-fg' : 'bg-border',
                )}
              />
            )}
            <span
              className={cn(
                'relative flex size-8 items-center justify-center rounded-full border-2',
                state === 'done' && 'border-green-fg bg-green-fg text-white',
                state === 'active' && 'border-primary bg-primary text-on-primary',
                state === 'future' && 'border-border bg-surface text-text-2',
              )}
            >
              {Icon && <Icon aria-hidden size={15} strokeWidth={state === 'done' ? 3 : 2} />}
            </span>
            <span
              className={cn(
                'text-tag text-label line-clamp-2 px-0.5 text-center wrap-break-word',
                state === 'active' ? 'text-text font-extrabold' : 'text-text-2 font-semibold',
              )}
            >
              {step.label}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

export function ProgressBar({
  value,
  max = 1,
  tone = 'bg-primary',
  label,
}: {
  value: number
  max?: number
  tone?: string
  label?: string
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-label={label}
      className="bg-surface-2 h-2 w-full overflow-hidden rounded-[4px]"
    >
      <div
        className={cn('h-full rounded-[4px] transition-[width] duration-300 ease-out', tone)}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
