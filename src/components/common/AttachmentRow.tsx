import { Download, FileText, Image } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { Attachment } from '@/api/schemas/common'
import { fileSize } from '@/lib/format'
import { Ltr } from './Ltr'

/** File row (surface-2 r12): type icon, name and size (LTR), "Open" in a new tab. */
export function AttachmentRow({ attachment: a }: { attachment: Attachment }) {
  const { t } = useTranslation()
  const Icon = a.mimeType.startsWith('image/') ? Image : FileText
  const kind = a.mimeType === 'application/pdf' ? 'PDF' : (a.name.split('.').pop() ?? '').toUpperCase()
  return (
    <a
      href={a.url}
      target="_blank"
      rel="noreferrer"
      className="rounded-tile bg-surface-2 flex min-h-14 items-center gap-3 px-3 py-2"
    >
      <Icon aria-hidden size={20} className="text-text-2 shrink-0" />
      <span className="flex min-w-0 flex-1 flex-col">
        <Ltr className="text-secondary truncate text-start font-bold">{a.name}</Ltr>
        <Ltr className="text-tag text-text-2 text-start">
          {kind} · {fileSize(a.sizeBytes)}
        </Ltr>
      </span>
      <span className="text-meta text-link flex shrink-0 items-center gap-1 font-extrabold">
        <Download aria-hidden size={16} />
        {t('attachment.open')}
      </span>
    </a>
  )
}
