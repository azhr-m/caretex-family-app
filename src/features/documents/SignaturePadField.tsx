import { Eraser, Undo2 } from 'lucide-react'
import SignaturePad from 'signature_pad'
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'

export type SignaturePadHandle = { toPng: () => string | null }

const MIN_W = 40
const MIN_H = 15

/** Bounding box of all strokes, in CSS pixels. */
function bounds(pad: SignaturePad) {
  const pts = pad.toData().flatMap((g) => g.points)
  if (!pts.length) return null
  const xs = pts.map((p) => p.x)
  const ys = pts.map((p) => p.y)
  return { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) }
}

/**
 * SignaturePad: 180h, always white, baseline + "×" at the start, Clear and Undo.
 * Reports whether the drawing counts as a signature (≥ 1 stroke and a box of at least 40×15 px).
 */
export const SignaturePadField = forwardRef<SignaturePadHandle, { onChange: (valid: boolean, drawn: boolean) => void; disabled?: boolean }>(
  function SignaturePadField({ onChange, disabled = false }, ref) {
    const { t } = useTranslation('documents')
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const padRef = useRef<SignaturePad | null>(null)
    const onChangeRef = useRef(onChange)
    useEffect(() => {
      onChangeRef.current = onChange
    })

    const report = () => {
      const pad = padRef.current
      if (!pad) return
      const b = bounds(pad)
      onChangeRef.current(!!b && b.w >= MIN_W && b.h >= MIN_H, !pad.isEmpty())
    }

    useEffect(() => {
      const canvas = canvasRef.current
      if (!canvas) return
      const pad = new SignaturePad(canvas, { penColor: '#1A2233', minWidth: 1, maxWidth: 2.6 })
      padRef.current = pad
      // Match the canvas to its CSS size and pixel ratio, keeping what was drawn.
      const resize = () => {
        const data = pad.toData()
        const ratio = Math.max(window.devicePixelRatio || 1, 1)
        canvas.width = canvas.offsetWidth * ratio
        canvas.height = canvas.offsetHeight * ratio
        canvas.getContext('2d')?.scale(ratio, ratio)
        pad.clear()
        pad.fromData(data)
      }
      resize()
      pad.addEventListener('endStroke', report)
      const ro = new ResizeObserver(resize)
      ro.observe(canvas)
      return () => {
        ro.disconnect()
        pad.removeEventListener('endStroke', report)
        pad.off()
        padRef.current = null
      }
    }, [])

    useEffect(() => {
      const pad = padRef.current
      if (!pad) return
      if (disabled) pad.off()
      else pad.on()
    }, [disabled])

    useImperativeHandle(ref, () => ({
      // Trimmed to the strokes (plus a small margin) so the stored image is just the signature.
      toPng: () => {
        const pad = padRef.current
        const canvas = canvasRef.current
        const b = pad && bounds(pad)
        if (!pad || !canvas || !b) return null
        const ratio = canvas.width / canvas.offsetWidth
        const m = 8
        const out = document.createElement('canvas')
        out.width = Math.ceil((b.w + m * 2) * ratio)
        out.height = Math.ceil((b.h + m * 2) * ratio)
        const ctx = out.getContext('2d')!
        ctx.fillStyle = '#fff'
        ctx.fillRect(0, 0, out.width, out.height)
        ctx.drawImage(canvas, (b.x - m) * ratio, (b.y - m) * ratio, out.width, out.height, 0, 0, out.width, out.height)
        return out.toDataURL('image/png')
      },
    }))

    const clear = () => {
      padRef.current?.clear()
      report()
    }
    const undo = () => {
      const pad = padRef.current
      if (!pad) return
      const data = pad.toData()
      data.pop()
      pad.fromData(data)
      report()
    }

    return (
      <div className="flex flex-col gap-2">
        {/* data-vaul-no-drag: drawing must not drag the bottom sheet closed. */}
        <div data-vaul-no-drag className="relative h-[180px] overflow-hidden rounded-[16px] border-2 border-dashed border-[#B8BFCC] bg-white">
          <canvas
            ref={canvasRef}
            role="img"
            aria-label={t('sign.padLabel')}
            className="absolute inset-0 size-full touch-none"
          />
          <div aria-hidden className="pointer-events-none absolute inset-x-5 bottom-10 flex items-end gap-2 text-[#8A93A3]">
            <span className="text-title-sm leading-none font-bold">×</span>
            <span className="mb-1 h-px flex-1 bg-[#C9CED8]" />
          </div>
        </div>
        <span className="text-meta text-text-2">{t('sign.withFinger')}</span>
        <div className="grid grid-cols-2 gap-2.5">
          <Button variant="secondary" size="compact" icon={Eraser} onClick={clear} disabled={disabled}>
            {t('sign.clear')}
          </Button>
          <Button variant="secondary" size="compact" icon={Undo2} onClick={undo} disabled={disabled}>
            {t('sign.undo')}
          </Button>
        </div>
      </div>
    )
  },
)
