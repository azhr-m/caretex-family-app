# CARETEX Family App — Build progress

What each phase delivered, how to try it and what's still open. The plan itself is in [design_handoff_caretex_family_app/docs/00-implementation-phases.md](design_handoff_caretex_family_app/docs/00-implementation-phases.md).

| Phase | Scope | Status |
|---|---|---|
| 0 | Foundation | ✅ Done (2026-10-27) |
| 1 | Onboarding, auth and security | ✅ Done (2026-10-27) |
| 2 | Home and Resident tab | ✅ Done (2026-10-27) |
| 3 | Contact Staff and Calendar | ✅ Done (2026-10-27) |
| 4 | Documents, Surveys, Updates & Events | ⏳ Next |
| 5 | Services, Center, Permissions, Payments, Settings, Notifications | — |
| 6 | Hardening (visual/e2e/a11y/perf/PWA, backend integration doc) | — |

All data is mocked (MSW). Connecting to `caretex-api` comes later.

---

## Quick start

```bash
cd caretex-family-ui
corepack pnpm@9.15.9 install
corepack pnpm@9.15.9 dev        # http://localhost:5175
```

**Demo sign-in:** `050-123-4127` or `dana.cohen`, password `Dana!2026`, SMS code `481927`.
**Mock clock:** "today" is **Wed 14.10.2026 09:41** (`VITE_MOCK_NOW` in `.env`) so the fixture dates line up. Remove it to use the real date.
The **Dev** button (bottom corner, dev builds only) switches language, theme, mock scenario, network simulator, idle timeout (10 min / 30 s), and has "Lock now", "Sign out" and links to `/dev/components`.

**Checks:** `pnpm typecheck` · `pnpm lint` · `pnpm test` · `pnpm e2e` · `pnpm i18n:check` · `pnpm build`

---

## Phase 0 — Foundation

### What's built

**Project setup**
- React 19, TypeScript (strict), Vite 8, pnpm 9, Tailwind v4.
- ESLint with a custom rule ([eslint-rules/no-physical-direction.js](eslint-rules/no-physical-direction.js)) that rejects left/right classes (`ml-`, `pr-`, `left-`, `text-right`, `rounded-l`, `border-r`, …) so Hebrew RTL can't break. Prettier, Vitest, Playwright.

**Design tokens** — [src/styles/index.css](src/styles/index.css)
- Every color from the design in light and dark (`data-theme="dark"`), the 8 status tones (fg/bg/border), type scale, radii, shadows, skeleton shimmer, reduced-motion support.
- Nunito for English, Rubik for Hebrew, switched by `<html lang>`.

**Languages** — [src/lib/i18n.ts](src/lib/i18n.ts), [src/locales/](src/locales/)
- English/Hebrew, 15 namespaces. Language comes from the stored choice, then the device, then English.
- Changing language sets `<html lang dir>` and the Radix direction, with no reload.
- `pnpm i18n:check` fails if the two languages' keys differ.

**State** — [src/stores/](src/stores/)
- `prefs`: language and theme, saved in the browser.
- `session`: tokens kept in memory, refresh token per tab only, active resident saved.
- `network`: online state and simulator mode.
- `ui`: open sheets.
- `surveyDrafts`: answers only, cleared on logout.
- `dev`: scenario, idle override.

**Routing** — [src/routes/](src/routes/)
- Every route from the architecture doc exists, typed search params included. Unbuilt routes show a "Coming in Phase N" placeholder.
- Header + tab bar layout for tab routes; signed-out users are sent to login.

**Data layer** — [src/api/](src/api/)
- Query client with the spec defaults (30 s stale, retry only retryable errors, pause when offline).
- API client ([src/api/client.ts](src/api/client.ts)): base URL, `Accept-Language`, auth header, request ID, 20 s timeout.
  - An expired token triggers one shared refresh. If refresh fails, the session locks; it doesn't log out.
  - Revoked or blocked accounts are logged out and sent to `/blocked`.
  - All failures become one `ApiError` type; every response is checked against a Zod schema.

**Mock API** — [src/mocks/](src/mocks/)
- MSW handlers, an in-memory store for changes, and the 7 scenarios.
- Network simulator: Normal (250–600 ms), Slow 3G (2–4 s), Very slow (10–12 s), Offline, Random errors (20% → 503), Force 401 (one-shot), Force 403 (resident data denied).

**Shared components** — [src/components/](src/components/)
- All 28 from the components spec: Button, IconTile, StatusChip, Card/NavyCard/InfoBox, ListRow/ListGroup, SectionHeader, TextField, PasswordField, TextArea (with counter), SegmentedControl, FilterChips, Stepper, ProgressBar, BottomSheet, Toast, Banner, Skeleton, EmptyState, ResultScreen, ErrorState, PermissionState, QueryBoundary, AppHeader, TopBar, TabBar, Fab, Ltr, DirIcon, ImagePlaceholder, Toggle/ToggleRow, Avatar.
- **QueryBoundary** picks the right state for any screen:
  - loading: skeleton only after 300 ms, and a "taking longer than usual" note after 8 s
  - offline, error with retry and request ID, no permission, not yet shared, empty
  - a thin progress line while it refreshes data already on screen
- **Offline banner:** "No internet connection · saved at HH:mm"; shows "You're back online" for 3 s on reconnect.

**Dev tools:** `/dev/components` shows every component plus a demo query wired to the simulator; the floating Dev panel.

### Acceptance
- ✅ `/dev/components` renders everything; switching English/Hebrew mirrors the layout; light/dark swaps all colors; no overflow at 320 / 390 / 430 px (Playwright).
- ✅ Simulator modes visibly change the demo query: skeleton → slow note → error / offline / no permission.
- ✅ Lint blocks left/right classes (unit-tested); `pnpm i18n:check` passes.

### Fixed during checks
- Primary button text disappeared on navy: the class-merging utility dropped the text color. Our font-size tokens are now registered in [src/lib/utils.ts](src/lib/utils.ts) — **add any new font-size token there too**.
- The "Contact Staff" tab label was cut off at 390 px; tab labels now wrap to two lines when needed.

---

## Phase 1 — Onboarding, auth and security

### What's built
Screens are in [src/features/auth/screens/](src/features/auth/screens/).

| Screen | Route | Highlights |
|---|---|---|
| Splash | `/splash` | Navy screen, at least 800 ms while it restores the session (refresh token, then `/me`). Then: language screen (first run), last route, picker, or sign-in. |
| Language | `/welcome/language` | Two cards; tapping one flips the layout immediately. |
| Sign in | `/login` | Language and theme toggles, phone/username validation (on blur and submit, focuses the first invalid field), show/hide password, red alert with attempts left, submit disabled offline. |
| Personal password | `/login/first-password` | For temporary passwords. Strength meter (4 levels), live rule checklist, "Save and continue" disabled until all pass, "Password saved" toast. |
| Forgot password | `/forgot?step=phone\|code\|password\|done` | 3-step stepper. Phone with +972. 6-digit code (paste, SMS autofill, resend timer, wrong / expired / too-many errors). New password with the same rules. Done screen with "Changed on DD.MM.YYYY HH:mm". |
| Locked | `/locked` | Lock time from the API, live countdown, 3 "what you can do" cards, reset / call buttons; Sign in returns when the lock expires. |
| Blocked | `/blocked` | Care-center contact card (phone, email, address, hours) from `/center/public`; call / email buttons. |
| Resident picker | `/select-resident` | "Hello, Dana", one card per resident (relation, "3 new" / "No new items"); skipped when there's only one resident. |
| Resident switcher | sheet from the header | Current resident highlighted; choosing another keeps you on the same tab and shows "Now viewing …". |
| Session lock | over all signed-in screens | After 10 min idle (30 s from the Dev panel), on return from the background, or when a refresh fails: content blurs and can't be used, and a password sheet appears that can't be swiped away. The right password resumes the exact route and scroll; 5 wrong ones sign out to `/locked`. "Not Dana? Sign out". |

**Supporting work**
- API: auth, `/me` and `/center/public` endpoints with Zod schemas matching the contract, plus mutation hooks. Password changes are never queued when offline; their buttons are disabled instead.
- Session ([src/app/session.ts](src/app/session.ts)): restore on start, where to land after sign-in, remembers the last route, full logout (clears data, survey drafts, session; keeps preferences).
- Idle timer ([src/app/idle.ts](src/app/idle.ts)).
- Validation ([src/lib/validation.ts](src/lib/validation.ts)): Israeli mobile → `+9725…`, username format, password policy checks and strength.
- New pieces: `OtpInput`, `Alert`, `PasswordRules` / `StrengthMeter`, `CenterContactCard`.
- Mock backend: real login state (5 tries → 15-min lock), OTP sessions, password history (rejects reused passwords), Hebrew/English member and center data.
- Changing language refetches data so names come back in the new language.

**Mock scenarios (Dev panel)**

| Scenario | Result |
|---|---|
| Normal | Picker with Miriam + Avraham; 5 wrong passwords → locked |
| First login | Personal password screen |
| Wrong password | "You have 2 attempts left" |
| Account locked | `/locked` |
| Account blocked | `/blocked` |
| Single resident | Straight to Home |

### Acceptance
- ✅ Every mock scenario reaches its designed screen (e2e test each).
- ✅ Idle lock blurs content and the password sheet restores the exact route (e2e with a fake clock). A failed token refresh also locks instead of logging out (e2e).
- ✅ Browser Back never returns to auth screens after login (e2e).
- ✅ No overflow on any Phase 1 screen at 390 / 320 px in English-light and Hebrew-dark.

### Fixed during checks
- Hebrew reversed "(0–9)", "(!@#$)" and "08:00–16:00". These are now kept left-to-right inside the Hebrew text; plain-string places (chips, toasts) use `bidiIsolate()` in [src/lib/format.ts](src/lib/format.ts).

### Decisions (where the spec didn't say)
- When the lock expires, the locked screen's main button becomes "Sign in".
- Back on the personal-password screen signs out the temporary session.
- Reloading mid forgot-password restarts at the phone step (the reset token is never stored).
- Avatar colors come from the resident's position in the list (first pink, second teal); the API has no color field.
- The picker uses the full care-center name from the API ("…at Beit Hadar Care Center").

---

## Phase 2 — Home and Resident tab

### What's built

**Shell**
- Tab bar badges and the bell count come from the dashboard (`counts`). Badges hide on the active tab.
- New pages open at the top; Back restores the scroll position. Switching resident starts at the top and refetches everything.
- Pull-to-refresh on Home and every Resident list ([src/components/app/PullToRefresh.tsx](src/components/app/PullToRefresh.tsx)). Success is silent; failure shows an error toast.

**Home** — `/r/$rid/home` ([src/features/home/](src/features/home/))

| Section | Notes |
|---|---|
| Greeting + date | "Good morning, Dana" by Israel time (morning 05–12, afternoon 12–17, evening 17–22, night) and "Wednesday, 14.10.2026" |
| Resident card | Navy card, photo or stripes, ward · room, center name, Profile → General |
| Since your last visit · DD.MM.YYYY | "5 new" chip, colored kind label per row, each row deep-links. Empty: "Nothing new since your last visit". Calls `POST /me/visits` once per session per resident |
| Needs your attention | Action cards with a status chip and a button (Sign / Read / Start / RSVP / Reply …) that opens the later-phase route. Empty: green "You're all caught up" |
| Latest update | Author, title, 2-line excerpt, photo, "Read the full update ›" |
| Upcoming appointment | Date block, time, place, "Personal · Miriam", Confirm when needed. Hidden when there is none |
| Miriam's day · Today | 5 rows with Done / Now / Upcoming, done rows faded, "See the full day ›" |
| Quick actions | New inquiry, Service request, Documents ("2 waiting for you"), Events ("1 invitation") |

Home makes one `GET /dashboard` call, and each section is validated separately. A malformed section shows "Couldn't load this section · Try again" while the rest still renders. If the whole call fails, the full error screen shows.

**Resident tab** — `/r/$rid/resident/*` ([src/features/resident/](src/features/resident/))

| Screen | Highlights |
|---|---|
| Segment bar | General · Updates (badge) · Medical · Care plan · {Name}'s day. From `permissions`: denied → lock icon, not shared → hourglass, hidden → not shown. `/resident` opens the first permitted segment |
| General | Profile card; details (date of birth + age, ward, room, admitted, languages, primary contact "(you)"); staff contacts with "Inquiry" (opens a new inquiry to that department); nurses' station "Call" (`tel:`) |
| Updates | Grouped by day ("Monday · 12.10.2026"), New chip, 3-line text, up to 2 photos ("+1" when there are more), infinite scroll (20 per page) |
| Update detail | Author, date and category chips, full text, photo grid (2fr/1fr), "Shared by the care center on …", "Ask the staff about this update" (opens a new inquiry with subject and link). Opening a new update marks it seen and updates the badges |
| Photo viewer | Full screen on black: Close, counter `1 / 3`, Save. Swipe (mirrored in Hebrew), pinch-zoom, double-tap zoom, pan. Previous / Next (disabled at the ends), arrow keys, Escape. Thumbnail first, then the full image; a broken image shows "Photo unavailable" |
| Medical | Blue info box. Category cards: Medications "3 active", Allergies with a red "Allergy" flag, Doctor visits "Last: …". Empty categories are hidden; if all are empty, an empty state |
| Care plan | Navy header with Reviewed / Next review. Goal cards: status chip, "What the team does", pink "How you can help" |
| Day | Yesterday ‹ Today › Tomorrow (later days disabled; `?date=` in the URL). Timeline with green / amber / hollow dots; the "now" card is outlined amber and scrolled into view; last-updated note |
| No permission / Not yet shared | Design 3.8a / 3.8b: tile, chip, title, body (plus the center's note, e.g. "shared only with the legal guardian"), note box, buttons (View my permissions / Ask the social worker; Ask the medical staff / Back to general info). Shown straight from `permissions` without calling the section; also shown when a section returns 403 or `not_shared` |

**Mock backend**
- Endpoints: `/residents/:rid`, `/permissions`, `/dashboard`, `/updates` (cursor), `/updates/:id`, `/updates/:id/seen`, `/medical`, `/care-plan`, `/schedule?date=`, `POST /me/visits`. Photos are generated at `/media/photos/:id`.
- Miriam: everything allowed, 24 updates (2 new). Avraham: care plan **denied**, medical **not shared**.
- The "Empty everything" scenario empties Home, Updates and Medical.

### Acceptance
- ✅ Avraham shows "No permission" on Care plan and "Not yet shared" on Medical; the segments show lock / hourglass icons (e2e).
- ✅ Photo viewer: swipe, Previous / Next, Close, counter `1 / 3`; the swipe direction mirrors in Hebrew (e2e).
- ✅ Every "Needs your attention" button and quick action opens its later-phase placeholder route (e2e).
- ✅ Switching resident refetches and resets scroll. No horizontal overflow at 320 / 430 px in Hebrew on any Phase 2 screen (e2e).
- ✅ Network simulator: Force 403 → no-permission state; Offline → offline state; Very slow → slow note, then the data; back to Normal (scripted run).
- Totals: typecheck, lint, i18n check and build pass; 39 unit tests and 30 e2e tests pass.

### Fixed during checks
- In Hebrew, the active segment pill (e.g. "Care plan") was cut off at the edge of the bar; it now scrolls to the center.

### Decisions (where the spec didn't say)
- **Mock clock** (`VITE_MOCK_NOW`): only date logic uses it (greeting, "today", the schedule). Timers and lockouts use real time.
- **First names** ("Miriam's day") are the first word of the resident's full name; the API has no first-name field.
- **Colors the API doesn't send:** staff avatar color and role icon come from `roleCode`; care-plan goal tiles cycle through the design's colors.
- **Day switcher:** Tomorrow is enabled from Today. The docs only disable days after tomorrow; the design grays Tomorrow out, and docs win for behavior. You can go back any number of days.
- **New-inquiry prefill:** `/staff/new` accepts `dept`, `subject` and `ref` (`update:<id>`); Phase 3 will use them.
- **Photo URLs:** `/photos/$index` starts at 1, matching the counter.
- **Mock previous-visit dates** are fixed, so the demo looks the same in every session.
- The shared `PermissionState` now uses the design's copy and layout (chip, note box), so the generic 403 fallback matches 3.8a too.

---

## Phase 3 — Contact Staff and Calendar

### What's built

**Contact Staff** — [src/features/staff/](src/features/staff/)

| Screen | Route | Highlights |
|---|---|---|
| Inquiry list | `/staff?q=&dept=&status=&sort=` | Search (updates the URL 300 ms after typing stops), department sheet, Newest / Oldest, status chips with counts. Cards: department tile, subject, red "New reply" marker and blue border when unread, 2-line preview ("Yael: …" / "You: …"), status chip, `INQ-2041`. Infinite scroll. "New inquiry" floating button. Everything in the URL survives reload |
| No results / empty | same | "No inquiries match your search" names the query and department, with "Clear search and filters" + "New inquiry". With no inquiries at all: "You haven't opened any inquiries yet" |
| New inquiry | `/staff/new?step=department\|message` | 2-step stepper. Department grid (10 departments, hints from the API, "Selected" check; Continue disabled until one is picked). Message step: "Sending to Physiotherapy · Ward B" with Change, subject (3–80), message (10–1000, counter amber at 900), attachments, amber "not for emergencies" box with the nurses' station phone. Leaving with unsaved text asks "Discard this inquiry?" |
| Attachments | (in the form and the reply bar) | "Add photo" (camera) and "Add file". Up to 5 files, 10 MB each, JPG / PNG / HEIC / PDF. Each file uploads right away with a progress bar; rejected files get their own message ("notes.docx can't be attached…"); failed uploads keep a Retry button; Send waits ("Uploading 1 file…") |
| Sent | `/staff/new/sent/$id` | Green result screen, "Sent on DD.MM.YYYY HH:mm", expected reply time from the department, summary (reference, department, subject, status), View inquiry / Back to my inquiries |
| Thread | `/staff/$id` | Header card with status and what it means; 6-step status stepper; message cards (yours on the `mine` background) with attachment rows (Open); centered status events ("Read by Social work", "Status: In progress"). Opening it marks replies read (badges update). Sticky reply bar: Attach, text box that grows to 5 lines, Send, footnote. Sent reply → toast "Sent · Your reply was sent to Social work" |
| Offline reply | thread | Sending while offline shows the reply right away as a dashed card with "Waiting to send" and "Will send when you're back online". Replies send in order on reconnect, each with the latest version (`If-Match`) |
| Closed thread | thread | No reply bar; slate box "This inquiry is closed · Closed by Oren Levi on …" and "Open a new inquiry on this topic" (same department and subject) |

**Calendar** — [src/features/calendar/](src/features/calendar/)

| Screen | Route | Highlights |
|---|---|---|
| Month | `/calendar?view=month&date=` | Month / Week / List control, legend chips ("Personal · Miriam" dot, "Center event" diamond). Grid starts on Sunday; today outlined, selected day filled; blue dots for personal items, pink diamonds for center events. Month arrows. Selected day's items below, or "Nothing is scheduled for this day." |
| Week | `?view=week` | "This week" + `11.10.2026 – 17.10.2026`, previous / next week, 7 day rows (today filled) with items or "Nothing scheduled" |
| List | `?view=list` | The next 4 months grouped by day ("Today · Wednesday · 14.10.2026") |
| Appointment | `/calendar/$id` | Chips (Personal, Needs your confirmation / Confirmed), details (date and time, place, with, purpose, "Moved from … on …", notes), "Confirm I will attend" → green "Confirmed · see you there" + toast "Ward B was notified…" (queues offline like replies). "Ask a question" (new inquiry to the right department) and "Add to my calendar" (downloads an `.ics`) |
| Center event | `/calendar/$id` | Shared event detail (Phase 4 reuses it): cover, chips (Center event, Awaiting your RSVP), text, date and time, place, who can come, accessibility, program, "RSVP to this event" → the Phase 4 RSVP route, reply-by date |

**Mock backend**
- Endpoints: `/departments`, inquiries list (search, department, status, sort, cursor, counts), detail, create (idempotent), reply (`If-Match` → 409 on mismatch, 410 when closed), mark read, `POST /attachments` (10 MB → 413, wrong type → 415), files at `/media/files/:id`; calendar range, item detail, confirm, `.ics`, `/events/:id`.
- The 6 inquiries from the design for Miriam (and one for Avraham); 6 personal appointments and 5 center events between October and December.
- Home now follows this data: the Contact Staff badge counts unread replies, the Calendar badge counts appointments to confirm, and "Reply needed" disappears from Home after you reply.

### Acceptance
- ✅ Sending a reply while Offline queues it, shows "Will send when you're back online", and sends on reconnect (e2e, using the Dev panel's Offline → Normal).
- ✅ Month grid starts on Sunday; today outlined, selected day filled, dots + diamonds; in Hebrew the grid reads right-to-left (e2e checks Sunday is the rightmost column).
- ✅ Search, department, status, sort, calendar view and date all survive reload (e2e).
- ✅ Also tested: the full new-inquiry flow with an upload and a rejected file, validation messages, the discard prompt, the closed thread, confirming an appointment, the `.ics` download, center event → RSVP route, no horizontal overflow at 320 / 430 px in Hebrew.
- ✅ Network simulator: Force 403 → no-permission state, Offline → offline state, Very slow → slow note then data (scripted run).
- Totals: typecheck, lint, i18n check and build pass; 43 unit tests and 44 e2e tests pass.

### Fixed during checks
- **12px text was never 12px (since Phase 0).** The font-size token `text-label` had the same name as the `label` color, so Tailwind only produced the color. Every chip, section header, list-row kind label and stepper label was rendering at the inherited size. The size token is now `text-tag`; text and chips across all screens are now at the design's 12px. **Don't give a font-size token the same name as a color token.**
- Invalid fields lost their red border while focused (the focus color won); errors now stay red.
- The "Force 401" simulator could be used up by a photo request on Home, so the session didn't lock (a flaky Phase 1 test). Images and files no longer trigger it.

### Decisions (where the spec didn't say)
- **New inquiry while offline:** Send is disabled with "Connect to the internet to send your inquiry." (replies and appointment confirmations do queue). Queuing a new inquiry would need a "pending inquiry" in the list; tell me if you want it.
- **Department names** are localized in the app from the code (the contract says enum codes are localized in the app); the API's `hint` and `expectedResponse` are shown as sent.
- **A department link opens the message step directly** (e.g. "Inquiry" on a staff contact); Change goes back to the grid.
- **Status descriptions for Read and Handled** weren't designed; I wrote them (see new copy).
- **Center events open inside the Calendar** (`/calendar/$id`, back to Calendar) using the shared event detail; `/more/events/$id` will use the same component in Phase 4.
- **Hebrew "(you)"** uses the neutral "(אתם)" because the member's gender isn't known (the design writes "(את)").
- **Uploads and replies with attachments** need a connection (Attach is disabled offline); text-only replies queue.

---

## New copy added (not in the design files)
All added in both languages; **the Hebrew needs a native-speaker review.**

- **States:** taking longer than usual, couldn't load, contact the care center, request ID, section error, item no longer available, offline (never loaded), back online, deadline passed, too many attempts, still sending, will send when back online.
- **Statuses:** Draft, Waiting to send. Tab bar / header screen-reader labels. "Coming in Phase N".
- **Auth:** username / phone / reused / policy validation, Weak / Good / Strong, "Password saved", offline notes, country code, verification code, wrong / expired / too-many code messages, "We sent a new code", "You can sign in again".
- **Relations:** son, spouse, sibling, grandchild, guardian, other.
- **Center:** day abbreviations and the office-hours format.
- **Phase 2:**
  - Greetings: afternoon, evening and night.
  - Home: "Nothing new since your last visit" and "You're all caught up" (in the spec, not the design); New survey / New event; Review / Continue buttons; "Center event"; "Nothing waiting", "No new invitations"; pull-to-refresh labels.
  - Updates: categories Health / Social / Daily life / Other; "No updates yet"; loading more; end of list; "Photo unavailable"; screen-reader labels for photos and segments.
  - Medical and care plan: empty states; "Needs attention".
  - Day: "Cancelled", "Nothing scheduled", Previous / Next day.
  - Permissions: a general not-shared message and "Ask the staff".
  - Status: "Not started".
- **Phase 3:**
  - Inquiries: "All", sort labels, department sheet title, no-results text without a department / for filters only, empty-state body, loading more.
  - New inquiry: discard sheet (title, body, Discard, Keep writing), offline note, upload states (Uploading…, Upload failed, Retry, Remove label), validation messages for subject, message, reply and files.
  - Thread: Read / Handled descriptions, "closed meanwhile" and "couldn't send" messages, "Closed on …" without a name.
  - Calendar: "Today ·" headers, previous / next month and week labels, "All day", empty list, day-cell screen-reader labels, notes, download failed.
  - Events: RSVP chips (attending / not attending / undecided), "Change my RSVP", "Replies closed on …", program.

## Open questions
1. **Shared status labels in Hebrew:** they use one grammatical form; the design uses different forms per item type (סגור / סגורה). Each screen can override the label. OK?
2. **Contact phone on error screens:** "Contact the care center" appears only once the center phone is loaded.
3. **`/auth/reauth`:** how is the user identified? The app sends the current, possibly expired, access token.
4. **429 responses:** the contract gives no wait time. The app reads `details.retryAfterSec` and falls back to 1 minute.
5. **Resident gender:** the design writes "(בת 87)", which depends on the resident's gender. The API has no gender field, so the Hebrew uses the neutral "(גיל 87)". Should the API add one?
6. **Colors:** staff avatars and care-plan goals have no color in the API, so the app derives them. Is that OK, or should the API send them?
7. **Since your last visit:** how do `POST /me/visits` and the dashboard's `sinceLastVisit.since` relate? Is `since` the visit before this session's call?
8. **Member gender:** the design uses gendered Hebrew for the member ("(את)", "את:"). Without a gender field the app uses the neutral "(אתם)" / "אתם:".
9. **Department names:** the API sends `name` in `/departments`, but the contract also says enum codes are localized in the app. Which one is the source of truth?

## Environment notes
- **Node 20.19 pins:** TypeScript 6, Vitest 3 + jsdom 26, MSW 2, pnpm 9 (via `packageManager`). Details in [CLAUDE.md](CLAUDE.md).
- **E2E browser:** Playwright uses your installed Chrome (`channel: 'chrome'`).
