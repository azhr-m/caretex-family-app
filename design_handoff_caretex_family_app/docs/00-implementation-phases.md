# 00 · Implementation phases

Seven phases. Each one ends in a runnable app. Stop after each phase for review.

Legend: **Read** = docs/design to read for the phase · **Build** = scope · **Done when** = acceptance checklist.

---

## Phase 0 — Foundation
**Read:** `CLAUDE.md`, `01-design-tokens.md`, `02-architecture.md`, `06-components.md`, `05-states-and-validation.md` (sections 1–3), `04-api-contracts.md` (section 0 "Conventions" only).

**Build**
1. Vite + React 19 + TS strict + pnpm. ESLint (incl. a custom rule or `eslint-plugin-tailwindcss` config that bans physical direction classes `ml-|mr-|pl-|pr-|left-|right-|text-left|text-right|rounded-l|rounded-r|border-l|border-r`), Prettier, Vitest, Playwright.
2. Tailwind v4 with CSS variables for every token in `01-design-tokens.md`, light + dark (`[data-theme="dark"]`). Fonts: Nunito (en) and Rubik (he) via `@fontsource`, switched by `html[lang]`.
3. i18next with namespaces (`common`, `auth`, `home`, `resident`, `staff`, `calendar`, `documents`, `surveys`, `feed`, `services`, `center`, `settings`, `notifications`, `states`, `validation`). Language detection: stored preference → device → `en`. On change: set `<html lang dir>`, swap font, update Radix `DirectionProvider`. Script `pnpm i18n:check`.
4. Zustand stores: `usePrefsStore` (language, themePreference light|dark|system, persisted), `useSessionStore` (tokens in memory + refresh token in sessionStorage, member, activeResidentId persisted, lastActivityAt), `useNetworkStore` (online, simulator mode), `useUiStore` (sheets).
5. TanStack Router file-based route tree with all routes from `02-architecture.md` stubbed ("Coming in Phase N" placeholders), auth guard, resident guard.
6. TanStack Query client (defaults in `02-architecture.md`), `onlineManager` wired to `useNetworkStore`.
7. API layer `src/api/client.ts` (fetch wrapper: base URL, `Accept-Language`, auth header, refresh-on-401 once, timeout 20 s, error normalization to `ApiError`), Zod-validated responses.
8. MSW v2 browser worker with a handler skeleton, latency + error injection driven by the network simulator, fixtures folder.
9. Shared UI primitives from `06-components.md`: `Button`, `IconTile`, `StatusChip`, `Card`, `ListRow`, `SectionHeader`, `TextField`, `PasswordField`, `TextArea`, `SegmentedControl`, `FilterChips`, `Stepper`, `BottomSheet`, `Toast` (sonner), `Banner`, `Skeleton`, `EmptyState`, `ResultScreen`, `ErrorState`, `QueryBoundary`, `AppHeader`, `TopBar`, `TabBar`, `Fab`, `Ltr`, `DirIcon`, `ImagePlaceholder`, `Toggle`.
10. `/dev/components` page rendering every primitive in all variants (dev only), and the Dev panel.

**Done when**
- [ ] `/dev/components` renders every primitive; switching EN↔HE mirrors layout correctly; Light↔Dark swaps all colors; nothing overflows at 320 px.
- [ ] Network simulator modes visibly affect a demo query (skeleton → slow notice → error/offline states).
- [ ] Lint blocks a physical-direction class. `pnpm i18n:check` passes.

---

## Phase 1 — Onboarding, auth and security
**Read:** `03-screens.md` §1, `04-api-contracts.md` §1–2, `05-states-and-validation.md` §4 (session) + §5 (auth forms). Design: `FamilyScreen.dc.html` (screens `splash … picker`, `session`, `pickerSheet`).

**Build:** Splash → first-run Language → Sign in (show/hide, errors, attempts left) → First-login create password (live rules) → Forgot password 3 steps + success (OTP with resend timer, paste, auto-advance) → Locked → Blocked → Resident picker → Session timeout sheet (idle 10 min + 401 refresh failure, blurred content) → Logout. Header resident switcher sheet. Mock scenarios: normal, first login, wrong password, locked, blocked, single resident (skip picker).

**Done when**
- [ ] All mock scenarios reachable from the Dev panel; each produces the designed screen.
- [ ] After 10 min idle (configurable to 30 s in dev) content blurs and the reauth sheet appears; correct password restores the exact route and scroll.
- [ ] Back button / browser back never returns to auth screens after login.

---

## Phase 2 — Home and Resident tab
**Read:** `03-screens.md` §2–3, `04-api-contracts.md` §3–4. Design: `FamilyScreen.dc.html` (`home`, `res*`).

**Build:** App shell (header + tab bar with badges), Home dashboard (resident card, Since your last visit, Needs your attention, Latest update, Upcoming appointment, Resident's day preview, Quick actions), Resident tab with permission-aware segments (General, Updates, Update detail, Photo viewer, Medical, Care plan, Day), permission states (denied / not shared). Switching resident refetches everything and resets scroll.

**Done when**
- [ ] Avraham shows "No permission" on Care plan and "Not yet shared" on Medical; segments show lock/hourglass icons.
- [ ] Photo viewer: swipe, prev/next buttons, close, counter `1 / 3`, works in RTL (swipe direction mirrored).
- [ ] Home "Needs your attention" cards and quick actions route to placeholder routes of later phases.

---

## Phase 3 — Contact Staff and Calendar
**Read:** `03-screens.md` §4–5, `04-api-contracts.md` §5–6, `05-states-and-validation.md` §5 (inquiry form). Design: `FamilyStaffCal.dc.html`.

**Build:** Inquiry list (search debounce 300 ms, department + status filters in URL search params, "New reply" marker, FAB), New inquiry 2 steps (department grid, subject/message/attachments with upload progress), Sent screen, Thread (status stepper, message cards, inline status events, attachments, reply box with validation, closed state), No-results state. Calendar month/week/list (view + date in URL), personal vs center marking, appointment detail with confirm, center event detail → RSVP (Phase 4 route).

**Done when**
- [ ] Sending a reply while Offline queues it, shows "Will send when you're back online", and sends on reconnect.
- [ ] Month grid starts on Sunday, today outlined, selected day filled, dots + diamonds; RTL grid reads right-to-left.
- [ ] Filters and search survive reload (URL state).

---

## Phase 4 — Documents, Surveys, Updates & Events
**Read:** `03-screens.md` §6.1–6.5, `04-api-contracts.md` §7–9, `05-states-and-validation.md` §5. Design: `FamilyMore.dc.html`.

**Build:** More menu. Documents list (tabs To sign/To confirm/Completed, type + year filters), viewer (PDF via `<iframe>`/pdf.js fallback to rendered HTML in mocks), sign sheet with signature pad (`signature_pad`), approve/decline (decline requires reason sheet), confirm read, success screens. Surveys list (Active/Completed), intro, question engine for 9 types + conditional logic, progress, auto-save draft (debounced 1 s, server + local), save-and-exit sheet, review with edit, submit, thank you. Feed with category chips, newsletter detail with PDF + confirm read, event invitation, RSVP form, RSVP saved, archive with search.

**Done when**
- [ ] Survey: answering "No" on Q3 inserts Q3a; changing it to "Yes" removes Q3a and its answer; progress reflects the visible question count.
- [ ] Killing the tab mid-survey and reopening resumes at the last unanswered question.
- [ ] Signature cannot be submitted empty or without the consent checkbox; signed doc shows "Signed on DD.MM.YYYY HH:mm".

---

## Phase 5 — Services, Center, Permissions, Payments, Settings, Notifications
**Read:** `03-screens.md` §6.6–6.10 and §7, `04-api-contracts.md` §10–14. Design: `FamilyAccount.dc.html`.

**Build:** Service requests (list, new with type grid, sent, detail with stepper + activity log + comment + cancel with confirm). Center info (call/email/directions deep links `tel:`, `mailto:`, maps URL) + guide. Permissions (read-only, per resident). Payments "Coming soon" preview + notify-me toggle. Settings (language, theme incl. System via `matchMedia`, notification toggles saved optimistically with rollback, change password, Face ID row as "Coming soon" on web, privacy/terms, log out sheet). Notification center (grouped by date, unread styling, mark all read, deep links incl. resident switching). Lock-screen push: implement Web Push subscription stub + document payload rules; show generic text only.

**Done when**
- [ ] Every notification row deep-links to the right screen, switching active resident first if needed.
- [ ] Theme "System" follows OS changes live.
- [ ] Changing language in Settings re-renders the whole app in place (no reload) and keeps the route.

---

## Phase 6 — Hardening
**Build / verify**
- Playwright visual snapshots for the 8 variant screens (Login, Home, Resident, Inquiry thread, Document signing, Survey question, Event RSVP, Settings) × EN/HE × Light/Dark at 390×844, plus 320×640 and 430×932 smoke shots of every route.
- Playwright e2e: login → sign document; new inquiry → reply; survey with conditional → submit; RSVP; offline reply queue; session expiry restore.
- Overflow test: a dev "long strings" mode that doubles every translation length; no horizontal scroll, no clipped text on any route.
- a11y: axe on every route (0 serious), focus order, visible focus rings, screen-reader labels on header/tab badges ("5 unread notifications"), `aria-live` for toasts and form errors, `prefers-reduced-motion`.
- Performance: route-level code splitting, Lighthouse mobile ≥ 90 performance / 100 a11y.
- PWA: manifest, icons, offline shell (app shell only; no resident data cached by the SW).
- Write `docs/BACKEND_INTEGRATION.md` in the repo: how to switch MSW off and point `VITE_API_BASE_URL` at CARETEX, list of endpoints and any contract changes made during the build.

**Done when** all of the above pass in CI.
