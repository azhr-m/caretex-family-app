import { expect, test, type Page } from '@playwright/test'
import { login, prepare, settle, type Lang } from './helpers'

// Baselines live in e2e/visual.spec.ts-snapshots and are platform-specific (fonts render differently per
// OS); CI runs on Windows to match them. Refresh after an intended UI change: pnpm e2e:update e2e/visual.spec.ts
test.describe.configure({ mode: 'parallel' })

const NOW = new Date('2026-10-14T09:41:00+03:00')
const M = '/r/res_miriam'

const SCREENS = [
  { name: 'home', url: `${M}/home` },
  { name: 'resident', url: `${M}/resident/general` },
  { name: 'inquiry-thread', url: `${M}/staff/inq_2041` },
  { name: 'document-signing', url: `${M}/more/documents/doc_flu` },
  { name: 'survey-question', url: `${M}/more/surveys/sv_family_2026/q/q1` },
  { name: 'event-rsvp', url: `${M}/more/events/ev_hanukkah/rsvp` },
  { name: 'settings', url: `${M}/more/settings` },
]

async function snap(page: Page, name: string) {
  await settle(page)
  await expect(page).toHaveScreenshot(`${name}.png`, {
    mask: [page.getByRole('button', { name: /^Dev/ })],
    maxDiffPixelRatio: 0.01,
  })
}

for (const lang of ['en', 'he'] as Lang[]) {
  for (const theme of ['light', 'dark'] as const) {
    test(`visual: 8 variant screens · ${lang} · ${theme}`, async ({ page }) => {
      test.setTimeout(180_000)
      await page.clock.setFixedTime(NOW)
      await prepare(page, { lang, theme })
      await page.goto('/login')
      await snap(page, `login-${lang}-${theme}`)
      await login(page)
      for (const s of SCREENS) {
        await page.goto(s.url)
        await snap(page, `${s.name}-${lang}-${theme}`)
      }
    })
  }
}
