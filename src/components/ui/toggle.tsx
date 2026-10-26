import type { LucideIcon } from 'lucide-react'
import { Switch } from 'radix-ui'
import { useId, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { IconTile } from '@/components/common/IconTile'
import type { Tone } from '@/lib/status'
import { cn } from '@/lib/utils'

export function Toggle({
  checked,
  onCheckedChange,
  disabled,
  locked,
  id,
  labelledBy,
}: {
  checked: boolean
  onCheckedChange?: (v: boolean) => void
  disabled?: boolean
  locked?: boolean
  id?: string
  labelledBy?: string
}) {
  const { t } = useTranslation()
  const caption = locked ? t('toggle.locked') : checked ? t('toggle.on') : t('toggle.off')
  return (
    <div className={cn('flex shrink-0 flex-col items-center gap-0.5', (disabled || locked) && 'opacity-50')}>
      <Switch.Root
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled || locked}
        aria-labelledby={labelledBy}
        className="rounded-pill bg-toggle-off data-[state=checked]:bg-green-fg relative h-[31px] w-[51px] transition-colors"
      >
        <Switch.Thumb className="shadow-seg absolute start-[3px] top-[3px] block size-[25px] rounded-full bg-white transition-[inset-inline-start] duration-200 data-[state=checked]:start-[23px]" />
      </Switch.Root>
      <span
        className={cn('text-[10px] font-extrabold', checked && !locked ? 'text-green-fg' : 'text-text-2')}
      >
        {caption}
      </span>
    </div>
  )
}

/** Settings row where the whole row is the hit target. */
export function ToggleRow({
  icon,
  tone = 'slate',
  label,
  description,
  checked,
  onCheckedChange,
  locked,
}: {
  icon: LucideIcon
  tone?: Tone
  label: ReactNode
  description?: ReactNode
  checked: boolean
  onCheckedChange: (v: boolean) => void
  locked?: boolean
}) {
  const id = useId()
  return (
    <label
      htmlFor={id}
      className={cn(
        'flex min-h-16 items-center gap-3 px-3.5 py-3',
        !locked && 'active:bg-surface-2 cursor-pointer',
      )}
    >
      <IconTile icon={icon} tone={tone} size={40} />
      <span id={`${id}-l`} className="flex min-w-0 flex-1 flex-col">
        <span className="text-body-sm font-bold wrap-break-word">{label}</span>
        {description && <span className="text-meta text-text-2">{description}</span>}
      </span>
      <Toggle
        id={id}
        labelledBy={`${id}-l`}
        checked={checked}
        onCheckedChange={onCheckedChange}
        locked={locked}
      />
    </label>
  )
}
