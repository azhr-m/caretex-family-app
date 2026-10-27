import { defineConfig } from '@playwright/test'

const CI = !!process.env.CI

export default defineConfig({
  testDir: './e2e',
  retries: CI ? 1 : 0,
  // The route walks run in parallel with everything else; mock latency plus load needs more than 5 s.
  expect: { timeout: 10_000 },
  // No project name in baseline file names: the visual tests only run in the "app" project.
  snapshotPathTemplate: '{testDir}/{testFilePath}-snapshots/{arg}-{platform}{ext}',
  reporter: CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    viewport: { width: 390, height: 844 },
    // Uses the locally installed Chrome; run `pnpm exec playwright install chromium` and drop this to use the bundled one.
    channel: 'chrome',
  },
  projects: [
    // Everything else runs on the dev server with MSW mocks.
    { name: 'app', testIgnore: /pwa\.spec\.ts/, use: { baseURL: 'http://localhost:5175' } },
    // The service worker only exists in a production build with mocks off (MSW owns the scope otherwise).
    { name: 'pwa', testMatch: /pwa\.spec\.ts/, use: { baseURL: 'http://localhost:4176', serviceWorkers: 'allow' } },
  ],
  webServer: [
    { command: 'pnpm dev', url: 'http://localhost:5175', reuseExistingServer: !CI },
    {
      command: 'pnpm build:prod && pnpm exec vite preview --outDir dist-prod --port 4176 --strictPort',
      url: 'http://localhost:4176',
      reuseExistingServer: !CI,
      timeout: 180_000,
    },
  ],
})
