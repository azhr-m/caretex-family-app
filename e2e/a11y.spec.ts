import { expect, test } from '@playwright/test'
import { login, prepare, settle } from './helpers'

test('login: Tab order follows the screen and every stop shows a focus ring', async ({ page }) => {
  await prepare(page)
  await page.goto('/login')
  await settle(page)
  const stops: string[] = []
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press('Tab')
    const stop = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null
      if (!el || el === document.body) return null
      const style = getComputedStyle(el)
      const name = el.getAttribute('aria-label') ?? (el as HTMLInputElement).labels?.[0]?.textContent ?? el.textContent ?? ''
      const outline = style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) >= 2
      // Text fields show focus as a 2px primary border on the field box instead of an outline.
      const box = el.matches('input, textarea') ? (el.parentElement ?? el) : null
      const border = box ? [el, box].some((b) => parseFloat(getComputedStyle(b).borderTopWidth) >= 2) : false
      return { name: name.trim(), ring: outline || border }
    })
    if (!stop) break
    expect(stop.ring, `focus ring on "${stop.name}"`).toBe(true)
    stops.push(stop.name)
  }
  const at = (re: RegExp) => stops.findIndex((s) => re.test(s))
  expect(at(/Phone number or username/)).toBeGreaterThanOrEqual(0)
  expect(at(/Phone number or username/)).toBeLessThan(at(/^Password/))
  expect(at(/^Password/)).toBeLessThan(at(/Sign in/))
})

test('form errors are announced and point at their field', async ({ page }) => {
  await prepare(page)
  await page.goto('/login')
  await page.getByRole('button', { name: 'Sign in' }).click()
  const id = page.getByLabel('Phone number or username')
  await expect(id).toBeFocused()
  await expect(id).toHaveAttribute('aria-invalid', 'true')
  const describedBy = await id.getAttribute('aria-describedby')
  await expect(page.locator(`[id="${describedBy}"]`).getByRole('alert')).toHaveText('Enter your phone number or username')
})

test('header and tab badges have spoken labels', async ({ page }) => {
  await prepare(page)
  await login(page)
  await page.goto('/r/res_miriam/home')
  await settle(page)
  await expect(page.getByRole('button', { name: /^Alerts ?, 4 unread notifications$/ })).toBeVisible()
  const nav = page.getByRole('navigation', { name: 'Main navigation' })
  await expect(nav.getByRole('link', { name: /^Resident ?, 2 new$/ })).toBeVisible()
  await expect(nav.getByRole('link', { name: /^More ?, 3 new$/ })).toBeVisible()
  // The active tab carries no badge and says it is the current page.
  await expect(nav.getByRole('link', { name: 'Home', exact: true })).toHaveAttribute('aria-current', 'page')
})

test('toasts appear inside a polite live region', async ({ page }) => {
  await prepare(page)
  await login(page)
  await page.goto('/r/res_miriam/more/settings')
  await settle(page)
  await page.getByRole('switch').first().click()
  await expect(page.locator('section[aria-live="polite"]').getByText(/saved/i).first()).toBeVisible()
})

test('prefers-reduced-motion turns animations and transitions off', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await prepare(page)
  await page.goto('/login')
  const button = page.getByRole('button', { name: 'Sign in' })
  await expect(button).toBeVisible()
  const duration = await button.evaluate((el) => getComputedStyle(el).transitionDuration)
  expect(parseFloat(duration)).toBeLessThanOrEqual(0.001)
})
