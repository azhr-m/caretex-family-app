import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ExternalLink,
  LogIn,
  LogOut,
  Reply,
  Send,
  Undo2,
  type LucideIcon,
  type LucideProps,
} from 'lucide-react'
import { cn } from '@/lib/utils'

/** Icons whose meaning is a direction; they mirror in RTL. Everything else never mirrors. */
export const DIRECTIONAL_ICONS = new Set<LucideIcon>([
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowLeft,
  ArrowRight,
  Send,
  LogIn,
  LogOut,
  Undo2,
  Reply,
  ExternalLink,
])

export function DirIcon({ icon: Icon, className, ...props }: LucideProps & { icon: LucideIcon }) {
  return (
    <Icon
      aria-hidden
      className={cn(DIRECTIONAL_ICONS.has(Icon) && 'rtl:-scale-x-100', 'shrink-0', className)}
      {...props}
    />
  )
}
