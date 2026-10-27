import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page, type TestInfo } from '@playwright/test'
import { APP_ROUTES, PUBLIC_ROUTES, findLayoutProblems, login, prepare, settle, type Lang, type Theme } from './helpers'

// Each test walks every route once; Playwright runs the tests in parallel workers.
test.describe.configure({ mode: 'parallel' })

async function eachRoute(page: Page, visit: (route: string) => Promise<void>) {
  for (const route of PUBLIC_ROUTES) {
    await page.goto(route)
    await settle(page)
    await visit(route)
  }
  await login(page)
  for (const route of APP_ROUTES) {
    await page.goto(route)
    await settle(page)
    await visit(route)
  }
}

const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

for (const { lang, theme } of [
  { lang: 'en', theme: 'light' },
  { lang: 'he', theme: 'dark' },
] as { lang: Lang; theme: Theme }[]) {
  test(`axe: no serious or critical violations on any route · ${lang} · ${theme}`, async ({ page }) => {
    test.setTimeout(600_000)
    await prepare(page, { lang, theme })
    await eachRoute(page, async (route) => {
      const { violations } = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze()
      const serious = violations
        .filter((v) => v.impact === 'serious' || v.impact === 'critical')
        .map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`)
      expect.soft(serious, route).toEqual([])
    })
  })
}

async function shot(page: Page, info: TestInfo, route: string) {
  const name = route.replace(/^\//, '').replace(/[/?=]/g, '_') || 'root'
  await info.attach(name, { body: await page.screenshot(), contentType: 'image/png' })
}

for (const size of [
  { width: 320, height: 640 },
  { width: 430, height: 932 },
]) {
  test(`smoke shots of every route at ${size.width}×${size.height}: nothing sticks out or is cut off`, async ({ page }, info) => {
    test.setTimeout(600_000)
    await page.setViewportSize(size)
    await prepare(page, { lang: size.width === 320 ? 'he' : 'en' })
    await eachRoute(page, async (route) => {
      await shot(page, info, route)
      expect.soft(await findLayoutProblems(page), route).toEqual([])
    })
  })
}

for (const lang of ['en', 'he'] as Lang[]) {
  test(`long strings (every translation doubled): no sideways scroll or clipped text on any route · ${lang}`, async ({ page }, info) => {
    test.setTimeout(600_000)
    await prepare(page, { lang, longStrings: true })
    await eachRoute(page, async (route) => {
      await expect(page.getByText(/⟦/).first()).toBeVisible()
      const problems = await findLayoutProblems(page)
      if (problems.length) await shot(page, info, route)
      expect.soft(problems, route).toEqual([])
    })
  })
}
