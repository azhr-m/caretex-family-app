import { useEffect } from 'react'
import { useDevStore } from '@/stores/dev'
import { useSessionStore } from '@/stores/session'

const ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'wheel', 'touchstart', 'scroll'] as const
const DEFAULT_MINUTES = Number(import.meta.env.VITE_IDLE_MINUTES) || 10

export function idleTimeoutMs(devSeconds: number | null) {
  return import.meta.env.DEV && devSeconds ? devSeconds * 1000 : DEFAULT_MINUTES * 60_000
}

/**
 * Locks the session after the idle timeout. Any pointer/key/scroll resets the timer (throttled to 1 s);
 * returning from the background after the timeout locks immediately.
 */
export function useIdleLock() {
  const devSeconds = useDevStore((s) => s.idleSeconds)
  const timeout = idleTimeoutMs(devSeconds)

  useEffect(() => {
    const store = useSessionStore
    store.getState().touch()
    let lastTouch = 0

    const onActivity = () => {
      const now = Date.now()
      if (now - lastTouch < 1000 || store.getState().locked) return
      lastTouch = now
      store.getState().touch()
    }
    const check = () => {
      const s = store.getState()
      if (s.accessToken && !s.locked && Date.now() - s.lastActivityAt >= timeout) s.lock()
    }
    const onVisibility = () => document.visibilityState === 'visible' && check()

    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, onActivity, { passive: true, capture: true }))
    document.addEventListener('visibilitychange', onVisibility)
    const id = setInterval(check, Math.min(5000, Math.max(1000, timeout / 6)))
    return () => {
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, onActivity, { capture: true }))
      document.removeEventListener('visibilitychange', onVisibility)
      clearInterval(id)
    }
  }, [timeout])
}
