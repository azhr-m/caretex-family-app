// Lighthouse (mobile) on the production build with mocks off. Run `pnpm build:prod` first.
// Fails unless every audited route scores performance ≥ 90 and accessibility 100.
import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { chromium } from '@playwright/test'
import lighthouse from 'lighthouse'

const PORT = 4174
const ROUTES = ['/login', '/forgot', '/welcome/language']
const MIN = { performance: 0.9, accessibility: 1 }
const RUNS = 3 // best of three: a single mobile run on a shared CI machine is noisy

const vite = join(dirname(createRequire(import.meta.url).resolve('vite/package.json')), 'bin/vite.js')
const server = spawn(process.execPath, [vite, 'preview', '--outDir', 'dist-prod', '--port', String(PORT), '--strictPort'], {
  stdio: 'ignore',
})

async function waitForServer() {
  for (let i = 0; i < 50; i++) {
    try {
      if ((await fetch(`http://localhost:${PORT}/`)).ok) return
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 200))
  }
  throw new Error('vite preview did not start')
}

const browser = await chromium.launch({ channel: 'chrome', args: ['--remote-debugging-port=9223'] })
let failed = false
try {
  await waitForServer()
  mkdirSync('lighthouse-report', { recursive: true })
  for (const route of ROUTES) {
    const best = { performance: 0, accessibility: 0 }
    for (let run = 0; run < RUNS; run++) {
      const result = await lighthouse(`http://localhost:${PORT}${route}`, {
        port: 9223,
        output: 'html',
        logLevel: 'error',
        onlyCategories: ['performance', 'accessibility'],
      })
      const { categories } = result.lhr
      if (categories.performance.score >= best.performance) {
        writeFileSync(`lighthouse-report/${route.slice(1).replaceAll('/', '-')}.html`, result.report)
      }
      best.performance = Math.max(best.performance, categories.performance.score)
      best.accessibility = Math.max(best.accessibility, categories.accessibility.score)
      if (best.performance >= MIN.performance && best.accessibility >= MIN.accessibility) break
    }
    const ok = best.performance >= MIN.performance && best.accessibility >= MIN.accessibility
    if (!ok) failed = true
    console.log(
      `${ok ? 'PASS' : 'FAIL'}  ${route.padEnd(20)} performance ${Math.round(best.performance * 100)}  accessibility ${Math.round(best.accessibility * 100)}`,
    )
  }
} finally {
  await browser.close()
  server.kill()
}
process.exit(failed ? 1 : 0)
