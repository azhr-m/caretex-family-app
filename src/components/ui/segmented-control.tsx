import type { LucideIcon } from 'lucide-react'
import { ToggleGroup } from 'radix-ui'
import { cn } from '@/lib/utils'

export type SegmentOption<T extends string> = {
  value: T
  label: string
  icon?: LucideIcon
  disabled?: boolean
}

export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  label,
  className,
}: {
  value: T
  onChange: (value: T) => void
  options: SegmentOption<T>[]
  label: string
  className?: string
}) {
  return (
    <ToggleGroup.Root
      type="single"
      value={value}
      onValueChange={(v) => v && onChange(v as T)}
      aria-label={label}
      className={cn('rounded-btn bg-surface-2 flex gap-1 p-1', className)}
    >
      {options.map(({ value: v, label: l, icon: Icon, disabled }) => (
        <ToggleGroup.Item
          key={v}
          value={v}
          disabled={disabled}
          className={cn(
            'rounded-tile text-secondary text-text-2 flex min-h-11 min-w-0 flex-1 items-center justify-center gap-1.5 px-2 font-extrabold transition-colors',
            'data-[state=on]:bg-surface data-[state=on]:text-text data-[state=on]:shadow-seg disabled:opacity-50',
          )}
        >
          {Icon && <Icon aria-hidden size={17} className="shrink-0" />}
          <span className="truncate">{l}</span>
        </ToggleGroup.Item>
      ))}
    </ToggleGroup.Root>
  )
}
