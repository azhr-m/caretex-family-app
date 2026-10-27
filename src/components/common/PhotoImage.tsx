import { ImageOff } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Photo } from '@/api/schemas/common'
import { cn } from '@/lib/utils'

/**
 * Striped placeholder while loading, then the thumbnail, then (with `full`) the full image on top.
 * A broken image shows `image-off` + "Photo unavailable".
 */
export function PhotoImage({
  photo,
  full = false,
  fit = 'cover',
  className,
  imgClassName,
}: {
  photo: Photo
  full?: boolean
  fit?: 'cover' | 'contain'
  className?: string
  imgClassName?: string
}) {
  const { t } = useTranslation('resident')
  const [thumbLoaded, setThumbLoaded] = useState(false)
  const [fullLoaded, setFullLoaded] = useState(false)
  const [broken, setBroken] = useState(false)
  const img = cn('absolute inset-0 size-full', fit === 'cover' ? 'object-cover' : 'object-contain', imgClassName)

  return (
    <div className={cn('relative overflow-hidden', !thumbLoaded && 'stripes', className)}>
      {broken ? (
        <div
          role="img"
          aria-label={t('photo.unavailable')}
          className="stripes text-text-2 absolute inset-0 flex flex-col items-center justify-center gap-1.5"
        >
          <ImageOff aria-hidden size={22} />
          <span className="text-meta px-2 text-center font-bold">{t('photo.unavailable')}</span>
        </div>
      ) : (
        <>
          <img
            src={photo.thumbnailUrl}
            alt={full && fullLoaded ? '' : (photo.caption ?? '')}
            draggable={false}
            onLoad={() => setThumbLoaded(true)}
            onError={() => setBroken(true)}
            className={cn(img, 'transition-opacity duration-200', thumbLoaded ? 'opacity-100' : 'opacity-0')}
          />
          {full && (
            <img
              src={photo.url}
              alt={photo.caption ?? ''}
              draggable={false}
              onLoad={() => setFullLoaded(true)}
              className={cn(img, 'transition-opacity duration-200', fullLoaded ? 'opacity-100' : 'opacity-0')}
            />
          )}
        </>
      )}
    </div>
  )
}
