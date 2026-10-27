import { expect, test, type Page } from '@playwright/test'

async function signedIn(page: Page, lang: 'en' | 'he' = 'en') {
  await page.addInitScript((l) => {
    if (sessionStorage.getItem('e2e.init')) return
    sessionStorage.setItem('e2e.init', '1')
    localStorage.setItem('caretex.prefs', JSON.stringify({ state: { language: l, theme: 'light' }, version: 0 }))
    localStorage.setItem(
      'caretex.dev',
      JSON.stringify({ state: { scenario: 'normal', panelOpen: false, idleSeconds: null }, version: 0 }),
    )
  }, lang)
  await page.goto('/login')
  await page.locator('input').first().fill('050-123-4127')
  await page.locator('input[type=password]').fill('Dana!2026')
  await page.locator('button[type=submit]').click()
  await page.waitForURL(/select-resident/)
}

async function simulator(page: Page, mode: RegExp) {
  await page.getByRole('button', { name: /^Dev/ }).click()
  await page.getByRole('button', { name: mode }).click()
  await page.keyboard.press('Escape')
}

test('reply sent while offline queues, says so, and sends on reconnect', async ({ page }) => {
  await signedIn(page)
  await page.goto('/r/res_miriam/staff/inq_2041')
  await expect(page.getByRole('heading', { name: 'Winter clothing for Miriam' })).toBeVisible()

  await simulator(page, /Offline/)
  const box = page.getByRole('textbox', { name: 'Your reply' })
  await box.fill("Thanks Yael! I'll bring them on Friday, all labeled.")
  await page.getByRole('button', { name: 'Send', exact: true }).click()

  await expect(page.getByText("Will send when you're back online")).toBeVisible()
  await expect(page.getByText('Waiting to send')).toBeVisible()
  await expect(box).toHaveValue('')

  await simulator(page, /Normal/)
  await expect(page.getByText('Your reply was sent to Social work')).toBeVisible()
  await expect(page.getByText("Will send when you're back online")).toHaveCount(0)
  await expect(page.getByRole('article').filter({ hasText: "I'll bring them on Friday" })).toHaveCount(1)
  await expect(page.getByText('Status: In progress').last()).toBeVisible()
})

test('empty reply shows a validation message', async ({ page }) => {
  await signedIn(page)
  await page.goto('/r/res_miriam/staff/inq_2038')
  await page.getByRole('button', { name: 'Send', exact: true }).click()
  await expect(page.getByText('Write a reply before sending')).toBeVisible()
  await expect(page.getByRole('textbox', { name: 'Your reply' })).toHaveAttribute('aria-invalid', 'true')
})

test('search and filters live in the URL and survive reload', async ({ page }) => {
  await signedIn(page)
  await page.goto('/r/res_miriam/staff')
  await expect(page.getByText('INQ-2041')).toBeVisible()
  await page.getByRole('searchbox', { name: 'Search inquiries' }).fill('medication')
  await expect(page).toHaveURL(/q=medication/)
  await page.getByRole('radio', { name: /In progress/ }).click()
  await expect(page).toHaveURL(/status=in_progress/)
  await page.getByRole('button', { name: /All departments/ }).click()
  await page.getByRole('dialog').getByRole('radio', { name: 'Nursing' }).click()
  await expect(page).toHaveURL(/dept=nursing/)
  await expect(page.getByText('INQ-2038')).toBeVisible()
  await expect(page.getByText('INQ-2041')).toHaveCount(0)

  await page.reload()
  await expect(page.getByRole('searchbox', { name: 'Search inquiries' })).toHaveValue('medication')
  await expect(page.getByRole('radio', { name: /In progress/ })).toHaveAttribute('aria-checked', 'true')
  await expect(page.getByRole('button', { name: /Nursing/ })).toBeVisible()
  await expect(page.getByText('INQ-2038')).toBeVisible()
  await expect(page.getByText('INQ-2041')).toHaveCount(0)
})

test('no results names the query and clears everything', async ({ page }) => {
  await signedIn(page)
  await page.goto('/r/res_miriam/staff?q=hearing%20aid&dept=social_work')
  await expect(page.getByRole('heading', { name: 'No inquiries match your search' })).toBeVisible()
  await expect(page.getByText('We couldn\'t find "hearing aid" in Social work inquiries.', { exact: false })).toBeVisible()
  await page.getByRole('button', { name: 'Clear search and filters' }).click()
  await expect(page).not.toHaveURL(/q=|dept=/)
  await expect(page.getByRole('searchbox', { name: 'Search inquiries' })).toHaveValue('')
  await expect(page.getByText('INQ-2041')).toBeVisible()
})

test('new inquiry: department → message with attachment → sent → thread', async ({ page }) => {
  await signedIn(page)
  await page.goto('/r/res_miriam/staff')
  await page.getByRole('button', { name: 'New inquiry' }).click()
  const cont = page.getByRole('button', { name: 'Continue' })
  await expect(cont).toBeDisabled()
  await page.getByRole('radio', { name: /Physiotherapy/ }).click()
  await cont.click()
  await expect(page.getByText('Physiotherapy · Ward B')).toBeVisible()

  await page.getByRole('button', { name: 'Send inquiry' }).click()
  await expect(page.getByText('Enter a subject')).toBeVisible()
  await expect(page.getByText('Write a message')).toBeVisible()

  await page.getByLabel('Subject').fill('Exercises we can do during visits')
  await page.getByLabel('Message').fill('Which walking exercises are safe for us to do together in the corridor?')
  const fileInput = page.locator('input[type=file][multiple]')
  await fileInput.setInputFiles([
    { name: 'walking-plan.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 test') },
    { name: 'notes.docx', mimeType: 'application/msword', buffer: Buffer.from('x') },
  ])
  await expect(page.getByText("notes.docx can't be attached. Use JPG, PNG or PDF.")).toBeVisible()
  await expect(page.getByText(/PDF · \d+ B/)).toBeVisible()

  await page.getByRole('button', { name: 'Send inquiry' }).click()
  await expect(page.getByRole('heading', { name: 'Your inquiry was sent' })).toBeVisible()
  await expect(page.getByText(/usually within 1 business day/)).toBeVisible()
  await expect(page.getByText('INQ-2045')).toBeVisible()
  await page.getByRole('link', { name: 'View inquiry' }).click()
  await expect(page.getByRole('heading', { name: 'Exercises we can do during visits' })).toBeVisible()
  await expect(page.getByText('Status: New · waiting to be read')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Open walking-plan.pdf' })).toBeVisible()
})

test('leaving a started inquiry asks to discard', async ({ page }) => {
  await signedIn(page)
  await page.goto('/r/res_miriam/staff')
  await page.goto('/r/res_miriam/staff/new?dept=nursing')
  await page.getByLabel('Message').fill('Something I started writing')
  await page.getByRole('button', { name: 'Back' }).click()
  await expect(page.getByRole('dialog', { name: 'Discard this inquiry?' })).toBeVisible()
  await page.getByRole('button', { name: 'Keep writing' }).click()
  await expect(page.getByLabel('Message')).toHaveValue('Something I started writing')
  await page.getByRole('button', { name: 'Back' }).click()
  await page.getByRole('button', { name: 'Discard' }).click()
  await expect(page).toHaveURL(/\/staff$/)
})

test('closed inquiry has no reply box and offers a new one on the topic', async ({ page }) => {
  await signedIn(page)
  await page.goto('/r/res_miriam/staff/inq_2019')
  await expect(page.getByRole('heading', { name: 'This inquiry is closed' })).toBeVisible()
  await expect(page.getByText(/Closed by Oren Levi on/)).toBeVisible()
  await expect(page.getByRole('textbox', { name: 'Your reply' })).toHaveCount(0)
  await page.getByRole('link', { name: 'Open a new inquiry on this topic' }).click()
  await expect(page.getByText('Finance · Ward B')).toBeVisible()
  await expect(page.getByLabel('Subject')).toHaveValue('Question about the September invoice')
})

test('month grid: Sunday first, today outlined, selected filled, dots and diamonds', async ({ page }) => {
  await signedIn(page)
  await page.goto('/r/res_miriam/calendar?date=2026-10-16')
  const headers = page.getByRole('columnheader')
  await expect(headers.first()).toHaveText('Sun')
  await expect(headers.last()).toHaveText('Sat')
  const today = page.locator('[aria-current="date"]')
  await expect(today).toHaveAccessibleName(/14\.10\.2026/)
  await expect(today).toHaveClass(/border-primary/)
  const selected = page.locator('[aria-selected="true"]')
  await expect(selected).toHaveAccessibleName(/16\.10\.2026, 1 item/)
  await expect(selected).toHaveClass(/bg-primary/)
  // 15.10 has a center event (diamond), 16.10 a personal appointment (dot).
  await expect(page.getByRole('gridcell', { name: /15\.10\.2026/ }).locator('.rotate-45')).toHaveCount(1)
  await expect(page.getByRole('gridcell', { name: /16\.10\.2026/ }).locator('.rounded-full')).toHaveCount(1)
  await expect(page.getByRole('link', { name: /Doctor visit · Dr\. Avi Shapiro/ })).toBeVisible()

  await page.getByRole('gridcell', { name: /13\.10\.2026/ }).click()
  await expect(page).toHaveURL(/date=2026-10-13/)
  await expect(page.getByText('Nothing is scheduled for this day.')).toBeVisible()
  await page.getByRole('button', { name: 'Next month' }).click()
  await expect(page.getByRole('heading', { name: 'November 2026' })).toBeVisible()
})

test('month grid reads right-to-left in Hebrew', async ({ page }) => {
  await signedIn(page, 'he')
  await page.goto('/r/res_miriam/calendar')
  const headers = page.getByRole('columnheader')
  const sunday = (await headers.first().boundingBox())!
  const saturday = (await headers.last().boundingBox())!
  expect(sunday.x).toBeGreaterThan(saturday.x)
  await expect(headers.first()).toHaveText('א׳')
})

test('calendar view and date survive reload; week and list views', async ({ page }) => {
  await signedIn(page)
  await page.goto('/r/res_miriam/calendar')
  await page.getByRole('radio', { name: 'Week' }).click()
  await expect(page).toHaveURL(/view=week/)
  await expect(page.getByText('This week')).toBeVisible()
  await page.getByRole('button', { name: 'Next week' }).click()
  await expect(page).toHaveURL(/date=2026-10-18/)
  await page.reload()
  await expect(page.getByText(/18\.10\.2026 – 24\.10\.2026/)).toBeVisible()
  await expect(page.getByRole('link', { name: /Family music afternoon/ })).toBeVisible()
  await page.goto('/r/res_miriam/calendar?view=list')
  await expect(page.getByText(/Today · Wednesday · \W*14\.10\.2026/i)).toBeVisible()
  await expect(page.getByRole('link', { name: /Hanukkah family evening/ })).toBeVisible()
})

test('appointment: confirm, then confirmed bar and toast', async ({ page }) => {
  await signedIn(page)
  await page.goto('/r/res_miriam/calendar/cal_dr_shapiro')
  await expect(page.getByText('Needs your confirmation')).toBeVisible()
  await expect(page.getByText(/Moved from \W*15\.10\.2026\W* on \W*11\.10\.2026/)).toBeVisible()
  await page.getByRole('button', { name: 'Confirm I will attend' }).click()
  await expect(page.getByText('Confirmed · see you there')).toBeVisible()
  await expect(page.getByText('Ward B was notified that you will attend')).toBeVisible()
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Add to my calendar' }).click()
  expect((await download).suggestedFilename()).toBe('cal_dr_shapiro.ics')
})

test('center event opens its detail and RSVP opens the RSVP form', async ({ page }) => {
  await signedIn(page)
  await page.goto('/r/res_miriam/calendar?view=list')
  await page.getByRole('link', { name: /Family music afternoon/ }).click()
  await expect(page.getByRole('heading', { name: 'Family music afternoon' })).toBeVisible()
  await expect(page.getByText('Awaiting your RSVP')).toBeVisible()
  await expect(page.getByText('Residents and up to 4 guests each')).toBeVisible()
  await page.getByRole('link', { name: 'RSVP to this event' }).click()
  await expect(page).toHaveURL(/\/more\/events\/ev_music\/rsvp$/)
  await expect(page.getByText('Will you attend?')).toBeVisible()
})

for (const width of [320, 430]) {
  test(`no horizontal overflow on Phase 3 screens at ${width}px (he)`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 })
    await signedIn(page, 'he')
    for (const path of [
      'staff',
      'staff/new',
      'staff/new?dept=nursing',
      'staff/inq_2041',
      'staff/inq_2019',
      'calendar',
      'calendar?view=week',
      'calendar?view=list',
      'calendar/cal_dr_shapiro',
      'calendar/cal_ev_music',
    ]) {
      await page.goto(`/r/res_miriam/${path}`)
      await page.waitForLoadState('networkidle')
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), path).toBe(true)
    }
  })
}
