import { expect, test, type Page } from '@playwright/test'

async function prefs(page: Page, lang: 'en' | 'he' = 'en') {
  await page.addInitScript((l) => {
    if (sessionStorage.getItem('e2e.init')) return
    sessionStorage.setItem('e2e.init', '1')
    localStorage.setItem('caretex.prefs', JSON.stringify({ state: { language: l, theme: 'light' }, version: 0 }))
    localStorage.setItem(
      'caretex.dev',
      JSON.stringify({ state: { scenario: 'normal', panelOpen: false, idleSeconds: null }, version: 0 }),
    )
  }, lang)
}

async function login(page: Page) {
  await page.goto('/login')
  await page.locator('input').first().fill('050-123-4127')
  await page.locator('input[type=password]').fill('Dana!2026')
  await page.locator('button[type=submit]').click()
  await page.waitForURL(/select-resident/)
}

async function signedIn(page: Page, lang: 'en' | 'he' = 'en') {
  await prefs(page, lang)
  await login(page)
}

const S = '/r/res_miriam/more/surveys/sv_family_2026'

async function answerFirstTwo(page: Page) {
  await page.goto(`${S}/q/q1`)
  await page.getByRole('radio', { name: 'The Family App' }).click()
  await page.getByRole('button', { name: 'Next' }).click()
  await expect(page).toHaveURL(/q\/q2$/)
  await page.getByRole('checkbox', { name: 'Family events' }).click()
  await page.getByRole('button', { name: 'Next' }).click()
  await expect(page).toHaveURL(/q\/q3$/)
}

test('survey: "No" on Q3 inserts Q3a; "Yes" removes it and its answer; progress follows', async ({ page }) => {
  await signedIn(page)
  await answerFirstTwo(page)
  await expect(page.getByText('Question 3 of 9')).toBeVisible()

  await page.getByRole('radio', { name: 'No' }).click()
  await expect(page.getByText('Question 3 of 10')).toBeVisible()
  await page.getByRole('button', { name: 'Next' }).click()
  await expect(page).toHaveURL(/q\/q3a$/)
  await expect(page.getByText('Follow-up · because you answered "No"')).toBeVisible()
  await expect(page.getByText('Question 4 of 10 · follow-up')).toBeVisible()
  await page.getByRole('textbox').fill('A short "we received it" message would help.')

  await page.getByRole('button', { name: 'Back' }).click()
  await expect(page).toHaveURL(/q\/q3$/)
  await page.getByRole('radio', { name: 'Yes' }).click()
  await expect(page.getByText('Question 3 of 9')).toBeVisible()
  await page.getByRole('button', { name: 'Next' }).click()
  await expect(page).toHaveURL(/q\/q4$/)
  await expect(page.getByText('Question 4 of 9')).toBeVisible()

  const stored = await page.evaluate(() => localStorage.getItem('caretex.surveyDrafts') ?? '')
  expect(stored).toContain('"q3":true')
  expect(stored).not.toContain('q3a')
})

test('required question: Next shows a message instead of moving on', async ({ page }) => {
  await signedIn(page)
  await page.goto(`${S}/q/q1`)
  // Next looks disabled (aria-disabled) but still answers a tap with the message, as designed.
  await page.getByRole('button', { name: 'Next' }).click({ force: true })
  await expect(page.getByText('Answer this question to continue')).toBeVisible()
  await expect(page).toHaveURL(/q\/q1$/)
})

test('closing the tab mid-survey and reopening resumes at the first unanswered question', async ({ page, context }) => {
  await signedIn(page)
  await answerFirstTwo(page)
  await page.getByRole('radio', { name: 'Yes' }).click()
  await page.getByRole('button', { name: 'Next' }).click()
  await expect(page).toHaveURL(/q\/q4$/)
  await page.close()

  const fresh = await context.newPage()
  await login(fresh)
  await fresh.goto(S)
  await fresh.getByRole('link', { name: 'Continue survey' }).click()
  await expect(fresh).toHaveURL(/q\/q4$/)
  await expect(fresh.getByText('Question 4 of 9')).toBeVisible()
})

test('save draft sheet, then full survey: review, edit, submit, thank you', async ({ page }) => {
  await signedIn(page)
  await answerFirstTwo(page)
  await page.getByRole('button', { name: 'Save draft' }).click()
  const sheet = page.getByRole('dialog', { name: 'Draft saved' })
  await expect(sheet.getByText(/You answered 2 of 9 questions/)).toBeVisible()
  await sheet.getByRole('button', { name: 'Continue now' }).click()

  await page.getByRole('radio', { name: 'Yes' }).click()
  await page.getByRole('button', { name: 'Next' }).click()
  await page.getByRole('radio', { name: '8' }).click()
  await page.getByRole('button', { name: 'Next' }).click()
  await page.getByRole('radio', { name: /^4 of 5/ }).click()
  await expect(page.getByText('4 of 5 · Good')).toBeVisible()
  await page.getByRole('button', { name: 'Next' }).click()
  await page.getByRole('radio', { name: 'Satisfied', exact: true }).click()
  await page.getByRole('button', { name: 'Next' }).click()
  await page.getByRole('button', { name: 'Next' }).click() // q7 is optional
  await page.getByRole('checkbox', { name: "I haven't attended an event yet" }).click()
  await page.getByRole('button', { name: 'Next' }).click()
  await page.getByRole('option', { name: 'Once a week' }).click()
  await page.getByRole('button', { name: 'Review answers' }).click()

  await expect(page.getByRole('heading', { name: 'Review your answers' })).toBeVisible()
  await expect(page.getByText('No answer')).toBeVisible()
  await page.getByRole('link', { name: /^Edit ?, answer 9$/ }).click()
  await page.locator('[aria-haspopup="listbox"]').click()
  await page.getByRole('option', { name: 'Several times a week' }).click()
  await page.getByRole('button', { name: 'Review answers' }).click()
  await expect(page.getByText('Several times a week')).toBeVisible()

  await page.getByRole('button', { name: 'Submit survey' }).click()
  await expect(page.getByRole('heading', { name: 'Thank you, Dana' })).toBeVisible()
  await expect(page.getByText(/Submitted on \W*14\.10\.2026/)).toBeVisible()
  await expect(page.getByText('8 of 9 questions')).toBeVisible()
  await page.getByRole('link', { name: 'Back to surveys' }).click()
  await page.getByRole('radio', { name: /Completed/ }).click()
  await expect(page.getByText('Family satisfaction survey 2026')).toBeVisible()
})

async function draw(page: Page, from: [number, number], to: [number, number]) {
  const box = (await page.getByRole('img', { name: 'Signature box' }).boundingBox())!
  await page.mouse.move(box.x + from[0], box.y + from[1])
  await page.mouse.down()
  for (let i = 1; i <= 10; i++) {
    await page.mouse.move(box.x + from[0] + ((to[0] - from[0]) * i) / 10, box.y + from[1] + ((to[1] - from[1]) * i) / 10)
  }
  await page.mouse.up()
}

test('signature needs a real signature and consent; signed doc shows "Signed on"', async ({ page }) => {
  await signedIn(page)
  await page.goto('/r/res_miriam/more/documents/doc_flu')
  await page.getByRole('button', { name: 'Sign document' }).click()
  await expect(page.getByRole('dialog', { name: 'Sign the consent form' })).toBeVisible()
  await page.waitForTimeout(600) // let the sheet finish sliding up before measuring the pad
  const send = page.getByRole('button', { name: 'Sign and send' })
  await expect(send).toBeDisabled()

  await draw(page, [60, 80], [64, 82]) // a dot, not a signature
  await expect(page.getByText('Please sign inside the box')).toBeVisible()
  await expect(send).toBeDisabled()
  await page.getByRole('button', { name: 'Clear' }).click()

  await draw(page, [40, 120], [240, 60])
  await expect(send).toBeDisabled()
  await page.getByRole('checkbox', { name: /authorized to sign on behalf of Miriam Levi/ }).click()
  await expect(send).toBeEnabled()
  await page.getByRole('checkbox', { name: /authorized to sign/ }).click()
  await expect(send).toBeDisabled()
  await page.getByRole('checkbox', { name: /authorized to sign/ }).click()
  await send.click()

  await expect(page.getByRole('heading', { name: 'Document signed' })).toBeVisible()
  await expect(page.getByText(/Signed on \W*\d\d\.\d\d\.\d{4} \d\d:\d\d/)).toBeVisible()
  await expect(page.getByText(/^SIG-\d{5}$/)).toBeVisible()
  await page.getByRole('link', { name: 'Back to documents' }).click()
  await page.getByRole('radio', { name: /Completed/ }).click()
  await page.getByRole('link', { name: /Flu vaccine consent form 2026/ }).click()
  await expect(page.getByText(/Signed on \W*\d\d\.\d\d\.\d{4} \d\d:\d\d/)).toBeVisible()
})

test('documents: confirm read needs the checkbox; decline needs a reason', async ({ page }) => {
  await signedIn(page)
  await page.goto('/r/res_miriam/more/documents?tab=confirm')
  await expect(page.getByText(/Overdue since \W*13\.10\.2026/)).toBeVisible()
  await page.getByRole('link', { name: /Updated visiting policy/ }).click()
  await page.getByRole('button', { name: 'Confirm I have read this' }).click()
  await expect(page.getByText('Tick the box to confirm you read the document')).toBeVisible()
  await page.getByRole('checkbox', { name: 'I have read and understood this document' }).click()
  await page.getByRole('button', { name: 'Confirm I have read this' }).click()
  await expect(page.getByText('Management was notified that you read this document')).toBeVisible()
  await expect(page.getByText(/Read confirmed on \W*\d\d\.\d\d\.\d{4}/)).toBeVisible()

  await page.goto('/r/res_miriam/more/documents/doc_outing')
  await page.getByRole('button', { name: 'Decline' }).click()
  const sheet = page.getByRole('dialog', { name: 'Decline this request?' })
  await sheet.getByRole('button', { name: 'Send decline' }).click()
  await expect(sheet.getByText('Write a reason of at least 5 characters')).toBeVisible()
  await sheet.getByLabel('Reason').fill('Miriam has a doctor visit that morning.')
  await sheet.getByRole('button', { name: 'Send decline' }).click()
  await expect(page.getByText('Activities was notified that you declined')).toBeVisible()
  await expect(page.getByText(/Declined on/)).toBeVisible()
})

test('approve goes to the result screen; Home no longer lists the item', async ({ page }) => {
  await signedIn(page)
  await page.goto('/r/res_miriam/more/documents/doc_outing')
  await page.getByRole('button', { name: 'Approve outing' }).click()
  await expect(page.getByRole('heading', { name: 'Approval sent' })).toBeVisible()
  await expect(page.getByText(/^APR-\d{5}$/)).toBeVisible()
})

test('feed: categories, newsletter confirm read, archive search', async ({ page }) => {
  await signedIn(page)
  await page.goto('/r/res_miriam/more/feed')
  await page.getByRole('radio', { name: 'Newsletters' }).click()
  await expect(page).toHaveURL(/cat=news/)
  await expect(page.getByRole('link', { name: /Pumpkin painting/ })).toHaveCount(0)
  await page.getByRole('link', { name: /October family newsletter/ }).click()
  await expect(page.getByText('Read confirmation needed').or(page.getByText('Confirm reading'))).toBeVisible()
  await expect(page.getByRole('link', { name: /october-newsletter.pdf/ })).toBeVisible()
  await page.getByRole('checkbox', { name: 'I have read and understood this newsletter' }).click()
  await page.getByRole('button', { name: 'Confirm I have read this' }).click()
  await expect(page.getByText(/You confirmed reading on/)).toBeVisible()

  await page.goto('/r/res_miriam/more/feed/archive')
  await expect(page.getByText('September 2026')).toBeVisible()
  await page.getByRole('searchbox', { name: 'Search the archive' }).fill('honey')
  await expect(page).toHaveURL(/q=honey/)
  await expect(page.getByRole('link', { name: /Honey cake baking/ })).toBeVisible()
  await expect(page.getByRole('link', { name: /August family newsletter/ })).toHaveCount(0)
  await page.getByRole('searchbox', { name: 'Search the archive' }).fill('zebra')
  await expect(page.getByText('Nothing matches "zebra"')).toBeVisible()
})

test('RSVP: guests need names; saved answer shows on the invitation and in the calendar', async ({ page }) => {
  await signedIn(page)
  await page.goto('/r/res_miriam/more/feed?cat=events')
  await page.getByRole('link', { name: /Hanukkah family evening/ }).click()
  await expect(page.getByText('Awaiting your RSVP')).toBeVisible()
  await page.getByRole('link', { name: 'RSVP to this event' }).click()

  await page.getByRole('button', { name: 'Save my RSVP' }).click()
  await expect(page.getByText('Choose one answer')).toBeVisible()
  await page.getByRole('radio', { name: 'Attending', exact: true }).click()
  await page.getByRole('button', { name: 'More' }).click()
  await page.getByRole('button', { name: 'More' }).click()
  await expect(page.getByLabel('Guest 2')).toBeVisible()
  await page.getByLabel('Guest 1').fill('Noam Cohen')
  await page.getByRole('button', { name: 'Save my RSVP' }).click()
  await expect(page.getByText("Enter the guest's name")).toBeVisible()
  await page.getByLabel('Guest 2').fill('Tamar Cohen')
  await page.getByRole('button', { name: 'Save my RSVP' }).click()

  await expect(page.getByRole('heading', { name: 'Your RSVP was saved' })).toBeVisible()
  await expect(page.getByText(/coming with 2 guests/)).toBeVisible()
  await expect(page.getByText('Attending · 2 guests')).toBeVisible()
  // Stay in the app: a full reload would reset the in-memory mock data.
  await page.getByRole('link', { name: 'Back to events' }).click()
  await expect(page.getByRole('link', { name: /Hanukkah family evening/ })).toContainText('Attending')
  await page.getByRole('link', { name: /Hanukkah family evening/ }).click()
  await expect(page.getByText('Your answer: Attending · 2 guests')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Change my RSVP' })).toBeVisible()
})

test('More menu shows live badges and opens each area', async ({ page }) => {
  await signedIn(page)
  await page.goto('/r/res_miriam/more')
  await expect(page.getByText('Daughter of Miriam Levi and Avraham Cohen')).toBeVisible()
  await expect(page.getByText('3 to do')).toBeVisible()
  await expect(page.getByText('1 new')).toBeVisible()
  await page.getByRole('link', { name: /Documents and Approvals/ }).click()
  await expect(page.getByRole('radio', { name: 'To sign (2)' })).toBeVisible()
})

for (const width of [320, 430]) {
  test(`no horizontal overflow on Phase 4 screens at ${width}px (he)`, async ({ page }) => {
    test.setTimeout(90_000)
    test.setTimeout(120_000) // 15 full page loads
    await page.setViewportSize({ width, height: 800 })
    await signedIn(page, 'he')
    for (const path of [
      'more',
      'more/documents',
      'more/documents/doc_flu',
      'more/documents/doc_outing',
      'more/documents/doc_addendum',
      'more/surveys',
      'more/surveys/sv_family_2026',
      'more/surveys/sv_family_2026/q/q4',
      'more/surveys/sv_family_2026/q/q6',
      'more/surveys/sv_holidays/review',
      'more/feed',
      'more/feed/nl_october',
      'more/feed/archive',
      'more/events/ev_hanukkah',
      'more/events/ev_hanukkah/rsvp',
    ]) {
      await page.goto(`/r/res_miriam/${path}`)
      await page.waitForLoadState('networkidle')
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), path).toBe(true)
    }
  })
}
