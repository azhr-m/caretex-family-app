import type { NotificationKind } from '@/api/schemas/account'
import { api } from '@/api/client'
import { z } from 'zod'

/**
 * Lock-screen push (`04-api-contracts.md` §13). The body is always one of a fixed set of generic
 * sentences per kind, so a push can never carry names, medical terms, subjects or message text.
 */
export type PushBodyKind = 'message' | 'document' | 'event' | 'update' | 'request'

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

export const PUSH_BODIES: Record<'en' | 'he', Record<PushBodyKind, string>> = {
  en: {
    message: 'You have a new message',
    document: 'You have a new document waiting',
    event: 'You have a new event',
    update: 'You have a new update',
    request: 'There is an update on your request',
  },
  he: {
    message: 'יש לכם הודעה חדשה',
    document: 'יש לכם מסמך חדש שממתין',
    event: 'יש לכם אירוע חדש',
    update: 'יש לכם עדכון חדש',
    request: 'יש עדכון בבקשה שלכם',
  },
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
 * Web Push subscription stub: does nothing until a VAPID key is configured and the app's own
 * service worker exists (Phase 6 PWA). Then it subscribes and registers the device with the API.
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
