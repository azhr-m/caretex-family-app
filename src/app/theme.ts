import { useEffect, useSyncExternalStore } from 'react'
import { usePrefsStore, type ThemePreference } from '@/stores/prefs'

export type ResolvedTheme = 'light' | 'dark'

const THEME_COLOR: Record<ResolvedTheme, string> = { light: '#FCF8F1', dark: '#10141C' }
const query = () => window.matchMedia('(prefers-color-scheme: dark)')

function subscribeSystem(cb: () => void) {
  const mq = query()
  mq.addEventListener('change', cb)
  return () => mq.removeEventListener('change', cb)
}

export function useSystemTheme(): ResolvedTheme {
  return useSyncExternalStore(
    subscribeSystem,
    () => (query().matches ? 'dark' : 'light'),
    () => 'light',
  )
}

export function resolveTheme(pref: ThemePreference, system: ResolvedTheme): ResolvedTheme {
  return pref === 'system' ? system : pref
}

export function useResolvedTheme() {
  const pref = usePrefsStore((s) => s.theme)
  return resolveTheme(pref, useSystemTheme())
}

/** Keeps <html data-theme> and <meta name="theme-color"> in sync with the preference and the OS. */
export function useThemeEffect() {
  const theme = useResolvedTheme()
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[theme])
  }, [theme])
  return theme
}
