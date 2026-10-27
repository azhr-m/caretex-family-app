# Backend integration

How to run the Family App against the real CARETEX API instead of the MSW mocks, what it calls, and what changed from the handoff contract during the build.

The contract itself is [`design_handoff_caretex_family_app/docs/04-api-contracts.md`](../design_handoff_caretex_family_app/docs/04-api-contracts.md). Every response is validated by the Zod schemas in [`src/api/schemas/`](../src/api/schemas/); a shape mismatch shows the screen's error state, not broken data.

## 1. Switch the mocks off

Set two variables (in `.env.local`, or the hosting environment for builds):

```bash
VITE_USE_MOCKS=false
VITE_API_BASE_URL=https://api.caretex.example/family/v1   # no trailing slash
```

| Variable | Default | Notes |
|---|---|---|
| `VITE_USE_MOCKS` | `true` in `.env` | `false` drops MSW from the bundle entirely (the import is compiled out). |
| `VITE_API_BASE_URL` | `/api` | Absolute URL, or a same-origin path behind a reverse proxy. |
| `VITE_IDLE_MINUTES` | `10` | Idle time before the session-lock sheet. |
| `VITE_APP_VERSION` | `0.1.0` | Sent as `X-App-Version`. |
| `VITE_MOCK_NOW` | set in `.env` | **Mock clock. Remove it for real data**, or "today" in the calendar stays 14.10.2026. |
| `VITE_VAPID_PUBLIC_KEY` | unset | Enables web push (see [PUSH.md](../PUSH.md)). |

Then `pnpm build` and serve `dist/` as a single-page app: every unknown path must return `index.html`, and `/sw.js` must be served with `Cache-Control: no-cache` so app updates reach users.

`pnpm build:prod` builds with mocks off into `dist-prod/` (used by Lighthouse and the PWA test). It keeps `VITE_API_BASE_URL=/api`, so it renders the sign-in screens but has no data unless something answers on `/api`.

### Local development against a real API

Point Vite's proxy at the API so the browser stays same-origin (no CORS during development). Add to `vite.config.ts`:

```ts
server: { port: 5175, proxy: { '/api': { target: 'http://localhost:8080', rewrite: (p) => p.replace(/^\/api/, '/family/v1') } } },
```

and run with `VITE_USE_MOCKS=false`.

## 2. What every request carries

| Header | When |
|---|---|
| `Authorization: Bearer <accessToken>` | Every call except sign-in, refresh, forgot password and the two public endpoints |
| `Accept-Language: en\|he` | Always; the active app language. Staff-authored text should come back in this language where a translation exists |
| `X-App-Version`, `X-Request-Id` (uuid) | Always |
| `Idempotency-Key` | New inquiries, inquiry replies, new service requests, service request comments, appointment confirms and survey submit. A replay with the same key must return the first result, not create a second record; queued offline replies and confirms rely on this |
| `If-Match: <version>` | Inquiry replies and document signatures. Answer `409 VERSION_CONFLICT` with `details.currentVersion` |
| `Content-Type: application/json` | Bodies, except `POST /attachments` (multipart) |

**If the API is on another origin**, CORS must allow those request headers and the methods `GET, POST, PUT, PATCH, DELETE`, and expose `Retry-After`.

**Errors** must use the contract's envelope `{ error: { code, message, retryable, fields?, details? }, requestId }`. The app maps behavior to `error.code`, never to the message text.

## 3. Things the backend must get right

- **Media URLs must work without headers.** Photos, avatars and attachments are loaded with plain `<img src>` and opened in a new tab, which can't send a Bearer token. Return short-lived signed URLs in `url` / `photoUrl` / `thumbnailUrl`.
- **Tenant comes from the token.** The app never sends a tenant or center id. A family member's token must resolve to their center on the server, and every resident-scoped endpoint must check the resident is linked to that member (`403 PERMISSION_DENIED` otherwise).
- **Token refresh.** On `401 TOKEN_EXPIRED` the app calls `POST /auth/refresh` once and retries. If refresh fails it **locks** the session (password sheet, `POST /auth/reauth`) instead of signing out, then retries the request. `SESSION_REVOKED` signs out.
- **Versions.** `version` must increase on every change staff make: replies and signatures send it as `If-Match`, and an open service request shows "changed since you opened it" when its version moves.
- **Generic notification titles and push bodies.** No names, medical terms or message text (contract §12–13, [PUSH.md](../PUSH.md)).
- **No caching of resident data in the browser.** The service worker caches only the app's own build files; API and media responses always go to the network. `Cache-Control: no-store` on API responses is still recommended.

### Fitting CARETEX's Go API

`caretex-api` today serves the staff SPA, which sends `tenantID`/`userid` headers and uses `snake_case` JSON. The Family App contract is different: tenant from the token, and **camelCase** JSON. Suggested approach: a separate `/family/v1` route group with its own auth middleware (family-member tokens, not Firebase) and DTO structs whose `json` tags follow the contract. Mapping inside the app instead would mean rewriting every schema. This needs a decision from the backend team, because the repo's code style says JSON is snake_case.

## 4. Endpoints the app calls

Paths are relative to `VITE_API_BASE_URL`. "§" refers to sections of `04-api-contracts.md`. Code: [`src/api/endpoints/`](../src/api/endpoints/).

### Auth and account (§1, §2)
| Method | Path | Used by |
|---|---|---|
| POST | `/auth/login` | Sign in |
| POST | `/auth/refresh` | Automatic on `TOKEN_EXPIRED` |
| POST | `/auth/logout` | Log out |
| POST | `/auth/reauth` | Session-lock sheet |
| GET | `/auth/password-policy` | Password rules (public) |
| POST | `/auth/password/first` | First sign-in with a temporary password |
| POST | `/auth/password/forgot` · `/forgot/resend` · `/verify-otp` · `/reset` | Forgot password |
| GET | `/center/public` | Sign-in and Blocked screens (public) |
| GET | `/me` | Session bootstrap, linked residents, preferences |
| PATCH | `/me/preferences` | Settings toggles, language, theme |
| PUT | `/me/password` | Settings → Change password |
| POST | `/me/visits` | Once per session per resident ("Since your last visit") |
| POST | `/me/devices` | Push subscription (only once a VAPID key is set) |

### Residents and Home (§3, §4)
| Method | Path | Used by |
|---|---|---|
| GET | `/residents/:rid/permissions` | Resident tab segments, Permissions screen |
| GET | `/residents/:rid/dashboard` | Home, tab badges. Each section is validated separately, so one bad section doesn't blank the page |
| GET | `/residents/:rid/updates?cursor&limit=20` | Updates list |
| GET | `/updates/:id` · POST `/updates/:id/seen` | Update detail, photo viewer |
| GET | `/residents/:rid/medical` · `/care-plan` · `/schedule?date=` | Resident tab segments |

### Contact staff (§5)
| Method | Path | Used by |
|---|---|---|
| GET | `/departments` | New inquiry, step 1 |
| GET | `/residents/:rid/inquiries?q&department&status&sort&cursor` | Inquiry list (search and filters) |
| POST | `/residents/:rid/inquiries` | Send inquiry |
| GET | `/inquiries/:id` · POST `/inquiries/:id/read` | Thread |
| POST | `/inquiries/:id/messages` | Reply (`If-Match`, `Idempotency-Key`; queued while offline) |
| POST | `/attachments` (multipart `file`) | Uploads for inquiries and service requests, with progress |

### Calendar (§6)
| Method | Path | Used by |
|---|---|---|
| GET | `/residents/:rid/calendar?from&to` | Month, week, list |
| GET | `/calendar/items/:id` · POST `/calendar/items/:id/confirm` | Appointment detail and confirm |
| GET | `/calendar/items/:id/ics` | "Add to my calendar" (file download, with auth header) |
| GET | `/events/:id` | Center event detail |

### Documents, surveys, updates and events (§7–9)
| Method | Path | Used by |
|---|---|---|
| GET | `/residents/:rid/documents?tab&type&year` · `/documents/:id` | Documents list and viewer |
| POST | `/documents/:id/sign` · `/approve` · `/confirm-read` | Legal actions (never queued offline) |
| GET | `/residents/:rid/surveys?state=active\|completed` · `/surveys/:id` | Survey list and intro |
| GET / PUT | `/surveys/:id/draft` | Draft sync (1 s after the last change; the newer of local and server wins) |
| POST | `/surveys/:id/submit` | Submit |
| GET | `/feed?category&archive&q&cursor` · `/feed/:id` · POST `/feed/:id/confirm-read` | Updates & Events, archive, newsletters |
| PUT | `/events/:id/rsvp` | RSVP |

### Services, center, notifications, billing (§10–14)
| Method | Path | Used by |
|---|---|---|
| GET | `/service-request-types` | New request type grid |
| GET / POST | `/residents/:rid/service-requests` | List and create |
| GET | `/service-requests/:id` | Detail |
| POST | `/service-requests/:id/comments` · `/cancel` | Comment, cancel |
| GET | `/center` | Center information and visit guide |
| GET | `/notifications?cursor` · `/notifications/:id` | Notification center; a tapped push opens `/open/notification/:id`, which fetches the notification and deep-links |
| POST | `/notifications/:id/read` · `/notifications/read-all` | Mark read |
| GET | `/residents/:rid/billing` | Payments ("Coming soon" while `enabled: false`) |

### In the contract but not called yet
- `GET /residents/:rid`: the resident header and Home use the residents in `/me`.
- `DELETE /me/devices/:token`: push is off until a VAPID key exists, so there is nothing to unregister yet. Add it to logout when push is enabled.

### Mock-only (never implement)
- `GET /residents/:rid/dev-demo` and `POST /dev/service-update` exist only for the Dev panel.

## 5. Contract changes and assumptions made during the build

None of these change a response shape the contract defines. They are places where the contract was silent, plus one endpoint used differently.

1. **429:** the app reads `error.details.retryAfterSec` to say how long to wait, and assumes 1 minute without it. Please send `retryAfterSec`.
2. **Submitted survey answers:** completed surveys open a read-only review. There is no endpoint for submitted answers, so the app reads them from `GET /surveys/:id/draft` after submit. Either keep the draft readable after submit, or add an endpoint and tell us.
3. **Service request title:** the form has no title field; `title` is omitted on create. The backend chooses one.
4. **More menu badges** cost three extra list calls (documents, surveys, feed). A counts endpoint (or counts in the dashboard) would remove them.
5. **`/auth/reauth`** is sent with the current (possibly expired) access token as the only identity. Confirm that's acceptable, or say what to send.
6. **Department names** are localized in the app from the department code; the `name` field from `/departments` is the fallback.

Open product questions (gendered Hebrew, password-changed date, privacy/terms links, colors) are listed in [PROGRESS.md](../PROGRESS.md#open-questions).

## 6. Checking an integration

1. `pnpm typecheck && pnpm test` (schemas and helpers).
2. Run the app against a staging API and sign in with a test family account.
3. Watch the console in dev: a `[dashboard] section failed validation` warning or an error state means a response doesn't match its schema; the Zod issue names the field.
4. The Playwright suite runs on mocks; it doesn't need the backend.
