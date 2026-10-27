import { expect, test, type Page } from '@playwright/test'

async function signedIn(page: Page, lang: 'en' | 'he' = 'en', theme: 'light' | 'dark' | 'system' = 'light') {
  await page.addInitScript(
    ([l, th]) => {
      if (sessionStorage.getItem('e2e.init')) return
      sessionStorage.setItem('e2e.init', '1')
      localStorage.setItem('caretex.prefs', JSON.stringify({ state: { language: l, theme: th }, version: 0 }))
      localStorage.setItem(
        'caretex.dev',
        JSON.stringify({ state: { scenario: 'normal', panelOpen: false, idleSeconds: null }, version: 0 }),
      )
    },
    [lang, theme] as const,
  )
  await page.goto('/login')
  await page.locator('input').first().fill('050-123-4127')
  await page.locator('input[type=password]').fill('Dana!2026')
  await page.locator('button[type=submit]').click()
  await page.waitForURL(/select-resident/)
}

/** Opens the notification center from Miriam's Home via the bell, staying inside the app. */
async function openNotifications(page: Page) {
  await page.goto('/r/res_miriam/home')
  await page.getByRole('button', { name: /Alerts ?, \d+ unread notifications?/ }).click()
  await expect(page.getByRole('heading', { name: 'Notifications' })).toBeVisible()
}

test('every notification deep-links to its screen, switching resident when needed', async ({ page }) => {
  test.setTimeout(120_000)
  await signedIn(page)
  const cases: [RegExp, RegExp, RegExp][] = [
    [/You have a new document to sign/, /\/r\/res_miriam\/more\/documents\/doc_flu$/, /Flu vaccine consent form 2026/],
    [/A reply to your inquiry has been received/, /\/r\/res_miriam\/staff\/inq_2038$/, /Evening medication time/],
    [/A new event has been published/, /\/r\/res_miriam\/more\/events\/ev_hanukkah$/, /Hanukkah family evening/],
    [/An appointment time has changed/, /\/r\/res_miriam\/calendar\/cal_dr_shapiro$/, /Doctor visit/],
    [/Your service request was handled/, /\/r\/res_miriam\/more\/services\/sr_1182$/, /Wardrobe door in Room 12/],
    [/A new survey is waiting for you/, /\/r\/res_miriam\/more\/surveys\/sv_family_2026$/, /Family satisfaction survey 2026/],
  ]
  for (const [row, url, heading] of cases) {
    await openNotifications(page)
    await page.getByRole('button', { name: row }).click()
    await expect(page).toHaveURL(url)
    await expect(page.getByRole('heading', { name: heading }).first()).toBeVisible()
  }

  // The Avraham update: opened from Miriam's context, it switches resident first.
  await openNotifications(page)
  const avraham = page.getByRole('button', { name: /A new personal update was shared.*07:40/ })
  await expect(avraham).toContainText('New')
  await avraham.click()
  await expect(page).toHaveURL(/\/r\/res_avraham\/resident\/updates\/upd_garden$/)
  await expect(page.getByText('Now viewing Avraham Cohen')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Morning in the garden' })).toBeVisible()
  const stored = await page.evaluate(() => localStorage.getItem('caretex.session') ?? '')
  expect(stored).toContain('res_avraham')
})

test('opening a notification marks it read; mark all read clears the bell', async ({ page }) => {
  await signedIn(page)
  await openNotifications(page)
  await page.getByRole('button', { name: /A new event has been published/ }).click()
  await page.goBack()
  await expect(page.getByRole('button', { name: /A new event has been published/ })).toContainText('Read')
  await page.getByRole('button', { name: 'Mark all read' }).click()
  await expect(page.getByText('All notifications were marked as read')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Mark all read' })).toHaveCount(0)
  await page.getByRole('button', { name: 'Back' }).click()
  await expect(page.getByRole('button', { name: 'Alerts', exact: true })).toBeVisible()
})

test('theme "System" follows OS changes live', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' })
  await signedIn(page)
  await page.goto('/r/res_miriam/more/settings')
  await page.getByRole('radio', { name: 'System' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  await page.emulateMedia({ colorScheme: 'dark' })
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await page.emulateMedia({ colorScheme: 'light' })
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  await page.getByRole('radio', { name: 'Dark' }).click()
  await page.emulateMedia({ colorScheme: 'light' })
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
})

test('changing language in Settings re-renders in place, keeps the route, no reload', async ({ page }) => {
  await signedIn(page)
  await page.goto('/r/res_miriam/more/settings')
  await page.evaluate(() => ((window as unknown as { __noReload: number }).__noReload = 1))
  const url = page.url()
  await page.getByRole('radio', { name: 'עברית' }).click()
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
  await expect(page.locator('html')).toHaveAttribute('lang', 'he')
  await expect(page.getByRole('heading', { name: 'הגדרות' })).toBeVisible()
  await expect(page.getByText('עדכונים על מרים')).toBeVisible()
  expect(page.url()).toBe(url)
  expect(await page.evaluate(() => (window as unknown as { __noReload?: number }).__noReload)).toBe(1)
  await page.getByRole('radio', { name: 'English' }).click()
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr')
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()
})

test('notification toggles save with a toast', async ({ page }) => {
  await signedIn(page)
  await page.goto('/r/res_miriam/more/settings')
  const surveys = page.getByRole('switch', { name: /Surveys/ })
  await expect(surveys).toHaveAttribute('aria-checked', 'false')
  await surveys.click()
  await expect(surveys).toHaveAttribute('aria-checked', 'true')
  await expect(page.getByText('Your notification preferences were updated')).toBeVisible()
  await expect(page.getByRole('switch', { name: /Message previews on lock screen/ })).toBeDisabled()
})

test('change password: wrong current password, then success; log out sheet', async ({ page }) => {
  await signedIn(page)
  await page.goto('/r/res_miriam/more/settings')
  await page.getByRole('button', { name: 'Change password' }).click()
  await expect(page).toHaveURL(/view=password/)
  await page.getByLabel('Current password').fill('wrong-one')
  await page.getByLabel('New password', { exact: true }).fill('Winter#2026')
  await page.getByLabel('Confirm new password').fill('Winter#2026')
  await page.getByRole('button', { name: 'Save new password' }).click()
  await expect(page.getByText('The current password is incorrect')).toBeVisible()
  await page.getByLabel('Current password').fill('Dana!2026')
  await page.getByRole('button', { name: 'Save new password' }).click()
  await expect(page.getByText('Password saved')).toBeVisible()
  await expect(page.getByText(/Last changed/)).toBeVisible()

  await page.getByRole('button', { name: 'Log out' }).click()
  const sheet = page.getByRole('dialog', { name: 'Log out of CARETEX Family?' })
  await sheet.getByRole('button', { name: 'Stay signed in' }).click()
  await expect(sheet).toBeHidden()
  await page.getByRole('button', { name: 'Log out' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Log out' }).click()
  await expect(page).toHaveURL(/\/login/)
})

test('service request: validate, send, detail, comment, cancel', async ({ page }) => {
  await signedIn(page)
  await page.goto('/r/res_miriam/more/services')
  await expect(page.getByText('SR-1193')).toBeVisible()
  await page.getByRole('button', { name: 'New request' }).click()
  await page.getByRole('button', { name: 'Send request' }).click()
  await expect(page.getByText('Choose the type of service', { exact: true })).toBeVisible()
  await expect(page.getByText('Describe the request', { exact: true }).last()).toBeVisible()
  await page.getByRole('radio', { name: 'Laundry / Clothing' }).click()
  await page.getByRole('radio', { name: 'Friday morning' }).click()
  await page.getByLabel('Describe the request').fill('Please label 6 new winter items.')
  await page.getByRole('button', { name: 'Send request' }).click()

  await expect(page.getByRole('heading', { name: 'Your request was sent' })).toBeVisible()
  await expect(page.getByText('SR-1194')).toBeVisible()
  await page.getByRole('link', { name: 'View request' }).click()
  await expect(page.getByText('Friday morning')).toBeVisible()
  await expect(page.getByRole('listitem').filter({ hasText: 'Request opened by you' })).toBeVisible()

  await page.getByRole('button', { name: 'Add a comment' }).click()
  const commentSheet = page.getByRole('dialog', { name: 'Add a comment' })
  await commentSheet.getByLabel('Comment').fill('I will bring them on Friday.')
  await commentSheet.getByRole('button', { name: 'Send comment' }).click()
  await expect(page.getByText('I will bring them on Friday.')).toBeVisible()

  await page.getByRole('button', { name: 'Cancel request' }).click()
  await page.getByRole('dialog', { name: 'Cancel this request?' }).getByRole('button', { name: 'Cancel request' }).click()
  await expect(page.getByText('This request was cancelled.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Cancel request' })).toHaveCount(0)
})

test('staff update while the request is open shows "changed" with Refresh', async ({ page }) => {
  await signedIn(page)
  await page.goto('/r/res_miriam/more/services/sr_1193')
  await expect(page.getByText('Assigned', { exact: true }).first()).toBeVisible()
  await page.getByRole('button', { name: /^Dev/ }).click()
  await page.getByRole('button', { name: 'Staff updates SR-1193' }).click()
  await expect(page.getByText('This information has changed since you opened it')).toBeVisible()
  await expect(page.getByText('The laundry team started on it')).toHaveCount(0)
  await page.getByRole('button', { name: 'Refresh' }).click()
  await expect(page.getByText('The laundry team started on it')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Cancel request' })).toHaveCount(0)
})

test('center info links, guide and permissions', async ({ page }) => {
  await signedIn(page)
  await page.goto('/r/res_miriam/more/center')
  await expect(page.getByRole('link', { name: 'Call', exact: true })).toHaveAttribute('href', 'tel:+97235550100')
  await expect(page.getByRole('link', { name: 'Email', exact: true })).toHaveAttribute('href', 'mailto:family@beithadar.co.il')
  await expect(page.getByRole('link', { name: 'Directions' })).toHaveAttribute('href', /google\.com\/maps/)
  await expect(page.getByText('Quiet hours (lobby and garden only)')).toBeVisible()
  await page.getByRole('link', { name: /Procedures and visit guide/ }).click()
  await expect(page.getByRole('link', { name: /Emergency \(Magen David Adom\)/ })).toHaveAttribute('href', 'tel:101')

  await page.goto('/r/res_miriam/more/permissions')
  await page.getByRole('radio', { name: 'Avraham Cohen' }).click()
  await expect(page).toHaveURL(/resident=res_avraham/)
  const carePlan = page.getByRole('listitem').filter({ hasText: 'Care plan' })
  await expect(carePlan).toContainText('Not allowed')
  await expect(carePlan).toContainText("Avraham's care plan is shared only with his legal guardian.")
  await expect(page.getByRole('listitem').filter({ hasText: 'Medical information' })).toContainText('Not yet shared')
})

test('payments: coming soon with a notify-me toggle', async ({ page }) => {
  await signedIn(page)
  await page.goto('/r/res_miriam/more/payments')
  await expect(page.getByRole('heading', { name: 'Accounts and Payments are coming soon' })).toBeVisible()
  const notify = page.getByRole('switch', { name: /Notify me when it's ready/ })
  await notify.click()
  await expect(notify).toHaveAttribute('aria-checked', 'true')
  await expect(page.getByRole('link', { name: '03-555-0170' })).toHaveAttribute('href', 'tel:+97235550170')
})

for (const width of [320, 430]) {
  test(`no horizontal overflow on Phase 5 screens at ${width}px (he)`, async ({ page }) => {
    test.setTimeout(90_000)
    test.setTimeout(120_000)
    await page.setViewportSize({ width, height: 800 })
    await signedIn(page, 'he')
    for (const path of [
      'more/services',
      'more/services/new',
      'more/services/sr_1193',
      'more/center',
      'more/center/guide',
      'more/permissions',
      'more/payments',
      'more/settings',
      'more/settings?view=password',
      'notifications',
    ]) {
      await page.goto(`/r/res_miriam/${path}`)
      await page.waitForLoadState('networkidle')
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), path).toBe(true)
    }
  })
}

test('a tapped push opens after sign-in and deep-links to its notification, switching resident', async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('e2e.init')) return
    sessionStorage.setItem('e2e.init', '1')
    localStorage.setItem('caretex.prefs', JSON.stringify({ state: { language: 'en', theme: 'light' }, version: 0 }))
  })
  await page.goto('/open/notification/n_103')
  await expect(page).toHaveURL(/\/login\?redirect=/)
  await page.getByLabel('Phone number or username').fill('050-123-4127')
  await page.getByLabel('Password', { exact: true }).fill('Dana!2026')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page).toHaveURL(/\/r\/res_avraham\/resident\/updates\/upd_garden/)
})
