/**
 * App "now" for calendar logic (greeting, today/yesterday, day schedule). With VITE_MOCK_NOW set,
 * the clock starts at that instant when the app boots and then runs in real time, so the mock
 * fixtures (written around 14.10.2026 09:41) line up. Timers and token expiry keep using Date.now().
 */
const MOCK_NOW = import.meta.env.VITE_MOCK_NOW as string | undefined
const offset = MOCK_NOW && !Number.isNaN(Date.parse(MOCK_NOW)) ? Date.parse(MOCK_NOW) - Date.now() : 0

export const appNow = () => Date.now() + offset

export const appDate = () => new Date(appNow())
