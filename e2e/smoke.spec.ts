import { expect, test } from '@playwright/test'

const combos = [
  { lang: 'en', theme: 'light' },
  { lang: 'he', theme: 'dark' },
] as const

for (const width of [320, 390, 430]) {
  for (const { lang, theme } of combos) {
    test(`/dev/components has no horizontal overflow · ${width}px · ${lang} · ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 })
      await page.addInitScript(
        ([l, t]) =>
          localStorage.setItem(
            'caretex.prefs',
            JSON.stringify({ state: { language: l, theme: t }, version: 0 }),
          ),
        [lang, theme],
      )
      await page.goto('/dev/components')
      await expect(page.locator('html')).toHaveAttribute('dir', lang === 'he' ? 'rtl' : 'ltr')
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
      const { scroll, client } = await page.evaluate(() => ({
        scroll: document.documentElement.scrollWidth,
        client: document.documentElement.clientWidth,
      }))
      expect(scroll).toBeLessThanOrEqual(client)
    })
  }
}

test('authenticated routes redirect to login when signed out', async ({ page }) => {
  await page.goto('/r/demo/home')
  await expect(page).toHaveURL(/\/login\?redirect=/)
})
