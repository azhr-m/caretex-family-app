import type { LucideIcon } from 'lucide-react'
import { ToggleGroup } from 'radix-ui'
import { cn } from '@/lib/utils'

export type ChipOption<T extends string> = { value: T; label: string; icon?: LucideIcon; count?: number }

/** Horizontally scrolling single-select chips; bleeds to the screen edge without page-level overflow. */
export function FilterChips<T extends string>({
  value,
  onChange,
  options,
  label,
  className,
}: {
  value: T
  onChange: (value: T) => void
  options: ChipOption<T>[]
  label: string
  className?: string
}) {
  return (
    <ToggleGroup.Root
      type="single"
      value={value}
      onValueChange={(v) => v && onChange(v as T)}
      aria-label={label}
      className={cn('-mx-4 flex snap-x scrollbar-none gap-2 overflow-x-auto px-4 pb-0.5', className)}
    >
      {options.map(({ value: v, label: l, icon: Icon, count }) => (
        <ToggleGroup.Item
          key={v}
          value={v}
          className={cn(
            'border-border bg-surface text-secondary text-text flex min-h-11 shrink-0 snap-start items-center gap-1.5 rounded-[22px] border px-4 font-extrabold whitespace-nowrap',
            'data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-on-primary',
          )}
        >
          {Icon && <Icon aria-hidden size={16} className="shrink-0" />}
          {l}
          {count !== undefined && <span className="tabular-nums opacity-75">{count}</span>}
        </ToggleGroup.Item>
      ))}
    </ToggleGroup.Root>
  )
}
