# 04 · API contracts

These are the endpoints the app expects from CARETEX. In this build they are implemented by MSW handlers with static fixtures. The backend must return **exactly** these shapes (validated by Zod at runtime). Any change must be made here first.

## 0. Conventions
- Base URL `VITE_API_BASE_URL` (e.g. `https://api.caretex.example/family/v1`). JSON, UTF-8. HTTPS only.
- Headers sent: `Authorization: Bearer <accessToken>`, `Accept-Language: en|he`, `X-App-Version`, `X-Request-Id` (uuid). Mutations on versioned entities send `If-Match: <version>`.
- Staff-authored text (updates, messages, documents) is returned as stored; system labels (statuses, categories) are returned as **enum codes** and localized in the app.
- Dates: ISO 8601 with offset (`2026-10-14T09:41:00+03:00`); date-only fields `YYYY-MM-DD`. App formats to `DD.MM.YYYY` / `HH:mm`, `Asia/Jerusalem`.
- IDs are opaque strings. Money: `{ amount: number (minor units), currency: "ILS" }`.
- Pagination: `?cursor=&limit=20` → `{ items: T[], nextCursor: string | null }`.
- Every resident-scoped endpoint returns `403 PERMISSION_DENIED` or `200` with `{ state: "not_shared" }` per §3 permissions.

### Error envelope (all non-2xx)
```ts
type ApiError = {
  error: {
    code: ErrorCode;            // machine readable
    message: string;            // safe, localized fallback (do not show raw if a key exists)
    retryable: boolean;
    fields?: Record<string, string>;   // validation errors: field → code (e.g. "too_short")
    details?: Record<string, unknown>; // e.g. { attemptsLeft: 2 } | { lockedUntil } | { currentVersion }
  };
  requestId: string;
};
type ErrorCode =
  | 'VALIDATION_FAILED' | 'INVALID_CREDENTIALS' | 'ACCOUNT_LOCKED' | 'ACCOUNT_BLOCKED'
  | 'TOKEN_EXPIRED' | 'SESSION_REVOKED' | 'PASSWORD_CHANGE_REQUIRED'
  | 'OTP_INVALID' | 'OTP_EXPIRED' | 'OTP_TOO_MANY_ATTEMPTS' | 'RATE_LIMITED'
  | 'PERMISSION_DENIED' | 'NOT_FOUND' | 'VERSION_CONFLICT' | 'DEADLINE_PASSED'
  | 'FILE_TOO_LARGE' | 'FILE_TYPE_NOT_ALLOWED' | 'SERVICE_UNAVAILABLE' | 'INTERNAL';
```
HTTP mapping: 400/422 VALIDATION_FAILED · 401 INVALID_CREDENTIALS/TOKEN_EXPIRED/SESSION_REVOKED · 403 PERMISSION_DENIED/ACCOUNT_BLOCKED/PASSWORD_CHANGE_REQUIRED · 404 · 409 VERSION_CONFLICT · 410 DEADLINE_PASSED · 413 FILE_TOO_LARGE · 415 · 423 ACCOUNT_LOCKED · 429 RATE_LIMITED (`Retry-After`) · 503 SERVICE_UNAVAILABLE.

### Shared types
```ts
type Tone = 'blue'|'amber'|'violet'|'green'|'red'|'slate'|'teal'|'pink';
type Person = { id: string; name: string; initials: string; role: string; roleCode: StaffRole; photoUrl: string | null };
type StaffRole = 'nurse'|'head_nurse'|'physician'|'social_worker'|'physiotherapist'|'dietitian'|'activities'|'management'|'finance'|'maintenance'|'laundry'|'reception'|'other';
type Attachment = { id: string; name: string; mimeType: string; sizeBytes: number; url: string; thumbnailUrl: string | null };
type Photo = { id: string; url: string; thumbnailUrl: string; width: number; height: number; caption: string | null };
type DepartmentCode = 'nursing'|'doctor'|'social_work'|'physiotherapy'|'nutrition'|'activities'|'management'|'finance'|'maintenance'|'other';
```

---

## 1. Auth
### `POST /auth/login`
```ts
req:  { identifier: string; password: string }          // identifier = phone (digits) or username
200:  { accessToken: string; refreshToken: string; expiresAt: string;
        mustChangePassword: boolean; member: Member; }
401:  INVALID_CREDENTIALS details { attemptsLeft: number }
423:  ACCOUNT_LOCKED      details { lockedUntil: string; attemptsAllowed: 5; lockMinutes: 15 }
403:  ACCOUNT_BLOCKED     details { reason: 'deactivated'|'guardian_request'|'other' }
```
### `POST /auth/refresh` `{ refreshToken }` → same 200 shape (without member) · 401 SESSION_REVOKED
### `POST /auth/logout` `{ refreshToken }` → 204
### `POST /auth/reauth` `{ password }` → `{ accessToken, expiresAt }` · 401 INVALID_CREDENTIALS `{ attemptsLeft }`
### `GET /auth/password-policy` (public)
```json
{ "minLength": 8, "requireUppercase": true, "requireDigit": true, "requireSpecial": true,
  "specialChars": "!@#$%^&*()-_=+[]{};:,.?", "disallowPrevious": 3 }
```
### `POST /auth/password/first` (temp session) `{ newPassword }` → 200 login shape with `mustChangePassword:false` · 422 `fields.newPassword: 'policy'|'reused'`
### `PUT /me/password` `{ currentPassword, newPassword }` → 204 · 401 INVALID_CREDENTIALS · 422
### Forgot password
```ts
POST /auth/password/forgot        { phone: string /* E.164 +97250… */ }
  200 { otpSessionId: string; maskedPhone: "050-***-4127"; resendAvailableInSec: 60; expiresInSec: 600; codeLength: 6 }
  // Always 200 even if the phone is unknown (no enumeration); 429 RATE_LIMITED
POST /auth/password/forgot/resend { otpSessionId } → same 200
POST /auth/password/verify-otp    { otpSessionId, code }
  200 { resetToken: string; expiresInSec: 900 }
  400 OTP_INVALID { attemptsLeft } | OTP_EXPIRED | OTP_TOO_MANY_ATTEMPTS
POST /auth/password/reset         { resetToken, newPassword } → 200 { changedAt: string } · 422
```
### `GET /center/public` (public, for Blocked/Login screens)
```json
{ "name": "Beit Hadar Care Center", "familyOfficeName": "Family relations office", "phone": "+97235550100",
  "email": "family@beithadar.co.il", "address": "12 HaRimon St., Ramat Gan",
  "officeHours": [{ "days": "sun-thu", "from": "08:00", "to": "16:00" }] }
```

## 2. Me
### `GET /me`
```ts
type Member = { id: string; firstName: string; lastName: string; displayName: string; initials: string;
  phone: string; username: string | null; lastVisitAt: string | null;
  residents: LinkedResident[]; preferences: Preferences };
type LinkedResident = { id: string; name: string; initials: string; photoUrl: string | null;
  ward: string; room: string; relation: 'daughter'|'son'|'spouse'|'sibling'|'grandchild'|'guardian'|'other';
  isPrimaryContact: boolean; newItemsCount: number };
type Preferences = { language: 'en'|'he'; theme: 'light'|'dark'|'system';
  notifications: { updates: boolean; inquiries: boolean; documents: boolean; events: boolean; surveys: boolean };
  notifyPaymentsAvailable: boolean };
```
### `PATCH /me/preferences` Partial<Preferences> → Preferences
### `POST /me/visits` `{ residentId }` → `{ previousVisitAt: string | null }` (called once per app session per resident; defines "Since your last visit")
### `POST /me/devices` `{ platform: 'web'|'ios'|'android'; pushToken: string; locale }` → 204 · `DELETE /me/devices/:token`

## 3. Residents and permissions
### `GET /residents/:rid`
```ts
{ id, name, initials, photoUrl, dateOfBirth: "1939-05-03", ward, room, admittedOn: "2023-06-21",
  languages: string[], primaryFamilyContact: { name: string; isYou: boolean },
  staffContacts: Array<Person & { department: DepartmentCode }>,
  wardPhone: { label: string; phone: string },
  permissions: Permissions, version: number }
```
### `GET /residents/:rid/permissions`
```ts
type PermissionValue = 'allowed' | 'denied' | 'not_shared' | 'hidden';
type Permissions = { general: PermissionValue; updates: PermissionValue; medical: PermissionValue;
  carePlan: PermissionValue; schedule: PermissionValue; documents: PermissionValue;
  inquiries: PermissionValue; serviceRequests: PermissionValue; billing: PermissionValue;
  notes: Partial<Record<keyof Permissions, string>>;   // e.g. carePlan: "Shared only with the legal guardian"
  updatedAt: string };
```
Section endpoints when not allowed: `denied` → `403 PERMISSION_DENIED`; `not_shared` → `200 { state: "not_shared" }`.

## 4. Home and resident content
### `GET /residents/:rid/dashboard`
```ts
{ greetingName: string;
  sinceLastVisit: { since: string | null; items: Array<{ id: string;
      kind: 'update'|'inquiry_reply'|'document'|'calendar_change'|'request_handled'|'survey'|'event';
      title: string; occurredAt: string; actor: string | null; link: DeepLink }> };
  attention: Array<{ id: string;
      kind: 'sign_document'|'confirm_read'|'approve_document'|'survey'|'rsvp'|'inquiry_reply_needed'|'appointment_confirm';
      title: string; subtitle: string; dueAt: string | null; status: 'to_sign'|'to_confirm'|'to_approve'|'not_started'|'draft'|'awaiting_rsvp'|'waiting_for_you'|'overdue';
      link: DeepLink }>;
  latestUpdate: UpdateSummary | null;
  upcoming: CalendarItemSummary | null;
  dayPreview: ScheduleItem[];            // max 5, around "now"
  counts: { notificationsUnread: number; tabs: { resident: number; staff: number; calendar: number; more: number };
            documentsPending: number; invitationsPending: number } }
type DeepLink = { type: 'update'|'inquiry'|'document'|'calendar_item'|'service_request'|'survey'|'event'|'feed_item'|'resident_section';
                  id: string; residentId: string | null };
```
### Updates
```ts
GET /residents/:rid/updates?cursor        → Page<UpdateSummary>
type UpdateSummary = { id; title; excerpt; author: Person; publishedAt; category: 'activities'|'health'|'social'|'daily_life'|'other';
                       photos: Photo[] /* max 2 in list */; photoCount: number; isNew: boolean };
GET /updates/:id                          → UpdateSummary & { body: string; photos: Photo[]; sharedAt: string; version: number }
POST /updates/:id/seen                    → 204
```
### `GET /residents/:rid/medical`
```ts
{ state: 'ok' | 'not_shared';
  categories: Array<{ code: 'medications'|'diagnoses'|'allergies'|'doctor_visits'|'tests'|'nutrition'|'physiotherapy';
     items: Array<{ id; name: string; detail: string; flag: 'allergy'|null; sharedAt: string }> }> }
```
### `GET /residents/:rid/care-plan`
```ts
{ state: 'ok'|'not_shared'; reviewedOn: string; nextReviewOn: string;
  goals: Array<{ id; title: string; icon: string /* lucide name hint */; status: 'on_track'|'achieved'|'monitoring'|'needs_attention';
                 teamActions: string; familyActions: string }> }
```
### `GET /residents/:rid/schedule?date=YYYY-MM-DD`
```ts
{ date: string; lastUpdatedAt: string; lastUpdatedBy: string;
  items: ScheduleItem[] }
type ScheduleItem = { id; startsAt: string; endsAt: string | null; title: string; place: string;
  kind: 'care'|'meal'|'activity'|'therapy'|'rest'|'social'|'medical'|'other'; status: 'done'|'now'|'upcoming'|'cancelled' };
```

## 5. Inquiries
```ts
GET /departments → Array<{ code: DepartmentCode; name: string; hint: string; expectedResponse: string /* "1 business day" */ }>
GET /residents/:rid/inquiries?q=&department=&status=&sort=newest|oldest&cursor
  → Page<InquirySummary> & { counts: Record<InquiryStatus | 'all', number> }
type InquiryStatus = 'new'|'read'|'in_progress'|'waiting_for_family'|'handled'|'closed';
type InquirySummary = { id; ref: "INQ-2041"; subject; department: DepartmentCode; status: InquiryStatus;
  createdAt; lastMessageAt; lastMessagePreview: { authorName: string; isYou: boolean; text: string };
  hasUnreadReply: boolean };
GET /inquiries/:id → InquirySummary & { version: number; closedAt: string|null; closedBy: string|null;
  timeline: Array<
    | { type: 'message'; id; author: Person & { isYou: boolean; relation?: string }; text: string; attachments: Attachment[]; sentAt: string }
    | { type: 'status'; id; status: InquiryStatus; by: string | null; at: string } > }
POST /residents/:rid/inquiries { department, subject, message, attachmentIds: string[], relatedUpdateId?: string }
  → 201 InquirySummary & { expectedResponse: string }
POST /inquiries/:id/messages  { text, attachmentIds }  (If-Match)  → 201 timeline message; inquiry status may change → returns { message, status, version }
  410 DEADLINE_PASSED if closed
POST /inquiries/:id/read → 204
POST /attachments (multipart: file, purpose: 'inquiry'|'service_request')
  → 201 Attachment · 413 FILE_TOO_LARGE (limit 10 MB) · 415 FILE_TYPE_NOT_ALLOWED (jpg, png, heic, pdf)
```

## 6. Calendar
```ts
GET /residents/:rid/calendar?from=YYYY-MM-DD&to=YYYY-MM-DD → { items: CalendarItemSummary[] }
type CalendarItemSummary = { id; kind: 'personal'|'center_event'; category: 'doctor'|'therapy'|'hair'|'vaccine'|'call'|'activity'|'event'|'other';
  title; startsAt; endsAt: string|null; allDay: boolean; location: string;
  requiresConfirmation: boolean; confirmation: 'pending'|'confirmed'|null;
  rsvp: RsvpStatus | null; eventId: string | null; changed: { from: string; at: string } | null };
GET /calendar/items/:id → CalendarItemSummary & { with: string|null; purpose: string|null; notes: string|null; version: number }
POST /calendar/items/:id/confirm → { confirmation: 'confirmed', confirmedAt }
GET /calendar/items/:id/ics → text/calendar
```

## 7. Documents
```ts
GET /residents/:rid/documents?tab=sign|confirm|done&type=&year= → Page<DocumentSummary> & { counts: { sign, confirm, done } }
type DocumentSummary = { id; code: "NUR-FLU-2026"; title; type: 'consent'|'approval'|'policy'|'agreement'|'form'|'other';
  from: { department: DepartmentCode; name: string }; sentAt; dueAt: string|null;
  requiredAction: 'sign'|'approve'|'confirm_read'|null;
  status: 'pending'|'overdue'|'signed'|'approved'|'declined'|'read_confirmed';
  completedAt: string|null };
GET /documents/:id → DocumentSummary & { version; pages: number; fileUrl: string /* signed, short-lived PDF URL */;
  previewHtml: string | null /* optional sanitized HTML fallback */; signatureConsentText: string | null;
  approveLabel: string | null; completion: { by: string; at: string; confirmationCode: string } | null }
POST /documents/:id/sign          { signaturePng: string /* data:image/png;base64 */, consentAccepted: true, signedAt: string } (If-Match)
  → { status:'signed', completedAt, confirmationCode: "SIG-88214", signedFileUrl }
POST /documents/:id/approve       { decision: 'approved'|'declined', reason?: string /* required if declined, 5–300 */ }
  → { status, completedAt, confirmationCode }
POST /documents/:id/confirm-read  { confirmed: true } → { status:'read_confirmed', completedAt }
// 410 DEADLINE_PASSED, 409 VERSION_CONFLICT (document replaced by staff)
```

## 8. Surveys
```ts
GET /residents/:rid/surveys?state=active|completed → { items: SurveySummary[] }
type SurveySummary = { id; title; anonymous: boolean; questionCount: number; estimatedMinutes: number;
  closesAt: string; status: 'not_started'|'draft'|'submitted'|'closed'; answeredCount: number };
GET /surveys/:id → SurveySummary & { description: string; questions: Question[]; version: number }
type Question = { id: string; order: number; required: boolean; title: string; help: string | null;
  showIf: { questionId: string; equals: string | boolean | number } | null } & (
  | { type: 'single'; options: Option[] }
  | { type: 'multiple'; options: Option[]; min?: number; max?: number }
  | { type: 'yes_no' }
  | { type: 'number'; min: 0; max: 10; minLabel: string; maxLabel: string }
  | { type: 'stars'; max: 5; labels: string[] /* per star */ }
  | { type: 'satisfaction'; options: Array<Option & { level: 1|2|3|4|5 }> }
  | { type: 'text'; maxLength: number; placeholder: string | null }
  | { type: 'date'; minDate: string|null; maxDate: string|null; allowNone: boolean; noneLabel: string|null }
  | { type: 'dropdown'; options: Option[] } );
type Option = { id: string; label: string };
type Answer = string | string[] | boolean | number | { date: string } | { none: true } | null;
GET /surveys/:id/draft → { answers: Record<string, Answer>; currentQuestionId: string | null; savedAt: string } | 404
PUT /surveys/:id/draft { answers, currentQuestionId } → { savedAt }
POST /surveys/:id/submit { answers } → { submittedAt; receipt: string }
  // 422 fields: { [questionId]: 'required' } · 410 DEADLINE_PASSED
```
Conditional rule: a question with `showIf` is visible only when the referenced answer equals the value. Hidden questions are excluded from progress, review and submit (their answers deleted).

## 9. Feed, newsletters, events, RSVP
```ts
GET /feed?category=all|updates|newsletters|activities|events&archive=false&q=&cursor → Page<FeedItem>
type FeedItem = { id; category: 'update'|'newsletter'|'activity'|'event'; title; excerpt; publishedAt;
  author: string; coverUrl: string|null; requiresReadConfirmation: boolean; readConfirmedAt: string|null;
  eventId: string|null; rsvp: RsvpStatus|null };
GET /feed/:id → FeedItem & { body: string; highlights: string[]; attachments: Attachment[]; version }
POST /feed/:id/confirm-read → { readConfirmedAt }
GET /events/:id → { id; title; body; startsAt; endsAt; location; coverUrl; maxGuests: number; accessibility: string;
  program: Array<{ time: string /* HH:mm */; title: string; icon: string|null }>;
  rsvpDeadline: string; myRsvp: Rsvp | null; version }
type RsvpStatus = 'attending'|'not_attending'|'undecided';
type Rsvp = { status: RsvpStatus; guests: number; guestNames: string[]; note: string; updatedAt: string };
PUT /events/:id/rsvp { status, guests, guestNames, note } → Rsvp   // 410 DEADLINE_PASSED · 422
```

## 10. Service requests
```ts
GET /service-request-types → Array<{ code: 'maintenance'|'laundry'|'hairdresser'|'equipment'|'conversation'|'finance'|'other';
  name: string; timeOptions: Array<{ code: string; label: string }> }>
GET /residents/:rid/service-requests?cursor → Page<ServiceRequestSummary>
type ServiceStatus = 'opened'|'assigned'|'in_progress'|'handled'|'closed'|'cancelled';
type ServiceRequestSummary = { id; ref: "SR-1193"; title; type; status: ServiceStatus; createdAt; updatedAt; scheduledAt: string|null };
GET /service-requests/:id → ServiceRequestSummary & { description; preferredTime: string|null; assignee: Person|null;
  expected: string|null; attachments: Attachment[]; log: Array<{ id; status: ServiceStatus|'comment'; text: string; at: string; by: string|null }>;
  canCancel: boolean; version }
POST /residents/:rid/service-requests { type, title?, description, preferredTime, attachmentIds } → 201 ServiceRequestSummary
POST /service-requests/:id/comments { text } → log entry
POST /service-requests/:id/cancel { reason?: string } → { status: 'cancelled' } · 409 if already in progress
```

## 11. Center
```ts
GET /center → { name; address; phone; email; mapsUrl: string;
  visitingHours: Array<{ label: string; from: string; to: string; quiet: boolean }>;
  contacts: Array<{ roleLabel: string; name: string; phone: string; department: DepartmentCode | null }>;
  guide: Array<{ code: 'response_hours'|'procedures'|'may_bring'|'dont_bring'|'preparing'|'services'|'phones';
                 title: string; items: Array<{ text: string; phone?: string; emergency?: boolean }> }> }
```

## 12. Notifications
```ts
GET /notifications?cursor → Page<Notification> & { unreadCount: number }
type Notification = { id; kind: 'document'|'inquiry_reply'|'event'|'calendar_change'|'update'|'service_request'|'survey'|'newsletter';
  title: string /* generic, no PII */; createdAt; readAt: string|null; link: DeepLink };
POST /notifications/:id/read → 204
POST /notifications/read-all → { unreadCount: 0 }
```

## 13. Push payload (lock screen)
```json
{ "title": "CARETEX Family", "body": "You have a new message", "data": { "notificationId": "n_123" }, "tag": "caretex" }
```
Rules: `body` is chosen from a fixed generic set per kind (localized by device language): message / document / event / update / request. **Never** include resident or staff names, medical terms, subjects or message text. Tapping fetches `GET /notifications/:id` after authentication and deep-links.

## 14. Billing
`GET /residents/:rid/billing` → `{ state: 'coming_soon' }` (future: `{ state:'ok', balance: Money, invoices: [...], receipts: [...] }`).

---

## Fixture IDs (mock)
Member `m_dana` · Residents `r_miriam`, `r_avraham` · Inquiries `inq_2041` (waiting_for_family), `inq_2038`, `inq_2044`, `inq_2032`, `inq_2027`, `inq_2019` (closed) · Documents `doc_flu` (sign), `doc_outing` (approve), `doc_visiting` (confirm_read, overdue), `doc_addendum` (signed 10.10.2026 18:34) · Survey `sv_family_2026`, `sv_holidays` (draft) · Events `ev_hanukkah` (10.12.2026 17:00), `ev_music` (22.10.2026 16:30), `ev_rosh` (archived 10.09.2026) · Appointment `cal_dr_shapiro` (16.10.2026 11:00) · Service requests `sr_1193`, `sr_1190`, `sr_1182`, `sr_1175`. "Today" in mocks = **14.10.2026 09:41** (inject a mock clock `VITE_MOCK_NOW`).
