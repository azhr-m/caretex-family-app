import type { NotificationKind } from '@/api/schemas/account'
import { api } from '@/api/client'
import { z } from 'zod'
import { PUSH_BODIES, type PushBodyKind } from './pushBodies'

export { PUSH_BODIES, type PushBodyKind }

/**
 * Lock-screen push (`04-api-contracts.md` §13). The body is always one of a fixed set of generic
 * sentences per kind, so a push can never carry names, medical terms, subjects or message text.
 */
export const PUSH_BODY_KIND: Record<NotificationKind, PushBodyKind> = {
  inquiry_reply: 'message',
  document: 'document',
  newsletter: 'document',
  event: 'event',
  calendar_change: 'event',
  update: 'update',
  survey: 'update',
  service_request: 'request',
}

export type PushPayload = {
  title: 'CARETEX Family'
  body: string
  data: { notificationId: string }
  tag: 'caretex'
}

/** Takes only the id, kind and device language: there is no parameter that could carry free text. */
export function buildPushPayload(notificationId: string, kind: NotificationKind, lang: 'en' | 'he'): PushPayload {
  return {
    title: 'CARETEX Family',
    body: PUSH_BODIES[lang][PUSH_BODY_KIND[kind]],
    data: { notificationId },
    tag: 'caretex',
  }
}

export type PushSubscribeResult = 'unsupported' | 'not-configured' | 'denied' | 'subscribed'

const VAPID_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined

function base64UrlToBytes(b64: string) {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4)
  const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(raw, (c) => c.charCodeAt(0))
}

/**
 * Web Push subscription: does nothing until VITE_VAPID_PUBLIC_KEY is set, or while mocks own the
 * service worker scope. Then it subscribes through the app-shell worker and registers the device.
 */
export async function subscribeToPush(lang: 'en' | 'he'): Promise<PushSubscribeResult> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return 'unsupported'
  if (!VAPID_KEY || import.meta.env.VITE_USE_MOCKS === 'true') return 'not-configured'
  if ((await Notification.requestPermission()) !== 'granted') return 'denied'
  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: base64UrlToBytes(VAPID_KEY),
  })
  await api('/me/devices', {
    method: 'POST',
    body: { platform: 'web', pushToken: JSON.stringify(subscription), locale: lang },
    schema: z.unknown(),
  })
  return 'subscribed'
}
