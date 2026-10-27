import { usePrefsStore } from '@/stores/prefs'
import i18n, { NAMESPACES } from './i18n'

describe('i18n', () => {
  afterEach(async () => {
    await i18n.changeLanguage('en')
  })

  it('loads every namespace in both languages', () => {
    for (const lang of ['en', 'he']) {
      for (const ns of NAMESPACES) expect(i18n.hasResourceBundle(lang, ns)).toBe(true)
    }
  })

  it('switches <html lang dir> when the stored preference changes', async () => {
    usePrefsStore.getState().setLanguage('he')
    await vi.waitFor(() => expect(document.documentElement.dir).toBe('rtl'))
    expect(document.documentElement.lang).toBe('he')
    expect(i18n.t('tabs.home')).toBe('בית')

    usePrefsStore.getState().setLanguage('en')
    await vi.waitFor(() => expect(document.documentElement.dir).toBe('ltr'))
  })

  it('uses Hebrew plural forms', async () => {
    await i18n.changeLanguage('he')
    expect(i18n.t('header.tabBadge', { count: 2 })).toBe('2 חדשים')
  })
})
