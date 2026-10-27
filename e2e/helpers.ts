import { expect, type Page } from '@playwright/test'

export type Lang = 'en' | 'he'
export type Theme = 'light' | 'dark' | 'system'
type Setup = { lang?: Lang; theme?: Theme; longStrings?: boolean; scenario?: string }

/** Seeds preferences and dev settings once per tab (later reloads keep whatever the test changed). */
export async function prepare(page: Page, { lang = 'en', theme = 'light', longStrings = false, scenario = 'normal' }: Setup = {}) {
  await page.addInitScript(
    ([l, th, long, sc]) => {
      if (sessionStorage.getItem('e2e.init')) return
      sessionStorage.setItem('e2e.init', '1')
      localStorage.setItem('caretex.prefs', JSON.stringify({ state: { language: l, theme: th }, version: 0 }))
      localStorage.setItem(
        'caretex.dev',
        JSON.stringify({ state: { scenario: sc, panelOpen: false, idleSeconds: null, longStrings: long }, version: 0 }),
      )
    },
    [lang, theme, longStrings, scenario] as const,
  )
}

export async function login(page: Page) {
  await page.goto('/login')
  await page.locator('input').first().fill('050-123-4127')
  await page.locator('input[type=password]').fill('Dana!2026')
  await page.locator('button[type=submit]').click()
  await page.waitForURL(/select-resident/)
}

export async function signedIn(page: Page, setup: Setup = {}) {
  await prepare(page, setup)
  await login(page)
}

/** Waits until data has loaded: no skeletons, no busy regions, fonts in. */
export async function settle(page: Page) {
  await page.waitForLoadState('networkidle')
  await expect(page.locator('.shimmer, [aria-busy="true"]')).toHaveCount(0, { timeout: 15_000 })
  await page.evaluate(() => document.fonts.ready.then(() => undefined))
}

const M = '/r/res_miriam'

export const PUBLIC_ROUTES = ['/login', '/forgot', '/welcome/language', '/blocked', '/locked']

/** One URL per screen (some screens in more than one state). */
export const APP_ROUTES = [
  '/select-resident',
  `${M}/home`,
  `${M}/notifications`,
  `${M}/resident/general`,
  `${M}/resident/medical`,
  `${M}/resident/care-plan`,
  `${M}/resident/day`,
  `${M}/resident/updates`,
  `${M}/resident/updates/upd_music`,
  `${M}/resident/updates/upd_music/photos/1`,
  '/r/res_avraham/resident/care-plan',
  '/r/res_avraham/resident/medical',
  `${M}/staff`,
  `${M}/staff/inq_2041`,
  `${M}/staff/inq_2019`,
  `${M}/staff/new`,
  `${M}/staff/new?dept=nursing`,
  `${M}/staff/new/sent/inq_2041`,
  `${M}/calendar`,
  `${M}/calendar?view=week`,
  `${M}/calendar?view=list`,
  `${M}/calendar/cal_dr_shapiro`,
  `${M}/calendar/cal_ev_music`,
  `${M}/more`,
  `${M}/more/documents`,
  `${M}/more/documents/doc_flu`,
  `${M}/more/documents/doc_outing`,
  `${M}/more/documents/doc_flu/done`,
  `${M}/more/surveys`,
  `${M}/more/surveys/sv_family_2026`,
  `${M}/more/surveys/sv_family_2026/q/q1`,
  `${M}/more/surveys/sv_family_2026/review`,
  `${M}/more/surveys/sv_family_2026/done`,
  `${M}/more/feed`,
  `${M}/more/feed/nl_october`,
  `${M}/more/feed/fi_parking`,
  `${M}/more/feed/archive`,
  `${M}/more/events/ev_music`,
  `${M}/more/events/ev_music/rsvp`,
  `${M}/more/events/ev_music/rsvp/done`,
  `${M}/more/services`,
  `${M}/more/services/new`,
  `${M}/more/services/sr_1193`,
  `${M}/more/services/sent/sr_1193`,
  `${M}/more/center`,
  `${M}/more/center/guide`,
  `${M}/more/permissions`,
  `${M}/more/payments`,
  `${M}/more/settings`,
  `${M}/more/settings?view=password`,
]

export type LayoutProblem = { kind: 'overflow' | 'clipped'; element: string; text: string; detail: string }

/**
 * Sideways scrolling that isn't an intentional horizontal scroller (`overflow-x-auto`), elements outside
 * the viewport, and text cut off by `overflow: hidden` without an ellipsis or line clamp.
 */
export function findLayoutProblems(page: Page) {
  return page.evaluate(() => {
    const problems: LayoutProblem[] = []
    const width = document.documentElement.clientWidth
    const describe = (el: Element) =>
      `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}.${[...el.classList].slice(0, 4).join('.')}`
    const clippedByAncestor = (el: Element) => {
      for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
        if (getComputedStyle(p).overflowX !== 'visible') return true
      }
      return false
    }
    if (document.documentElement.scrollWidth > width + 1) {
      problems.push({ kind: 'overflow', element: 'html', text: '', detail: `scrollWidth ${document.documentElement.scrollWidth} > ${width}` })
    }
    for (const el of document.body.querySelectorAll('*')) {
      const style = getComputedStyle(el)
      if (style.display === 'none' || style.visibility === 'hidden' || el.closest('[aria-hidden="true"], svg, .sr-only')) continue
      const rect = el.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) continue
      const text = (el.textContent ?? '').trim().slice(0, 60)
      const scrolls = style.overflowX === 'auto' || style.overflowX === 'scroll'
      if (scrolls && el.scrollWidth > el.clientWidth + 1 && !el.classList.contains('overflow-x-auto')) {
        problems.push({ kind: 'overflow', element: describe(el), text, detail: `scrolls sideways: ${el.scrollWidth} > ${el.clientWidth}` })
      }
      if ((rect.right > width + 1 || rect.left < -1) && style.position !== 'fixed' && !clippedByAncestor(el)) {
        problems.push({ kind: 'overflow', element: describe(el), text, detail: `${Math.round(rect.left)}…${Math.round(rect.right)} of ${width}` })
      }
      const ownText = [...el.childNodes].some((n) => n.nodeType === Node.TEXT_NODE && n.textContent?.trim())
      const clips = style.overflowX === 'hidden' || style.overflowX === 'clip'
      const intentional = style.textOverflow === 'ellipsis' || style.webkitLineClamp !== 'none'
      if (ownText && clips && !intentional && el.scrollWidth > el.clientWidth + 1) {
        problems.push({ kind: 'clipped', element: describe(el), text, detail: `scrollWidth ${el.scrollWidth} > ${el.clientWidth}` })
      }
    }
    return problems
  })
}
