import { expect, test, type Page } from '@playwright/test'

type Setup = { lang?: 'en' | 'he' | null; scenario?: string; idleSeconds?: number | null }

async function setup(page: Page, { lang = 'en', scenario = 'normal', idleSeconds = null }: Setup = {}) {
  await page.addInitScript(
    ([l, s, idle]) => {
      if (sessionStorage.getItem('e2e.init')) return
      sessionStorage.setItem('e2e.init', '1')
      localStorage.setItem(
        'caretex.prefs',
        JSON.stringify({ state: { language: l, theme: 'light' }, version: 0 }),
      )
      localStorage.setItem(
        'caretex.dev',
        JSON.stringify({ state: { scenario: s, panelOpen: false, idleSeconds: idle }, version: 0 }),
      )
    },
    [lang, scenario, idleSeconds] as const,
  )
}

async function signIn(page: Page, identifier = '050-123-4127', password = 'Dana!2026') {
  await page.getByLabel('Phone number or username').fill(identifier)
  await page.getByLabel('Password', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Sign in' }).click()
}

test('splash → login → picker → home; Back never returns to auth screens', async ({ page }) => {
  await setup(page)
  await page.goto('/')
  await expect(page).toHaveURL(/\/login/)
  await signIn(page)

  await expect(page.getByRole('heading', { name: 'Who would you like to view?' })).toBeVisible()
  await expect(page.getByText('Hello, Dana')).toBeVisible()
  await expect(page.getByText('3 new')).toBeVisible()
  await expect(page.getByText('No new items')).toBeVisible()
  await page.getByRole('button', { name: /Miriam Levi/ }).click()
  await expect(page).toHaveURL(/\/r\/res_miriam\/home/)

  await page.goBack()
  await expect(page).not.toHaveURL(/\/login|\/splash/)
  await page.goBack()
  await expect(page).not.toHaveURL(/\/login|\/splash/)
})

test('first run picks a language and the layout flips live', async ({ page }) => {
  await setup(page, { lang: null })
  await page.goto('/')
  await expect(page).toHaveURL(/\/welcome\/language/)
  await page.getByRole('radio', { name: /עברית/ }).click()
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
  await page.getByRole('button', { name: 'המשך' }).click()
  await expect(page).toHaveURL(/\/login/)
  await expect(page.getByRole('heading', { name: 'התחברו כדי להישאר מעודכנים' })).toBeVisible()
})

test('validation messages show on submit and focus the first invalid field', async ({ page }) => {
  await setup(page)
  await page.goto('/login')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByText('Enter your phone number or username')).toBeVisible()
  await expect(page.getByText('Enter your password')).toBeVisible()
  await expect(page.getByLabel('Phone number or username')).toBeFocused()
  await page.getByLabel('Phone number or username').fill('03-555-0100')
  await page.getByLabel('Phone number or username').blur()
  await expect(page.getByText('Enter a valid mobile number, for example 050-123-4567')).toBeVisible()
})

test('wrong password scenario shows attempts left from the API', async ({ page }) => {
  await setup(page, { scenario: 'wrongPassword' })
  await page.goto('/login')
  await signIn(page)
  await expect(page.getByRole('alert').filter({ hasText: "We couldn't sign you in" })).toContainText(
    'You have 2 attempts left',
  )
  await expect(page.getByText('Check your password and try again')).toBeVisible()
  await expect(page.getByLabel('Phone number or username')).toHaveAttribute('aria-invalid', 'true')
})

test('five wrong passwords lock the account', async ({ page }) => {
  await setup(page)
  await page.goto('/login')
  for (let i = 0; i < 5; i++) {
    await signIn(page, '050-123-4127', 'wrong')
    if (i < 4) await expect(page.getByRole('alert').first()).toBeVisible()
  }
  await expect(page).toHaveURL(/\/locked/)
  await expect(page.getByText(/Locked until \W*\d\d:\d\d/)).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Account temporarily locked' })).toBeVisible()
  await expect(page.getByText('Wait 15 minutes')).toBeVisible()
})

test('locked scenario', async ({ page }) => {
  await setup(page, { scenario: 'locked' })
  await page.goto('/login')
  await signIn(page)
  await expect(page).toHaveURL(/\/locked/)
  await expect(page.getByRole('link', { name: 'Call the care center' })).toHaveAttribute(
    'href',
    'tel:+97235550100',
  )
})

test('blocked scenario shows the center contact card', async ({ page }) => {
  await setup(page, { scenario: 'blocked' })
  await page.goto('/login')
  await signIn(page)
  await expect(page).toHaveURL(/\/blocked/)
  await expect(page.getByRole('heading', { name: 'Access to your account is blocked' })).toBeVisible()
  await expect(page.getByText('family@beithadar.co.il')).toBeVisible()
  await expect(page.getByText(/Sun–Thu \W*08:00–16:00/)).toBeVisible()
  await expect(page.getByRole('link', { name: 'Send an email' })).toHaveAttribute(
    'href',
    'mailto:family@beithadar.co.il',
  )
})

test('first login requires a personal password', async ({ page }) => {
  await setup(page, { scenario: 'firstLogin' })
  await page.goto('/login')
  await signIn(page)
  await expect(page).toHaveURL(/\/login\/first-password/)
  const save = page.getByRole('button', { name: 'Save and continue' })
  await expect(save).toBeDisabled()
  await expect(page.getByText('Meet all the rules to continue')).toBeVisible()

  await page.getByLabel('New password', { exact: true }).fill('Miriam2026')
  await expect(page.getByText('Good')).toBeVisible()
  await page.getByLabel('Confirm new password').fill('Miriam2026')
  await expect(save).toBeDisabled()

  await page.getByLabel('New password', { exact: true }).fill('Miriam#2026')
  await page.getByLabel('Confirm new password').fill('Miriam#2026')
  await expect(page.getByText('Strong')).toBeVisible()
  await expect(save).toBeEnabled()
  await save.click()
  await expect(page.getByText('Password saved')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Who would you like to view?' })).toBeVisible()
})

test('single resident skips the picker', async ({ page }) => {
  await setup(page, { scenario: 'singleResident' })
  await page.goto('/login')
  await signIn(page)
  await expect(page).toHaveURL(/\/r\/res_miriam\/home/)
})

test('forgot password: phone → code (wrong, then right) → new password → sign in with it', async ({
  page,
}) => {
  await setup(page)
  await page.goto('/login')
  await page.getByRole('link', { name: 'Forgot password?' }).click()
  await page.getByLabel('Phone number', { exact: true }).fill('50-123-4127')
  await page.getByRole('button', { name: 'Send code' }).click()

  await expect(page.getByText('050-***-4127')).toBeVisible()
  await expect(page.getByText(/Resend code in/)).toBeVisible()
  const code = page.getByLabel('Verification code')
  await code.fill('000000')
  await expect(page.getByText('The code is incorrect. 2 attempts left.')).toBeVisible()
  await code.fill('481927')

  await expect(page.getByRole('heading', { name: 'Set a new password' })).toBeVisible()
  await page.getByLabel('New password', { exact: true }).fill('Fresh#2027')
  await page.getByLabel('Confirm new password').fill('Fresh#2027')
  await expect(page.getByText('Passwords match', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Save new password' }).click()

  await expect(page.getByRole('heading', { name: 'Your password was changed' })).toBeVisible()
  await expect(page.getByText(/Changed on \W*\d\d\.\d\d\.\d{4} \d\d:\d\d/)).toBeVisible()
  await page.getByRole('button', { name: 'Back to sign in' }).click()
  await signIn(page, 'dana.cohen', 'Fresh#2027')
  await expect(page.getByRole('heading', { name: 'Who would you like to view?' })).toBeVisible()
})

test('idle timeout blurs content and reauth restores the same route', async ({ page }) => {
  await page.clock.install()
  await setup(page, { idleSeconds: 30 })
  await page.goto('/login')
  await signIn(page)
  await page.getByRole('button', { name: /Avraham Cohen/ }).click()
  await expect(page).toHaveURL(/\/r\/res_avraham\/home/)
  const url = page.url()

  await page.clock.fastForward(35_000)
  const sheet = page.getByRole('dialog', { name: /Enter your password to continue/ })
  await expect(sheet).toBeVisible()
  await expect(page.locator('[inert]')).toHaveCSS('filter', /blur/)

  await sheet.getByLabel('Password', { exact: true }).fill('nope')
  await sheet.getByRole('button', { name: 'Continue' }).click()
  await expect(sheet.getByText('Check your password and try again')).toBeVisible()

  await sheet.getByLabel('Password', { exact: true }).fill('Dana!2026')
  await sheet.getByRole('button', { name: 'Continue' }).click()
  await expect(sheet).toBeHidden()
  await expect(page.locator('[inert]')).toHaveCount(0)
  expect(page.url()).toBe(url)
})

test('a failed token refresh locks the session instead of logging out', async ({ page }) => {
  await setup(page)
  await page.goto('/login')
  await signIn(page)
  await page.getByRole('button', { name: /Miriam Levi/ }).click()

  await page.getByRole('button', { name: /^Dev/ }).click()
  await page.getByRole('button', { name: /Force 401/ }).click()
  // Changing language refetches /me, which hits the expired token.
  await page.getByRole('radio', { name: 'עברית' }).click()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog', { name: /הזינו סיסמה כדי להמשיך/ })).toBeVisible()
  await expect(page).toHaveURL(/\/r\/res_miriam\/home/)
})

test('header switcher changes resident on the same tab', async ({ page }) => {
  await setup(page)
  await page.goto('/login')
  await signIn(page)
  await page.getByRole('button', { name: /Miriam Levi/ }).click()
  await page.getByRole('button', { name: /Switch resident/ }).click()
  await page
    .getByRole('dialog')
    .getByRole('button', { name: /Avraham Cohen/ })
    .click()
  await expect(page).toHaveURL(/\/r\/res_avraham\/home/)
  await expect(page.getByText('Now viewing Avraham Cohen')).toBeVisible()
})
