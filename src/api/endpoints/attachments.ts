import { uuid } from '@/lib/utils'
import { useSessionStore } from '@/stores/session'
import { API_BASE, refreshSession } from '../client'
import { ApiError, errorEnvelopeSchema, toServerCode } from '../errors'
import { attachmentSchema, type Attachment } from '../schemas/common'

export type UploadPurpose = 'inquiry' | 'service_request'

/**
 * `POST /attachments` (multipart) through XMLHttpRequest, because fetch has no upload progress.
 * Refreshes the session once on TOKEN_EXPIRED.
 */
export async function uploadAttachment(
  file: File,
  purpose: UploadPurpose,
  onProgress: (fraction: number) => void,
  signal?: AbortSignal,
): Promise<Attachment> {
  try {
    return await send(file, purpose, onProgress, signal)
  } catch (e) {
    if (e instanceof ApiError && e.code === 'TOKEN_EXPIRED' && (await refreshSession())) {
      return send(file, purpose, onProgress, signal)
    }
    throw e
  }
}

function send(file: File, purpose: UploadPurpose, onProgress: (f: number) => void, signal?: AbortSignal) {
  return new Promise<Attachment>((resolve, reject) => {
    const requestId = uuid()
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${API_BASE}/attachments`)
    const token = useSessionStore.getState().accessToken
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    xhr.setRequestHeader('X-Request-Id', requestId)
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(e.loaded / e.total)
    }
    const fail = (code: 'NETWORK' | 'TIMEOUT') =>
      reject(new ApiError({ status: 0, code, message: 'Upload failed', retryable: true, requestId }))
    xhr.onerror = () => fail('NETWORK')
    xhr.ontimeout = () => fail('TIMEOUT')
    xhr.onabort = () => reject(new DOMException('Aborted', 'AbortError'))
    xhr.onload = () => {
      const json: unknown = (() => {
        try {
          return JSON.parse(xhr.responseText)
        } catch {
          return undefined
        }
      })()
      if (xhr.status >= 200 && xhr.status < 300) {
        const parsed = attachmentSchema.safeParse(json)
        if (parsed.success) return resolve(parsed.data)
        return reject(
          new ApiError({
            status: xhr.status,
            code: 'INVALID_RESPONSE',
            message: 'Unexpected response',
            retryable: false,
            requestId,
          }),
        )
      }
      const env = errorEnvelopeSchema.safeParse(json)
      reject(
        new ApiError({
          status: xhr.status,
          code: env.success ? toServerCode(env.data.error.code) : 'SERVICE_UNAVAILABLE',
          message: env.success ? env.data.error.message : 'Upload failed',
          retryable: env.success ? env.data.error.retryable : xhr.status >= 500,
          requestId: env.success ? env.data.requestId : requestId,
        }),
      )
    }
    signal?.addEventListener('abort', () => xhr.abort())
    xhr.timeout = 120_000
    const form = new FormData()
    form.append('file', file)
    form.append('purpose', purpose)
    xhr.send(form)
  })
}
