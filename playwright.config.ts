import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:5175',
    viewport: { width: 390, height: 844 },
    // Uses the locally installed Chrome; run `pnpm exec playwright install chromium` and drop this to use the bundled one.
    channel: 'chrome',
  },
  webServer: { command: 'pnpm dev', url: 'http://localhost:5175', reuseExistingServer: true },
})
