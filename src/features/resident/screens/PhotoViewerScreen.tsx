import { useQuery } from '@tanstack/react-query'
import { useCanGoBack, useNavigate, useRouter } from '@tanstack/react-router'
import { ChevronLeft, ChevronRight, Download, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { updateQuery } from '@/api/queries/residents'
import type { Photo } from '@/api/schemas/common'
import type { UpdateDetail } from '@/api/schemas/resident'
import { DirIcon } from '@/components/common/DirIcon'
import { Ltr } from '@/components/common/Ltr'
import { PhotoImage } from '@/components/common/PhotoImage'
import { QueryBoundary } from '@/components/states/QueryBoundary'
import { dateTime } from '@/lib/format'
import { dirOf } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { permissionStates } from '../components/SectionGate'

const SWIPE_PX = 60
const MAX_SCALE = 4

/** Full-screen photo viewer (design `resPhoto`). `index` in the URL is 1-based, like the counter. */
export function PhotoViewerScreen({ rid, updateId, index }: { rid: string; updateId: string; index: number }) {
  const query = useQuery(updateQuery(updateId))
  const router = useRouter()
  const canGoBack = useCanGoBack()
  const close = useCallback(() => {
    if (canGoBack) router.history.back()
    else void router.navigate({ to: '/r/$rid/resident/updates/$updateId', params: { rid, updateId }, replace: true })
  }, [canGoBack, router, rid, updateId])

  return (
    <div className="fixed inset-0 z-50 bg-[#05070B] text-white">
      <div className="mx-auto flex h-dvh max-w-[480px] flex-col" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <QueryBoundary query={query} skeleton={null} permission={permissionStates(rid, 'updates')}>
          {(u) => <Viewer update={u} rid={rid} index={index} onClose={close} />}
        </QueryBoundary>
      </div>
    </div>
  )
}

function Viewer({
  update,
  rid,
  index,
  onClose,
}: {
  update: UpdateDetail
  rid: string
  index: number
  onClose: () => void
}) {
  const { t, i18n } = useTranslation(['resident', 'common'])
  const navigate = useNavigate()
  const rtl = dirOf(i18n.language) === 'rtl'
  const count = update.photos.length
  const current = Math.min(Math.max(index, 1), Math.max(count, 1))
  const photo = update.photos[current - 1]

  const go = useCallback(
    (n: number) => {
      if (n < 1 || n > count) return
      void navigate({
        to: '/r/$rid/resident/updates/$updateId/photos/$index',
        params: { rid, updateId: update.id, index: String(n) },
        replace: true,
      })
    },
    [count, navigate, rid, update.id],
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowRight') go(rtl ? current - 1 : current + 1)
      else if (e.key === 'ArrowLeft') go(rtl ? current + 1 : current - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [current, go, onClose, rtl])

  if (!photo) return null

  return (
    <div role="dialog" aria-modal="true" aria-label={t('photo.viewer', { index: current, count })} className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between gap-2 px-3.5 py-1.5">
        <button
          type="button"
          onClick={onClose}
          className="text-body-sm flex h-11 items-center gap-1.5 rounded-[22px] bg-white/12 px-3.5 font-extrabold"
        >
          <X aria-hidden size={20} />
          {t('common:actions.close')}
        </button>
        <Ltr className="text-body-sm font-extrabold tabular-nums opacity-90">
          {t('photo.counter', { index: current, count })}
        </Ltr>
        <a
          href={photo.url}
          download
          className="text-body-sm flex h-11 items-center gap-1.5 rounded-[22px] bg-white/12 px-3.5 font-extrabold"
        >
          <Download aria-hidden size={18} />
          {t('photo.save')}
        </a>
      </div>

      <Stage
        key={photo.id}
        photo={photo}
        rtl={rtl}
        onNext={() => go(current + 1)}
        onPrev={() => go(current - 1)}
      />

      <div className="flex flex-col gap-1 px-5 pb-3.5">
        {photo.caption && <span className="text-body font-bold wrap-break-word">{photo.caption}</span>}
        <span className="text-meta opacity-70">
          {update.author.name} · <Ltr>{dateTime(update.publishedAt)}</Ltr>
        </span>
      </div>

      <div className="flex gap-2.5 px-5 pt-1.5" style={{ paddingBottom: 'max(20px, env(safe-area-inset-bottom))' }}>
        <NavButton disabled={current <= 1} onClick={() => go(current - 1)}>
          <DirIcon icon={ChevronLeft} size={20} />
          {t('photo.previous')}
        </NavButton>
        <NavButton disabled={current >= count} onClick={() => go(current + 1)}>
          {t('photo.next')}
          <DirIcon icon={ChevronRight} size={20} />
        </NavButton>
      </div>
    </div>
  )
}

function NavButton({ disabled, onClick, children }: { disabled: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'text-body-sm flex h-[52px] flex-1 items-center justify-center gap-1.5 rounded-[14px] border border-white/18 font-extrabold',
        disabled ? 'text-white/40' : 'bg-white/10 text-white',
      )}
    >
      {children}
    </button>
  )
}

type Gesture =
  | { kind: 'swipe'; startX: number; startY: number }
  | { kind: 'pan'; startX: number; startY: number; tx: number; ty: number }
  | { kind: 'pinch'; startDist: number; startScale: number }

/**
 * One finger swipes between photos (direction mirrored in RTL), two fingers pinch-zoom,
 * a zoomed photo pans with one finger, double-tap toggles zoom.
 */
function Stage({
  photo,
  rtl,
  onNext,
  onPrev,
}: {
  photo: Photo
  rtl: boolean
  onNext: () => void
  onPrev: () => void
}) {
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const gesture = useRef<Gesture | null>(null)
  const lastTap = useRef(0)
  const [view, setView] = useState({ scale: 1, tx: 0, ty: 0, dx: 0, dragging: false })

  const distance = () => {
    const [a, b] = [...pointers.current.values()]
    return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0
  }

  const onPointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pointers.current.size === 2) {
      gesture.current = { kind: 'pinch', startDist: distance(), startScale: view.scale }
    } else if (pointers.current.size === 1) {
      gesture.current =
        view.scale > 1
          ? { kind: 'pan', startX: e.clientX, startY: e.clientY, tx: view.tx, ty: view.ty }
          : { kind: 'swipe', startX: e.clientX, startY: e.clientY }
    }
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const g = gesture.current
    if (!g) return
    if (g.kind === 'pinch') {
      const scale = Math.min(MAX_SCALE, Math.max(1, (g.startScale * distance()) / (g.startDist || 1)))
      setView((v) => ({ ...v, scale, ...(scale === 1 ? { tx: 0, ty: 0 } : {}) }))
    } else if (g.kind === 'pan') {
      setView((v) => ({ ...v, tx: g.tx + e.clientX - g.startX, ty: g.ty + e.clientY - g.startY }))
    } else {
      setView((v) => ({ ...v, dx: e.clientX - g.startX, dragging: true }))
    }
  }

  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId)
    const g = gesture.current
    if (g?.kind === 'swipe' && pointers.current.size === 0) {
      const dx = e.clientX - g.startX
      const dy = e.clientY - g.startY
      if (Math.abs(dx) > SWIPE_PX && Math.abs(dx) > Math.abs(dy)) {
        // Content flows right-to-left in RTL, so a swipe to the right shows the next photo.
        const forward = rtl ? dx > 0 : dx < 0
        if (forward) onNext()
        else onPrev()
      } else if (Math.abs(dx) < 8 && Math.abs(dy) < 8) {
        const now = Date.now()
        if (now - lastTap.current < 300) {
          setView((v) => (v.scale > 1 ? { ...v, scale: 1, tx: 0, ty: 0 } : { ...v, scale: 2.5 }))
          lastTap.current = 0
        } else lastTap.current = now
      }
    }
    if (pointers.current.size === 0) gesture.current = null
    else if (pointers.current.size === 1 && g?.kind === 'pinch') {
      const [p] = [...pointers.current.values()]
      gesture.current = { kind: 'pan', startX: p!.x, startY: p!.y, tx: view.tx, ty: view.ty }
    }
    setView((v) => ({ ...v, dx: 0, dragging: false }))
  }

  return (
    <div
      className="relative my-4 min-h-0 flex-1 touch-none overflow-hidden select-none"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <div
        className={cn('size-full', !view.dragging && 'transition-transform duration-200')}
        style={{
          transform: `translate3d(${view.tx + view.dx}px, ${view.ty}px, 0) scale(${view.scale})`,
        }}
      >
        <PhotoImage photo={photo} full fit="contain" className="size-full bg-[#141821]" />
      </div>
    </div>
  )
}
