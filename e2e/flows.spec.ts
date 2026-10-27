import { expect, test, type Page } from '@playwright/test'
import { prepare } from './helpers'

// The six release journeys, each from the sign-in screen and staying inside the app (a full reload
// would reset the in-memory mock data).

async function signInToMiriam(page: Page) {
  await prepare(page)
  await page.goto('/login')
  await page.getByLabel('Phone number or username').fill('050-123-4127')
  await page.getByLabel('Password', { exact: true }).fill('Dana!2026')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.getByRole('button', { name: /Miriam Levi/ }).click()
  await expect(page).toHaveURL(/\/r\/res_miriam\/home/)
}

const tab = (page: Page, name: string) =>
  page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: new RegExp(`^${name}`) })

async function simulator(page: Page, mode: RegExp) {
  await page.getByRole('button', { name: /^Dev/ }).click()
  await page.getByRole('button', { name: mode }).click()
  await page.keyboard.press('Escape')
}

async function draw(page: Page) {
  const box = (await page.getByRole('img', { name: 'Signature box' }).boundingBox())!
  await page.mouse.move(box.x + 40, box.y + 120)
  await page.mouse.down()
  for (let i = 1; i <= 10; i++) await page.mouse.move(box.x + 40 + 20 * i, box.y + 120 - 6 * i)
  await page.mouse.up()
}

test('journey: sign in → sign a document', async ({ page }) => {
  test.setTimeout(90_000)
  await signInToMiriam(page)
  await tab(page, 'More').click()
  await page.getByRole('link', { name: /Documents/ }).click()
  await page.getByRole('link', { name: /Flu vaccine consent form 2026/ }).click()
  await page.getByRole('button', { name: 'Sign document' }).click()
  await expect(page.getByRole('dialog', { name: 'Sign the consent form' })).toBeVisible()
  await page.waitForTimeout(600) // the sheet finishes sliding up before the pad is measured
  await draw(page)
  await page.getByRole('checkbox', { name: /authorized to sign/ }).click()
  await page.getByRole('button', { name: 'Sign and send' }).click()
  await expect(page.getByRole('heading', { name: 'Document signed' })).toBeVisible()
  await expect(page.getByText(/^SIG-\d{5}$/)).toBeVisible()
})

test('journey: new inquiry → reply in its thread', async ({ page }) => {
  test.setTimeout(90_000)
  await signInToMiriam(page)
  await tab(page, 'Contact Staff').click()
  await page.getByRole('button', { name: 'New inquiry' }).click()
  await page.getByRole('radio', { name: /Physiotherapy/ }).click()
  await page.getByRole('button', { name: 'Continue' }).click()
  await page.getByLabel('Subject').fill('Exercises we can do during visits')
  await page.getByLabel('Message').fill('Which walking exercises are safe for us to do together in the corridor?')
  await page.getByRole('button', { name: 'Send inquiry' }).click()
  await expect(page.getByRole('heading', { name: 'Your inquiry was sent' })).toBeVisible()
  await page.getByRole('link', { name: 'View inquiry' }).click()
  await expect(page.getByRole('heading', { name: 'Exercises we can do during visits' })).toBeVisible()

  await page.getByRole('textbox', { name: 'Your reply' }).fill('One more thing: she prefers mornings.')
  await page.getByRole('button', { name: 'Send', exact: true }).click()
  await expect(page.getByRole('article').filter({ hasText: 'she prefers mornings' })).toHaveCount(1)
})

test('journey: survey with a conditional question → submit', async ({ page }) => {
  test.setTimeout(120_000)
  await signInToMiriam(page)
  await tab(page, 'More').click()
  await page.getByRole('link', { name: /Surveys/ }).click()
  await page.getByRole('listitem').filter({ hasText: 'Family satisfaction survey 2026' }).getByRole('link').click()
  await page.getByRole('link', { name: 'Start survey' }).click()
  const next = page.getByRole('button', { name: 'Next' })

  await page.getByRole('radio', { name: 'The Family App' }).click()
  await next.click()
  await page.getByRole('checkbox', { name: 'Family events' }).click()
  await next.click()
  await page.getByRole('radio', { name: 'No' }).click()
  await expect(page.getByText('Question 3 of 10')).toBeVisible()
  await next.click()
  await expect(page.getByText('Follow-up · because you answered "No"')).toBeVisible()
  await page.getByRole('textbox').fill('A short "we received it" message would help.')
  await next.click()
  await page.getByRole('radio', { name: '8' }).click()
  await next.click()
  await page.getByRole('radio', { name: /^4 of 5/ }).click()
  await next.click()
  await page.getByRole('radio', { name: 'Satisfied', exact: true }).click()
  await next.click()
  await next.click() // optional
  await page.getByRole('checkbox', { name: "I haven't attended an event yet" }).click()
  await next.click()
  await page.getByRole('option', { name: 'Once a week' }).click()
  await page.getByRole('button', { name: 'Review answers' }).click()

  await expect(page.getByText('A short "we received it" message would help.')).toBeVisible()
  await page.getByRole('button', { name: 'Submit survey' }).click()
  await expect(page.getByRole('heading', { name: 'Thank you, Dana' })).toBeVisible()
})

test('journey: RSVP to a center event', async ({ page }) => {
  test.setTimeout(90_000)
  await signInToMiriam(page)
  await tab(page, 'More').click()
  await page.getByRole('link', { name: /^Updates and Events/ }).click()
  await page.getByRole('radio', { name: /Events/ }).click()
  await page.getByRole('link', { name: /Hanukkah family evening/ }).click()
  await page.getByRole('link', { name: 'RSVP to this event' }).click()
  await page.getByRole('radio', { name: 'Attending', exact: true }).click()
  await page.getByRole('button', { name: 'Save my RSVP' }).click()
  await expect(page.getByRole('heading', { name: 'Your RSVP was saved' })).toBeVisible()
  await page.getByRole('link', { name: 'Back to events' }).click()
  await expect(page.getByRole('link', { name: /Hanukkah family evening/ })).toContainText('Attending')
})

test('journey: a reply written offline queues and sends on reconnect', async ({ page }) => {
  test.setTimeout(90_000)
  await signInToMiriam(page)
  await tab(page, 'Contact Staff').click()
  await page.getByRole('link', { name: /Winter clothing for Miriam/ }).click()
  await simulator(page, /Offline/)
  await page.getByRole('textbox', { name: 'Your reply' }).fill("I'll bring them on Friday, all labeled.")
  await page.getByRole('button', { name: 'Send', exact: true }).click()
  await expect(page.getByText("Will send when you're back online")).toBeVisible()
  await simulator(page, /Normal/)
  await expect(page.getByText("Will send when you're back online")).toHaveCount(0)
  await expect(page.getByRole('article').filter({ hasText: "I'll bring them on Friday" })).toHaveCount(1)
})

test('journey: an expired session locks, and signing in again restores the same screen', async ({ page }) => {
  test.setTimeout(90_000)
  await signInToMiriam(page)
  await tab(page, 'Calendar').click()
  await page.getByRole('radio', { name: 'List' }).click()
  await page.getByRole('link', { name: /Shapiro/ }).first().click()
  await expect(page).toHaveURL(/\/calendar\/cal_dr_shapiro/)
  const url = page.url()

  await simulator(page, /Force 401/)
  // The next request hits the expired token and the refresh fails.
  await page.getByRole('button', { name: 'Confirm I will attend' }).click()
  const sheet = page.getByRole('dialog', { name: /Enter your password to continue/ })
  await expect(sheet).toBeVisible()
  await expect(page.locator('[inert]')).toHaveCSS('filter', /blur/)

  await sheet.getByLabel('Password', { exact: true }).fill('Dana!2026')
  await sheet.getByRole('button', { name: 'Continue' }).click()
  await expect(sheet).toBeHidden()
  expect(page.url()).toBe(url)
  await expect(page.getByRole('heading', { name: /Shapiro/ })).toBeVisible()
})
