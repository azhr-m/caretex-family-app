import { expect, test, type Page } from '@playwright/test'

async function signedIn(page: Page, lang: 'en' | 'he' = 'en', scenario = 'normal') {
  await page.addInitScript(
    ([l, s]) => {
      if (sessionStorage.getItem('e2e.init')) return
      sessionStorage.setItem('e2e.init', '1')
      localStorage.setItem('caretex.prefs', JSON.stringify({ state: { language: l, theme: 'light' }, version: 0 }))
      localStorage.setItem(
        'caretex.dev',
        JSON.stringify({ state: { scenario: s, panelOpen: false, idleSeconds: null }, version: 0 }),
      )
    },
    [lang, scenario] as const,
  )
  await page.goto('/login')
  await page.locator('input').first().fill('050-123-4127')
  await page.locator('input[type=password]').fill('Dana!2026')
  await page.locator('button[type=submit]').click()
  await page.waitForURL(/select-resident|\/home/)
}

const noOverflow = async (page: Page) =>
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)

test('home shows every section with mock-clock data', async ({ page }) => {
  await signedIn(page)
  await page.goto('/r/res_miriam/home')
  await expect(page.getByRole('heading', { name: 'Good morning, Dana' })).toBeVisible()
  await expect(page.getByText(/Wednesday, \W*14\.10\.2026/)).toBeVisible()
  await expect(page.getByText(/Since your last visit · \W*08\.10\.2026/i)).toBeVisible()
  await expect(page.getByText('5 new')).toBeVisible()
  await expect(page.getByText('5 to do')).toBeVisible()
  await expect(page.getByRole('heading', { name: /Latest update/i })).toBeVisible()
  await expect(page.getByText('Doctor visit · Dr. Avi Shapiro')).toBeVisible()
  await expect(page.getByText(/Miriam's day · Today/i)).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'Main navigation' }).getByLabel(/Contact Staff, 2 new/)).toBeVisible()
  await noOverflow(page)
})

test('needs-attention cards and quick actions route to later-phase screens', async ({ page }) => {
  await signedIn(page)
  const cases: [string, RegExp][] = [
    ['Sign', /\/more\/documents\/doc_flu$/],
    ['Read', /\/more\/feed\/nl_october$/],
    ['Start', /\/more\/surveys\/sv_family_2026$/],
    ['RSVP', /\/more\/events\/ev_hanukkah$/],
    ['Reply', /\/staff\/inq_2041$/],
  ]
  for (const [cta, url] of cases) {
    await page.goto('/r/res_miriam/home')
    await page.getByRole('link', { name: cta, exact: true }).click()
    await expect(page).toHaveURL(url)
    await expect(page.getByText(/Coming in Phase/)).toBeVisible()
  }
  const quick: [RegExp, RegExp][] = [
    [/New inquiry/, /\/staff\/new$/],
    [/Service request/, /\/more\/services\/new$/],
    [/Documents/, /\/more\/documents$/],
    [/Events/, /\/more\/feed$/],
  ]
  for (const [name, url] of quick) {
    await page.goto('/r/res_miriam/home')
    await page.getByRole('link', { name }).click()
    await expect(page).toHaveURL(url)
  }
})

test('Avraham: care plan has no permission, medical not yet shared, segments show lock / hourglass', async ({
  page,
}) => {
  await signedIn(page)
  await page.goto('/r/res_avraham/resident/general')
  const segments = page.getByRole('navigation', { name: 'Resident sections' })
  await expect(segments.getByRole('link', { name: 'Care plan, no permission' })).toBeVisible()
  await expect(segments.getByRole('link', { name: 'Medical, not yet shared' })).toBeVisible()
  await expect(segments.getByRole('link', { name: 'Care plan, no permission' }).locator('svg.lucide-lock')).toHaveCount(1)
  await expect(segments.getByRole('link', { name: 'Medical, not yet shared' }).locator('svg.lucide-hourglass')).toHaveCount(1)

  await segments.getByRole('link', { name: 'Care plan, no permission' }).click()
  await expect(page.getByRole('heading', { name: "You don't have permission to view this section" })).toBeVisible()
  await expect(page.getByText("Avraham's care plan is shared only with his legal guardian.", { exact: false })).toBeVisible()
  await expect(page.getByRole('link', { name: 'View my permissions' })).toHaveAttribute('href', /more\/permissions\?resident=res_avraham/)

  await segments.getByRole('link', { name: 'Medical, not yet shared' }).click()
  await expect(page.getByRole('heading', { name: 'Not yet shared by the care center' })).toBeVisible()
  await expect(page.getByText('Waiting for the care center')).toBeVisible()
  await page.getByRole('link', { name: 'Back to general info' }).click()
  await expect(page).toHaveURL(/\/resident\/general$/)
})

test('Miriam: every segment renders, update detail marks it seen', async ({ page }) => {
  await signedIn(page)
  await page.goto('/r/res_miriam/resident')
  await expect(page).toHaveURL(/\/resident\/general$/)
  await expect(page.getByText(/03\.05\.1939\W*\(age 87\)/)).toBeVisible()
  await expect(page.getByRole('link', { name: /^Call/ })).toHaveAttribute('href', 'tel:+97235550142')

  await page.getByRole('link', { name: /Updates/ }).first().click()
  await expect(page.getByText('Personal updates from the staff about Miriam, newest first.')).toBeVisible()
  await page.getByRole('link', { name: /Miriam joined the morning music group/ }).click()
  await expect(page.getByRole('heading', { name: 'Miriam joined the morning music group' })).toBeVisible()
  await expect(page.getByText(/Shared by the care center on/)).toBeVisible()
  await page.getByRole('button', { name: 'Back' }).click()
  // Seen: the music update loses its "New" chip once the list refetches.
  await expect(
    page.getByRole('link', { name: /Miriam joined the morning music group/ }).getByText('New', { exact: true }),
  ).toHaveCount(0)

  await page.goto('/r/res_miriam/resident/medical')
  await expect(page.getByText('3 active')).toBeVisible()
  await expect(page.getByText('Allergy', { exact: true })).toBeVisible()
  await page.goto('/r/res_miriam/resident/care-plan')
  await expect(page.getByRole('heading', { name: "Miriam's care plan, in brief" })).toBeVisible()
  await expect(page.getByText('On track')).toBeVisible()
  await page.goto('/r/res_miriam/resident/day')
  await expect(page.getByText('Now', { exact: true })).toBeVisible()
  await page.getByRole('link', { name: 'Next day' }).click()
  await expect(page).toHaveURL(/date=2026-10-15/)
  await expect(page.getByRole('link', { name: 'Next day' })).toHaveCount(0)
})

async function openViewer(page: Page, lang: 'en' | 'he') {
  await signedIn(page, lang)
  await page.goto('/r/res_miriam/resident/updates/upd_music')
  await page.locator('a[href$="/photos/1"]').click()
  await expect(page).toHaveURL(/photos\/1$/)
  await expect(page.getByText(/^1 \/ 3$/)).toBeVisible()
}

async function swipe(page: Page, fromX: number, toX: number) {
  const stage = page.locator('.touch-none').first()
  const box = (await stage.boundingBox())!
  const y = box.y + box.height / 2
  await page.mouse.move(box.x + fromX, y)
  await page.mouse.down()
  await page.mouse.move(box.x + (fromX + toX) / 2, y, { steps: 4 })
  await page.mouse.move(box.x + toX, y, { steps: 4 })
  await page.mouse.up()
}

test('photo viewer: buttons, swipe, counter, close', async ({ page }) => {
  await openViewer(page, 'en')
  await expect(page.getByRole('button', { name: 'Previous' })).toBeDisabled()
  await page.getByRole('button', { name: 'Next' }).click()
  await expect(page.getByText(/^2 \/ 3$/)).toBeVisible()
  await swipe(page, 300, 60) // swipe left → next in LTR
  await expect(page.getByText(/^3 \/ 3$/)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Next' })).toBeDisabled()
  await swipe(page, 60, 300) // swipe right → previous
  await expect(page.getByText(/^2 \/ 3$/)).toBeVisible()
  await page.getByRole('button', { name: 'Close' }).click()
  await expect(page).toHaveURL(/updates\/upd_music$/)
})

test('photo viewer: swipe direction mirrors in RTL; Escape closes', async ({ page }) => {
  await openViewer(page, 'he')
  await swipe(page, 60, 300) // swipe right → next in RTL
  await expect(page.getByText(/^2 \/ 3$/)).toBeVisible()
  await swipe(page, 300, 60)
  await expect(page.getByText(/^1 \/ 3$/)).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page).toHaveURL(/updates\/upd_music$/)
})

test('switching resident on the Resident tab refetches and resets scroll', async ({ page }) => {
  await signedIn(page)
  await page.goto('/r/res_miriam/resident/general')
  await expect(page.getByText('Dana Cohen (you)')).toBeVisible()
  await page.locator('#app-main').evaluate((el) => el.scrollTo(0, 400))
  await page.getByRole('button', { name: /Switch resident/ }).click()
  await page.getByRole('dialog').getByRole('button', { name: /Avraham Cohen/ }).click()
  await expect(page).toHaveURL(/res_avraham\/resident\/general$/)
  await expect(page.getByText('Yossi Cohen')).toBeVisible()
  expect(await page.locator('#app-main').evaluate((el) => el.scrollTop)).toBe(0)
})

test('empty scenario shows the empty states', async ({ page }) => {
  await signedIn(page, 'en', 'emptyEverything')
  await page.goto('/r/res_miriam/home')
  await expect(page.getByText('Nothing new since your last visit')).toBeVisible()
  await expect(page.getByText("You're all caught up")).toBeVisible()
  await page.goto('/r/res_miriam/resident/updates')
  await expect(page.getByRole('heading', { name: 'No updates yet' })).toBeVisible()
})

for (const width of [320, 430]) {
  test(`no horizontal overflow on Phase 2 screens at ${width}px (he)`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 })
    await signedIn(page, 'he')
    for (const path of ['home', 'resident/general', 'resident/updates', 'resident/medical', 'resident/care-plan', 'resident/day']) {
      await page.goto(`/r/res_miriam/${path}`)
      await page.waitForLoadState('networkidle')
      await noOverflow(page)
    }
  })
}
