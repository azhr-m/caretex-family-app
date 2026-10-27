/* global __PRECACHE__, __VERSION__, __PUSH_BODIES__ */
// App-shell service worker. vite.config.ts fills in the placeholders at build time.
// It serves only the precached build files (and index.html when offline). API calls, media and
// anything else go straight to the network and are never cached, so no resident data is stored.

const CACHE = `caretex-shell-${__VERSION__}`
const PRECACHE = __PRECACHE__
const SHELL = new Set(PRECACHE)
const ALLOWED_BODIES = new Set(Object.values(__PUSH_BODIES__).flatMap((byKind) => Object.values(byKind)))
const TITLE = 'CARETEX Family'

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) => Promise.all(names.filter((n) => n.startsWith('caretex-') && n !== CACHE).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match('/index.html')))
    return
  }
  if (SHELL.has(url.pathname)) {
    event.respondWith(caches.match(url.pathname).then((hit) => hit ?? fetch(request)))
  }
})

// Defence in depth: a body outside the fixed generic list is replaced, so free text never reaches a lock screen.
self.addEventListener('push', (event) => {
  let payload
  try {
    payload = event.data ? event.data.json() : {}
  } catch {
    payload = {}
  }
  const lang = (self.navigator.language || 'en').toLowerCase().startsWith('he') ? 'he' : 'en'
  const body = ALLOWED_BODIES.has(payload.body) ? payload.body : __PUSH_BODIES__[lang].update
  const notificationId = typeof payload.data?.notificationId === 'string' ? payload.data.notificationId : null
  event.waitUntil(
    self.registration.showNotification(TITLE, {
      body,
      tag: 'caretex',
      data: { notificationId },
      icon: '/icons/icon-192.png',
      badge: '/icons/badge-96.png',
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const id = event.notification.data?.notificationId
  const target = id ? `/open/notification/${encodeURIComponent(id)}` : '/'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      const open = windows.find((w) => new URL(w.url).origin === self.location.origin)
      if (!open) return clients.openWindow(target)
      open.postMessage({ type: 'caretex:open', url: target })
      return open.focus()
    }),
  )
})
