import i18n, { type Resource } from 'i18next'
import { initReactI18next } from 'react-i18next'
import { usePrefsStore, type Language } from '@/stores/prefs'

export const NAMESPACES = [
  'common',
  'auth',
  'home',
  'resident',
  'staff',
  'calendar',
  'documents',
  'surveys',
  'feed',
  'services',
  'center',
  'settings',
  'notifications',
  'states',
  'validation',
] as const

const files = import.meta.glob<Record<string, unknown>>('../locales/*/*.json', {
  eager: true,
  import: 'default',
})

const resources: Resource = {}
for (const [path, data] of Object.entries(files)) {
  const [, lang, ns] = path.match(/locales\/(\w+)\/(\w+)\.json$/) ?? []
  if (!lang || !ns) continue
  resources[lang] ??= {}
  resources[lang][ns] = data
}

export function detectLanguage(): Language {
  const stored = usePrefsStore.getState().language
  if (stored) return stored
  const device = typeof navigator === 'undefined' ? [] : (navigator.languages ?? [navigator.language])
  return device.some((l) => l?.toLowerCase().startsWith('he') || l?.toLowerCase().startsWith('iw'))
    ? 'he'
    : 'en'
}

export const dirOf = (lang: string) => (lang === 'he' ? 'rtl' : 'ltr')

function applyToDocument(lang: string) {
  if (typeof document === 'undefined') return
  document.documentElement.lang = lang
  document.documentElement.dir = dirOf(lang)
}

i18n.use(initReactI18next).init({
  resources,
  lng: detectLanguage(),
  fallbackLng: 'en',
  supportedLngs: ['en', 'he'],
  ns: NAMESPACES,
  defaultNS: 'common',
  interpolation: { escapeValue: false },
  returnNull: false,
})

applyToDocument(i18n.language)
i18n.on('languageChanged', applyToDocument)

usePrefsStore.subscribe((s, prev) => {
  if (s.language && s.language !== prev.language) void i18n.changeLanguage(s.language)
})

export default i18n
