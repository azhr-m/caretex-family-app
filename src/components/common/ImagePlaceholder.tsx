import { ImageOff } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ImagePlaceholder({
  caption,
  broken = false,
  className,
}: {
  caption?: string
  broken?: boolean
  className?: string
}) {
  return (
    <div
      role={caption ? 'img' : undefined}
      aria-label={caption}
      className={cn(
        'stripes text-text-2 flex flex-col items-center justify-center gap-1.5 overflow-hidden',
        className,
      )}
    >
      {broken && <ImageOff aria-hidden size={22} />}
      {caption && <span className="text-meta px-2 text-center font-mono wrap-break-word">{caption}</span>}
    </div>
  )
}
