import { expect, test } from '@playwright/test'
import { prepare } from './helpers'

test('manifest is linked and its icons load', async ({ page, request }) => {
  await page.goto('/login')
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute('href', '/manifest.webmanifest')
  const manifest = await (await request.get('/manifest.webmanifest')).json()
  expect(manifest).toMatchObject({ name: 'CARETEX Family', start_url: '/', display: 'standalone' })
  expect(manifest.icons.map((i: { sizes: string }) => i.sizes)).toEqual(expect.arrayContaining(['192x192', '512x512']))
  expect(manifest.icons.some((i: { purpose: string }) => i.purpose === 'maskable')).toBe(true)
  for (const icon of manifest.icons) {
    const res = await request.get(icon.src)
    expect(res.ok(), icon.src).toBe(true)
    expect(res.headers()['content-type']).toContain('image/png')
  }
})

test('offline: the app shell still opens, and the service worker cached no API or media responses', async ({
  page,
  context,
}) => {
  await prepare(page)
  await page.goto('/login')
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined))
  await page.reload() // the worker now controls the page
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true)
  await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible()

  await context.setOffline(true)
  await page.reload()
  await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible()
  await page.goto('/forgot')
  await expect(page.getByRole('heading').first()).toBeVisible()
  await context.setOffline(false)

  const cached = await page.evaluate(async () => {
    const urls: string[] = []
    for (const name of await caches.keys()) {
      for (const req of await (await caches.open(name)).keys()) urls.push(new URL(req.url).pathname)
    }
    return urls
  })
  expect(cached).toContain('/index.html')
  expect(cached.filter((u) => /^\/(api|media)\//.test(u))).toEqual([])
  expect(cached.every((u) => u === '/index.html' || u.startsWith('/assets/') || u.startsWith('/icons/') || /^\/[\w.-]+$/.test(u))).toBe(true)
})
