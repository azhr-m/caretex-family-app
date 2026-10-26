# 02 · Architecture

## 1. Folder structure
```
src/
  main.tsx                 # providers: Query, Router, i18n, Direction, Theme, MSW bootstrap (dev/mock)
  app/
    providers.tsx
    theme.ts               # resolves light|dark|system → data-theme on <html>
    idle.ts                # idle timer → session lock
  routes/                  # TanStack Router file-based routes (see §3)
  api/
    client.ts              # fetch wrapper, ApiError, refresh, timeout, Accept-Language
    schemas/               # zod schemas, one file per domain (auth, me, residents, inquiries, calendar, documents, surveys, feed, services, center, notifications, billing)
    endpoints/             # typed functions: getDashboard(residentId) etc.
    queries/               # queryOptions factories + mutation hooks per domain
    keys.ts                # query key factory
  mocks/
    browser.ts             # MSW worker
    handlers/*.ts          # one per domain, implements 04-api-contracts exactly
    fixtures/*.ts          # data extracted from design/*.dc.html (EN + HE variants)
    db.ts                  # in-memory mutable store so mutations persist during a session
    simulator.ts           # latency / offline / error injection from useNetworkStore
    scenarios.ts           # normal, firstLogin, locked, blocked, singleResident, emptyEverything
  stores/
    prefs.ts session.ts network.ts ui.ts surveyDrafts.ts
  components/
    ui/                    # shadcn primitives restyled (button, drawer, input, …)
    app/                   # AppHeader, TabBar, TopBar, ResidentSwitcherSheet, SessionLockSheet, OfflineBanner, DevPanel
    states/                # QueryBoundary, Skeletons, EmptyState, ErrorState, PermissionState, ResultScreen
    common/                # StatusChip, IconTile, ListRow, SectionHeader, Stepper, Ltr, DirIcon, ImagePlaceholder, …
  features/
    auth/ home/ resident/ staff/ calendar/ documents/ surveys/ feed/ services/ center/ permissions/ payments/ settings/ notifications/
      components/  hooks/  utils/
  lib/
    format.ts              # dates, times, phone, file size, relative "Since …"
    i18n.ts                # i18next init
    validation.ts          # shared zod rules (phone, password policy)
    status.ts              # status → tone/icon/labelKey maps
  locales/
    en/*.json  he/*.json
```

## 2. Data layer
- **TanStack Query** defaults: `staleTime 30 s`, `gcTime 5 min`, `retry: (n, err) => n < 2 && err.retryable`, `retryDelay` exponential (1 s, 3 s), `refetchOnWindowFocus: true`, `networkMode: 'online'` (queries pause offline; mutations pause and resume → offline queue).
- Mutations: invalidate the affected list + detail + `dashboard` + `notifications.count`. Use optimistic updates only for: notification read state, settings toggles, mark-all-read. Everything else waits for the server (these are care/legal actions).
- **Query keys** (`keys.ts`): `['me']`, `['residents']`, `['resident', id]`, `['dashboard', rid]`, `['updates', rid, {cursor}]`, `['update', id]`, `['medical', rid]`, `['carePlan', rid]`, `['schedule', rid, date]`, `['inquiries', rid, filters]`, `['inquiry', id]`, `['departments']`, `['calendar', rid, from, to]`, `['calendarItem', id]`, `['documents', rid, filters]`, `['document', id]`, `['surveys', rid, state]`, `['survey', id]`, `['surveyDraft', id]`, `['feed', filters]`, `['feedItem', id]`, `['event', id]`, `['serviceTypes']`, `['services', rid]`, `['service', id]`, `['center']`, `['permissions', rid]`, `['notifications']`, `['notificationsCount']`, `['billing', rid]`.
- **Persistence:** do NOT persist the query cache (medical/personal data). Persist only Zustand prefs, `activeResidentId`, and survey drafts (answers only, no PII beyond answers; cleared on logout).
- **Versioning / "changed since opened":** every detail entity has `version` (int) and `updatedAt`. Detail queries `refetchInterval: 60 s` while visible. If a refetch returns a higher `version` than the one rendered when the user started interacting (tracked in component state), keep showing the old data and show the amber "This information has changed since you opened it · Refresh" banner. Mutations send `If-Match: <version>`; a `409 VERSION_CONFLICT` shows the same banner.
- **Uploads:** `POST /attachments` (multipart) before submitting the form; show per-file progress via `XMLHttpRequest` upload events; form submits attachment IDs.

## 3. Routes (TanStack Router)
Public:
```
/                         → redirect (splash logic)
/splash
/welcome/language         first run only (no stored language)
/login
/login/first-password     requires temp session (mustChangePassword)
/forgot                   ?step=phone|code|password|done  (state in store, not URL, except step)
/locked
/blocked
```
Authenticated (`_auth` layout: guard + idle timer + SessionLockSheet):
```
/select-resident
/r/$rid                   (_shell layout: AppHeader + TabBar; resident guard checks rid ∈ linked residents)
  /home
  /resident               → redirect to first permitted segment
  /resident/general
  /resident/updates
  /resident/updates/$updateId          (top bar, no tabs)
  /resident/updates/$updateId/photos/$index   (full-screen modal route)
  /resident/medical
  /resident/care-plan
  /resident/day           ?date=YYYY-MM-DD
  /staff                  ?q=&dept=&status=
  /staff/new              ?step=department|message   (top bar)
  /staff/new/sent/$inquiryId
  /staff/$inquiryId
  /calendar               ?view=month|week|list&date=YYYY-MM-DD
  /calendar/$itemId
  /more
  /more/documents         ?tab=sign|confirm|done&type=&year=
  /more/documents/$docId
  /more/documents/$docId/done
  /more/surveys           ?tab=active|completed
  /more/surveys/$surveyId                    (intro)
  /more/surveys/$surveyId/q/$questionId
  /more/surveys/$surveyId/review
  /more/surveys/$surveyId/done
  /more/feed              ?cat=all|updates|news|activities|events
  /more/feed/$itemId                          (newsletter / update / activity detail)
  /more/feed/archive      ?q=
  /more/events/$eventId
  /more/events/$eventId/rsvp
  /more/events/$eventId/rsvp/done
  /more/services
  /more/services/new
  /more/services/sent/$requestId
  /more/services/$requestId
  /more/center
  /more/center/guide
  /more/permissions       ?resident=
  /more/payments
  /more/settings
  /notifications
```
Tabs show on: `home`, `resident/*` segments, `staff`, `calendar`, `more`. All other routes use `TopBar` (back + title) and no tab bar. Back uses `router.history.back()` when there is history, else the parent route.

Route `pendingComponent` = the screen's skeleton (shown after 300 ms). `errorComponent` = `ErrorState`.

## 4. Zustand stores
```ts
prefs:   { language: 'en'|'he'|null, theme: 'light'|'dark'|'system', setLanguage, setTheme }   // persisted (localStorage)
session: { accessToken?, refreshToken?, expiresAt?, member?: Member, activeResidentId?: string,
           locked: boolean, lastActivityAt: number, mustChangePassword: boolean,
           login(), logout(), lock(), unlock(), setActiveResident() }  // refreshToken in sessionStorage, activeResidentId persisted
network: { online: boolean, simulator: 'normal'|'slow'|'offline'|'flaky'|'expire'|'forbidden' }
ui:      { residentSheetOpen, … }
surveyDrafts: { [surveyId]: { answers: Record<questionId, Answer>, currentQuestionId, savedAt } }  // persisted, cleared on logout
```

## 5. i18n and RTL
- Keys are namespaced, English copy as source. Interpolation for names/dates/counts; ICU-style plurals via i18next (`_one`, `_other`; Hebrew also `_two`).
- `<html lang="he" dir="rtl">` set on change. Radix `DirectionProvider dir`. vaul/sonner respect `dir`.
- Tailwind: logical utilities only; `rtl:`/`ltr:` variants only for icon mirroring and swipe direction.
- `DirIcon` renders a Lucide icon with `rtl:-scale-x-100` for the directional set (see tokens §7).
- `Ltr` component = `<bdi dir="ltr" className="unicode-bidi-isolate">`. Use for phones, dates, times, IDs, file names, emails, numbers mixed with text, "CARETEX". Inputs for phone/OTP/password have `dir="ltr"` and `text-start`.
- Tab bar order, steppers, progress bars, calendar grid, carousels, swipe gestures all mirror automatically through flex/grid + `dir`; verify each.
- **Overflow rules:** flex rows `min-w-0` on text column; titles wrap (max 3 lines then clamp where specified); chips `whitespace-nowrap` but their row wraps (`flex-wrap gap-2`); horizontal scrollers (filter chips, segments) use `overflow-x-auto` with edge padding and `scroll-snap` and must not cause page-level horizontal scroll; numbers use `tabular-nums`.
- Dev "long strings" mode (Phase 6): wraps every translation as `⟦text text⟧` to stress layouts.

## 6. Theming
`theme.ts` resolves `system` via `matchMedia('(prefers-color-scheme: dark)')` with a change listener; sets `data-theme` on `<html>` and `<meta name="theme-color">` (`#FCF8F1` / `#10141C`; splash `#1F2A44`).

## 7. Session and security
- Access token in memory, refresh token in `sessionStorage` (cleared when the tab closes). On app start with a refresh token → `POST /auth/refresh`.
- Idle timer: any pointer/key/scroll resets `lastActivityAt`. After **10 min** (`VITE_IDLE_MINUTES`) → `lock()`: content gets `filter: blur(9px)`, `aria-hidden`, `inert`; SessionLockSheet asks for the password (`POST /auth/reauth`). Also lock when the app returns from background after > 10 min.
- 401 with `TOKEN_EXPIRED` → single refresh attempt (de-duplicated) → retry; if refresh fails → lock sheet (not a hard logout) so the user keeps their place. 401 `SESSION_REVOKED` / 403 `ACCOUNT_BLOCKED` → hard logout to `/blocked`.
- Logout: `POST /auth/logout`, clear query cache, stores (except prefs), survey drafts, unregister push.

## 8. Mocks (MSW)
- Enabled when `VITE_USE_MOCKS=true` (default in dev and in the demo build).
- Handlers implement the exact contract from `04-api-contracts.md`, including errors. They read `Accept-Language` and return the matching `en`/`he` fixture strings (the backend will localize staff-authored content as stored; the mock simulates both).
- `db.ts` holds mutable copies of fixtures so creating an inquiry, signing a document, saving an RSVP, etc. persists until reload.
- `simulator.ts`: `slow` → 2000–4000 ms latency; `offline` → `HttpResponse.error()` + set `navigator`-like offline flag; `flaky` → 20% `503`; `expire` → next request `401 TOKEN_EXPIRED` and refresh fails; `forbidden` → resident-scoped GETs return `403 PERMISSION_DENIED`.
- Default latency in normal mode: 250–600 ms (so skeletons are visible).
