import type { Attachment } from '@/api/schemas/common'
import { API_BASE } from '@/api/client'

type StoredFile = { attachment: Attachment; blob: Blob | null }

/** Uploaded files (kept as blobs until reload) plus fixture attachments that are generated on request. */
export const files = new Map<string, StoredFile>()

export function fixtureAttachment(id: string, name: string, mimeType: string, sizeBytes: number): Attachment {
  const attachment: Attachment = {
    id,
    name,
    mimeType,
    sizeBytes,
    url: `${API_BASE}/media/files/${id}`,
    thumbnailUrl: null,
  }
  if (!files.has(id)) files.set(id, { attachment, blob: null })
  return attachment
}

export function storeUpload(file: File): Attachment {
  const id = `att_${crypto.randomUUID().slice(0, 8)}`
  const image = file.type.startsWith('image/')
  const attachment: Attachment = {
    id,
    name: file.name,
    mimeType: file.type || 'application/octet-stream',
    sizeBytes: file.size,
    url: `${API_BASE}/media/files/${id}`,
    thumbnailUrl: image ? `${API_BASE}/media/files/${id}` : null,
  }
  files.set(id, { attachment, blob: file })
  return attachment
}

/** A one-page PDF with a title line, so fixture "PDF" attachments open in the browser. */
export function minimalPdf(title: string) {
  const text = title.replace(/[()\\]/g, '')
  const stream = `BT /F1 20 Tf 72 720 Td (${text}) Tj ET`
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ]
  let out = '%PDF-1.4\n'
  const offsets: number[] = []
  objects.forEach((o, i) => {
    offsets.push(out.length)
    out += `${i + 1} 0 obj\n${o}\nendobj\n`
  })
  const xref = out.length
  out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  out += offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('')
  out += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`
  return out
}
