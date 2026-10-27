import { CircleX, FileText, RotateCw, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { uploadAttachment, type UploadPurpose } from '@/api/endpoints/attachments'
import { isApiError } from '@/api/errors'
import type { Attachment } from '@/api/schemas/common'
import { Ltr } from '@/components/common/Ltr'
import { ProgressBar } from '@/components/common/Stepper'
import { fileSize } from '@/lib/format'
import { cn, uuid } from '@/lib/utils'

export const MAX_FILES = 5
const MAX_BYTES = 10 * 1024 * 1024
const ALLOWED = /\.(jpe?g|png|heic|pdf)$/i

export type UploadItem = {
  localId: string
  file: File
  previewUrl: string | null
  status: 'uploading' | 'done' | 'error'
  progress: number
  attachment?: Attachment
  errorKey?: string
}

/** Rejected files get one inline message each (validation key + file name). */
export type Rejection = { key: string; name: string }

/**
 * Validates and uploads files as soon as they're picked (`POST /attachments` with progress).
 * Failed uploads keep their row with Retry; removing aborts an upload in flight.
 */
export function useAttachmentUploads(purpose: UploadPurpose, max = MAX_FILES) {
  const [items, setItems] = useState<UploadItem[]>([])
  const [rejected, setRejected] = useState<Rejection[]>([])
  const aborts = useRef(new Map<string, AbortController>())
  const itemsRef = useRef(items)
  useEffect(() => {
    itemsRef.current = items
  })

  const patch = (localId: string, p: Partial<UploadItem>) =>
    setItems((list) => list.map((i) => (i.localId === localId ? { ...i, ...p } : i)))

  const start = useCallback(
    (item: UploadItem) => {
      const ctrl = new AbortController()
      aborts.current.set(item.localId, ctrl)
      patch(item.localId, { status: 'uploading', progress: 0, errorKey: undefined })
      uploadAttachment(item.file, purpose, (progress) => patch(item.localId, { progress }), ctrl.signal)
        .then((attachment) => patch(item.localId, { status: 'done', progress: 1, attachment }))
        .catch((e: unknown) => {
          if (e instanceof DOMException && e.name === 'AbortError') return
          const key = isApiError(e)
            ? e.code === 'FILE_TOO_LARGE'
              ? 'validation:fileSize'
              : e.code === 'FILE_TYPE_NOT_ALLOWED'
                ? 'validation:fileType'
                : undefined
            : undefined
          patch(item.localId, { status: 'error', errorKey: key })
        })
        .finally(() => aborts.current.delete(item.localId))
    },
    [purpose],
  )

  const add = useCallback(
    (files: FileList | File[]) => {
      const rejections: Rejection[] = []
      const accepted: UploadItem[] = []
      let room = max - itemsRef.current.length
      for (const file of Array.from(files)) {
        if (!ALLOWED.test(file.name)) rejections.push({ key: 'validation:fileType', name: file.name })
        else if (file.size > MAX_BYTES) rejections.push({ key: 'validation:fileSize', name: file.name })
        else if (room <= 0) rejections.push({ key: 'validation:fileCount', name: file.name })
        else {
          room--
          accepted.push({
            localId: uuid(),
            file,
            previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
            status: 'uploading',
            progress: 0,
          })
        }
      }
      // One "up to 5 files" message is enough, however many extra files were picked.
      setRejected(rejections.filter((r, i, all) => r.key !== 'validation:fileCount' || all.findIndex((x) => x.key === r.key) === i))
      if (accepted.length) {
        setItems((list) => [...list, ...accepted])
        accepted.forEach(start)
      }
    },
    [max, start],
  )

  const remove = useCallback((localId: string) => {
    aborts.current.get(localId)?.abort()
    setItems((list) => {
      const item = list.find((i) => i.localId === localId)
      if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl)
      return list.filter((i) => i.localId !== localId)
    })
  }, [])

  const retry = useCallback(
    (localId: string) => {
      const item = itemsRef.current.find((i) => i.localId === localId)
      if (item) start(item)
    },
    [start],
  )

  const reset = useCallback(() => {
    aborts.current.forEach((c) => c.abort())
    itemsRef.current.forEach((i) => i.previewUrl && URL.revokeObjectURL(i.previewUrl))
    setItems([])
    setRejected([])
  }, [])

  useEffect(() => {
    const controllers = aborts.current
    return () => controllers.forEach((c) => c.abort())
  }, [])

  return {
    items,
    rejected,
    add,
    remove,
    retry,
    reset,
    uploading: items.filter((i) => i.status === 'uploading').length,
    failed: items.filter((i) => i.status === 'error').length,
    attachments: items.flatMap((i) => (i.attachment ? [i.attachment] : [])),
  }
}

const kindLabel = (file: File) => (file.name.split('.').pop() ?? '').toUpperCase()

export function UploadList({
  uploads,
  compact = false,
}: {
  uploads: ReturnType<typeof useAttachmentUploads>
  compact?: boolean
}) {
  const { t } = useTranslation('staff')
  if (!uploads.items.length && !uploads.rejected.length) return null
  return (
    <div className="flex flex-col gap-2">
      {uploads.items.map((item) => (
        <div
          key={item.localId}
          className={cn(
            'rounded-tile bg-surface-2 flex items-center gap-3 p-2.5',
            item.status === 'error' && 'border-danger border',
          )}
        >
          {item.previewUrl ? (
            <img src={item.previewUrl} alt="" className={cn('shrink-0 rounded-sm object-cover', compact ? 'size-9' : 'size-11')} />
          ) : (
            <div
              aria-hidden
              className={cn(
                'bg-surface text-text-2 flex shrink-0 items-center justify-center rounded-sm',
                compact ? 'size-9' : 'size-11',
              )}
            >
              <FileText size={20} />
            </div>
          )}
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <Ltr className="text-secondary truncate text-start font-bold">{item.file.name}</Ltr>
            {item.status === 'uploading' ? (
              <ProgressBar value={item.progress} label={item.file.name} />
            ) : item.status === 'error' ? (
              <span className="text-meta text-danger font-bold">
                {item.errorKey ? t(item.errorKey, { name: item.file.name }) : t('new.uploadFailed')}
              </span>
            ) : (
              <Ltr className="text-tag text-text-2 text-start">
                {kindLabel(item.file)} · {fileSize(item.file.size)}
              </Ltr>
            )}
          </div>
          {item.status === 'error' && !item.errorKey && (
            <button
              type="button"
              onClick={() => uploads.retry(item.localId)}
              className="text-link flex min-h-11 min-w-11 shrink-0 flex-col items-center justify-center gap-0.5 px-1"
            >
              <RotateCw aria-hidden size={18} />
              <span className="text-micro font-extrabold">{t('new.retry')}</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => uploads.remove(item.localId)}
            aria-label={t('new.removeLabel', { name: item.file.name })}
            className="text-text-2 flex min-h-11 min-w-11 shrink-0 flex-col items-center justify-center gap-0.5 px-1"
          >
            <Trash2 aria-hidden size={18} />
            <span className="text-micro font-extrabold">{t('new.remove')}</span>
          </button>
        </div>
      ))}
      {uploads.rejected.map((r) => (
        <p key={r.key + r.name} role="alert" className="text-meta text-danger m-0 flex items-start gap-1.5">
          <CircleX aria-hidden size={15} className="mt-px shrink-0" />
          <span className="min-w-0 wrap-break-word">{t(r.key, { name: r.name })}</span>
        </p>
      ))}
    </div>
  )
}
