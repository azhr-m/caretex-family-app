import { cva, type VariantProps } from 'class-variance-authority'
import { LoaderCircle, type LucideIcon } from 'lucide-react'
import { Slot } from 'radix-ui'
import type { ComponentProps, ReactNode } from 'react'
import { DirIcon } from '@/components/common/DirIcon'
import { cn } from '@/lib/utils'

export const buttonVariants = cva(
  'inline-flex items-center justify-center font-extrabold transition-[background-color,filter,color,scale] duration-[120ms] ease-out select-none active:scale-[.98] active:brightness-[.94] disabled:pointer-events-none aria-busy:pointer-events-none',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-on-primary disabled:bg-disabled disabled:text-disabled-text',
        secondary: 'border-border bg-surface text-text disabled:text-disabled-text border',
        tonal: 'bg-surface-2 text-text disabled:text-disabled-text',
        danger: 'border-red-bd bg-red-bg text-red-fg border disabled:opacity-60',
        dangerSolid: 'bg-red-fg disabled:bg-disabled disabled:text-disabled-text dark:text-bg text-white',
        link: 'text-link disabled:text-disabled-text bg-transparent',
        onNavy: 'border border-white/20 bg-white/[.08] text-white',
      },
      size: {
        lg: 'rounded-btn text-button-lg min-h-14 gap-2.5 px-5',
        compact: 'rounded-tile text-secondary min-h-11 gap-2 px-4',
        link: 'text-body-sm min-h-11 gap-1.5 px-1',
      },
      block: { true: 'w-full', false: '' },
    },
    defaultVariants: { variant: 'primary', size: 'lg', block: false },
  },
)

type ButtonProps = Omit<ComponentProps<'button'>, 'children'> &
  VariantProps<typeof buttonVariants> & {
    icon?: LucideIcon
    iconEnd?: LucideIcon
    loading?: boolean
    asChild?: boolean
    children?: ReactNode
  }

export function Button({
  className,
  variant,
  size,
  block,
  icon,
  iconEnd,
  loading = false,
  asChild = false,
  disabled,
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  const iconSize = size === 'compact' ? 17 : size === 'link' ? 18 : 20
  const classes = cn(buttonVariants({ variant, size, block }), className)
  const content = (
    <>
      {loading ? (
        <LoaderCircle aria-hidden size={iconSize} className="shrink-0 animate-spin" />
      ) : (
        icon && <DirIcon icon={icon} size={iconSize} />
      )}
      {children !== undefined && <span className="min-w-0 text-center wrap-break-word">{children}</span>}
      {iconEnd && !loading && <DirIcon icon={iconEnd} size={iconSize} />}
    </>
  )

  if (asChild) {
    return (
      <Slot.Root className={classes} {...props}>
        {children}
      </Slot.Root>
    )
  }

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {content}
    </button>
  )
}
