import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { useDevStore } from '@/stores/dev'
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

const BUNDLES: Record<Language, () => Promise<{ default: Record<string, Record<string, unknown>> }>> = {
  en: () => import('../locales/en'),
  he: () => import('../locales/he'),
}

/** Adds a language's namespaces to i18next (once). The app waits for this before rendering or switching. */
export async function loadLanguage(lang: Language) {
  if (i18n.hasResourceBundle(lang, 'common')) return
  const { default: files } = await BUNDLES[lang]()
  for (const [path, data] of Object.entries(files)) {
    const ns = path.match(/(\w+)\.json$/)?.[1]
    if (ns) i18n.addResourceBundle(lang, ns, data, true, true)
  }
}

export async function setAppLanguage(lang: Language) {
  await loadLanguage(lang)
  await i18n.changeLanguage(lang)
}

/** Loads the detected language before the first render. */
export const i18nReady = () => setAppLanguage(detectLanguage())

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

export const longString = (value: string) => `⟦${value} ${value}⟧`

if (import.meta.env.DEV) {
  i18n.use({
    type: 'postProcessor',
    name: 'longStrings',
    process: (value: string) => (useDevStore.getState().longStrings && value ? longString(value) : value),
  })
  useDevStore.subscribe((s, prev) => {
    if (s.longStrings !== prev.longStrings) void i18n.changeLanguage(i18n.language)
  })
}

i18n.use(initReactI18next).init({
  resources: {},
  partialBundledLanguages: true,
  lng: detectLanguage(),
  fallbackLng: 'en',
  supportedLngs: ['en', 'he'],
  ns: NAMESPACES,
  defaultNS: 'common',
  interpolation: { escapeValue: false },
  returnNull: false,
  postProcess: import.meta.env.DEV ? ['longStrings'] : false,
})

applyToDocument(i18n.language)
i18n.on('languageChanged', applyToDocument)

usePrefsStore.subscribe((s, prev) => {
  if (s.language && s.language !== prev.language) void setAppLanguage(s.language)
})

export default i18n
