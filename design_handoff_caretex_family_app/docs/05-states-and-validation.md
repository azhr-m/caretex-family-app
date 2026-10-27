# 05 · States and validation

Every data screen is wrapped in `<QueryBoundary query={…} skeleton={<XSkeleton/>} empty={…} isEmpty={fn}>`. The boundary decides which of the states below to render. Copy keys live in the `states` namespace (copy from `FamilyAccount.dc.html` / `FamilyScreen.dc.html` where designed; add HE+EN for the rest).

## 1. Loading
- First load: screen-specific **skeleton** that mirrors the final layout (header and tab bar stay real; resident switcher shows avatar + 2 lines skeleton). Design: `stateSkeleton` ("Loading the latest from CARETEX…" with `loader` icon on top).
- Skeleton appears only after **300 ms** (avoid flashes). Keep previous data while refetching (`placeholderData: keepPreviousData`) and show a 2px top progress line instead.
- Buttons: inline spinner replaces the icon, label stays, button disabled, `aria-busy`.
- Pull-to-refresh on lists: native-feeling indicator, then toast only on error.

## 2. Slow network
- If a query is still pending after **8 s**: under the skeleton show an inline note (slate `snail` icon) "This is taking longer than usual. Check your connection." + "Try again" (refetch).
- Mutations pending > 8 s: button label changes to "Still sending…"; never auto-cancel; at 20 s timeout → error state below with "Try again". Mutations are idempotent via `Idempotency-Key` header (uuid per user action) so retry is safe.
- Images: low-quality `thumbnailUrl` first, then full; striped placeholder while loading; broken image → placeholder with `image-off` + "Photo unavailable".

## 3. Errors
| Case | UI |
|---|---|
| Query failed (5xx, timeout, network) | `ErrorState`: red-tinted `cloud-alert` tile, "We couldn't load this", "Something went wrong on our side. Your information is safe.", primary "Try again", secondary "Contact the care center" (`tel:`). Shows `requestId` small for support. |
| Section-level (Home cards) | Compact inline card: icon + "Couldn't load this section" + "Try again" link. |
| Mutation failed | Keep the form and input. Red alert box above the submit button (`stateError` design): title + explanation + "Try again". Plus error toast for non-form actions (6 s, with Retry action). |
| 404 | "This item is no longer available" + "Back". (e.g. deleted update) |
| 410 DEADLINE_PASSED | Inline amber box: "The deadline for this passed on DD.MM.YYYY." Action disabled. |
| 409 VERSION_CONFLICT | Amber "This information has changed since you opened it" banner with "Refresh" (`stateChanged`). After refresh, re-apply user's unsent text if any. |
| 429 | "Too many attempts. Try again in {n} minutes." |
| 422 field errors | Map `fields` codes to messages under the matching inputs; focus first invalid field. |

## 4. Session, auth and permission
- **Session expired / idle** → SessionLockSheet (1.8), content blurred + inert. On success resume exactly; queued mutations continue.
- **Refresh failed while offline** → do not lock; wait for online, then refresh.
- **SESSION_REVOKED / ACCOUNT_BLOCKED** → clear everything → `/blocked`.
- **PASSWORD_CHANGE_REQUIRED** on any call → `/login/first-password`.
- **Permission denied (403) / not shared** → `PermissionState` (3.8a / 3.8b). Never silently hide a section the user expects; only `hidden` permissions are omitted entirely.
- **Resident unlinked while in use** (403 on resident) → toast "You no longer have access to {name}" → picker.

## 5. Form validation (TanStack Form + Zod)
General: validate on blur, re-validate on change after first error, full validation on submit; errors show under the field (13px danger, `circle-x` icon), field border 1.5px→2px danger, `aria-invalid` + `aria-describedby`; first invalid field focused and scrolled into view. Submit buttons are enabled (except where design shows disabled: first-password "Save and continue", sign "Sign and send", survey required), and show the errors on tap. Trim whitespace. Preserve drafts on navigation away (confirm-discard sheet).

### 5.1 Sign in
- identifier: required; if all digits/dashes → Israeli mobile `^0?5\d{8}$` after stripping `-`/spaces (normalize to `+9725…`); else username `^[a-zA-Z0-9._-]{3,50}$`. Messages: "Enter your phone number or username" / "Enter a valid mobile number, for example 050-123-4567".
- password: required, "Enter your password".
### 5.2 Passwords (first, reset, change)
Policy from `GET /auth/password-policy`; live checklist; confirm must match; server `reused` → "You used this password recently. Choose a different one." Change-password also requires current password.
### 5.3 Forgot phone / OTP
Phone: 9 digits starting with 5 (with +972 prefix). OTP: exactly `codeLength` digits; auto-submit when complete; errors per §1.5.
### 5.4 New inquiry / reply
department required · subject 3–80 chars · message 10–1000 (counter turns amber at 900, red at limit) · reply 1–1000 · attachments ≤ 5, each ≤ 10 MB, types jpg/jpeg/png/heic/pdf; reject with inline message per file ("walking-plan.docx can't be attached. Use JPG, PNG or PDF."). Upload failures show Retry on the file row; submit disabled while uploads pending (button "Uploading 1 file…").
### 5.5 Service request
type required · description 5–500 · preferredTime optional · ≤ 3 photos.
### 5.6 Survey answers
| Type | UI | Validation |
|---|---|---|
| single | radio cards 58h | required → one option |
| multiple | checkbox cards | min/max if given ("Choose up to 3") |
| yes_no | 2 large cards 120h (thumbs-up/down) | required |
| number | 0–10 grid 6 cols (dir ltr), min/max labels below | required |
| stars | 5 stars 40px with numbers, label chip | required |
| satisfaction | 5 radio cards with face icons angry→laugh | required |
| text | textarea 160h + counter | maxLength; optional unless required |
| date | date field (native picker, displays DD.MM.YYYY) + optional "none" checkbox | within min/max |
| dropdown | select (listbox styled per design) | required |
Conditional (`showIf`) evaluated on every answer change. Draft auto-saves 1 s after change (local first, then server; offline → local only and sync later). Review shows "No answer" for skipped optional questions.
### 5.7 RSVP
status required · if attending: guests 0..maxGuests, guestNames length = guests, each 2–60 chars ("Enter the guest's name") · note ≤ 300 · deadline enforced (410).
### 5.8 Documents
sign: stroke count ≥ 1 and bounding box ≥ 40×15 px ("Please sign inside the box"), consent checkbox required · decline: reason 5–300 · confirm-read: checkbox required.
### 5.9 Settings
Toggles save immediately (optimistic, rollback + error toast on failure). Language/theme apply locally first, then `PATCH /me/preferences` (failure keeps local value and retries later).

## 6. Empty states (copy per screen, icon tile 88–96 r26–28 + title + body + action)
Home attention: "You're all caught up" · Since last visit: "Nothing new since your last visit" · Updates: "No updates yet · When the staff share an update about Miriam, it will appear here." · Medical (all categories empty): "No medical information has been shared yet" · Inquiries: "You haven't opened any inquiries yet" + New inquiry · Calendar day: "Nothing is scheduled for this day." · Documents tab: "There are currently no documents awaiting action" + View completed · Surveys active: "There are no open surveys right now" · Feed: "No updates in this category" · Archive search: no-results template · Service requests: "No service requests yet" + New request · Notifications: "You're all caught up".

## 7. Search with no results (`inqNoResults`)
`search-x` tile, title "No inquiries match your search", body names the query and active filters, actions "Clear search and filters" + primary create action. Same template for Archive search.

## 8. Offline
- Detect via `navigator.onLine` events + failed fetches (TypeError) + MSW simulator.
- **Banner** (`stateOffline`) under the header/top bar, slate `#3B424F` white text, `wifi-off`: "No internet connection · Showing information saved at HH:mm. New requests will be sent when you're back online." Sticky; animates in/out; `role="status"`.
- Cached query data stays visible (memory cache only). Screens never fetched → ErrorState variant "You're offline · Connect to the internet to see this." + "Try again".
- Mutations pause (TanStack `networkMode: 'online'`): button returns to normal and a pending chip appears on the item ("Waiting to send" amber `clock`). On reconnect they run in order; success toast "Sent". Legal actions (**sign, approve, confirm read, survey submit, RSVP, password**) are **not queued**: buttons disabled offline with helper "Connect to the internet to sign."
- Back online → banner "You're back online" green for 3 s, refetch active queries.

## 9. Changed since opened
See `02-architecture.md` §2 versioning. Amber banner (`stateChanged`) at top of the content with "Refresh" button; refresh scrolls to top and highlights changed status for 2 s.

## 10. Success feedback
- Toast (`stateToast`): green check circle + title + body, bottom above tab bar/action bar, 4 s, `aria-live="polite"`. Titles: "Sent", "Signed", "Saved", "Read confirmed", "Confirmed", "Your RSVP was saved", "All caught up".
- Result screens for completed flows (inquiry sent, password changed, document signed/approved, survey submitted, RSVP saved, service request sent) per design.
