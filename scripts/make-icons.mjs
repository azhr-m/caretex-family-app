// Renders the PWA icons in public/icons from the favicon heart. Run: node scripts/make-icons.mjs
import { mkdirSync } from 'node:fs'
import { chromium } from '@playwright/test'

const NAVY = '#1F2A44'
const HEART = 'M32 46s-14-8.2-14-18a8 8 0 0 1 14-5.3A8 8 0 0 1 46 28c0 9.8-14 18-14 18z'

// `scale` shrinks the heart around the centre; maskable icons keep it inside the 80% safe zone.
const svg = ({ rounded, scale, bg = NAVY, fg = '#fff' }) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="100%" height="100%">
  ${bg ? `<rect width="64" height="64" rx="${rounded ? 14 : 0}" fill="${bg}"/>` : ''}
  <g transform="translate(32 33) scale(${scale}) translate(-32 -33)"><path d="${HEART}" fill="${fg}"/></g>
</svg>`

const icons = [
  { file: 'icon-192.png', size: 192, rounded: true, scale: 1.25 },
  { file: 'icon-512.png', size: 512, rounded: true, scale: 1.25 },
  { file: 'maskable-512.png', size: 512, rounded: false, scale: 1 },
  { file: 'apple-touch-icon.png', size: 180, rounded: false, scale: 1.2 },
  { file: 'badge-96.png', size: 96, rounded: false, scale: 1.6, bg: null },
]

mkdirSync('public/icons', { recursive: true })
const browser = await chromium.launch({ channel: 'chrome' })
const page = await browser.newPage()
for (const icon of icons) {
  await page.setViewportSize({ width: icon.size, height: icon.size })
  await page.setContent(`<html><body style="margin:0;background:transparent">${svg(icon)}</body></html>`)
  await page.screenshot({ path: `public/icons/${icon.file}`, omitBackground: true })
  console.log(`public/icons/${icon.file}`)
}
await browser.close()
