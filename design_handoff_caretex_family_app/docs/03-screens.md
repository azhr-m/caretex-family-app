# 03 · Screens

Each screen: **ID · Route · Design ref** (`file → screen key`; open the file with prop `screen="<key>"` or find it on the Phase boards). Copy = `L()` pairs in that file. Layout values are in `01-design-tokens.md` and `06-components.md`.

Global: main screens = `AppHeader` (resident switcher + bell with count) + content + `TabBar` (Home · Resident · Contact Staff · Calendar · More, with count badges). Detail screens = `TopBar` (back with label, centered title, optional end action) + content (+ optional sticky action bar).

---

## 1. Onboarding and security (`FamilyScreen.dc.html`)

### 1.1 Splash · `/splash` · `splash`
Navy full-bleed, 104px rounded tile with `heart-handshake` 54px, "CARETEX" 38/900 wordmark, "Family App" pill, tagline, bottom: 3 dots + "Connecting securely…" with `shield-check`.
Logic: min display 800 ms, max until bootstrap resolves (refresh token check, language). Then: no language → `/welcome/language`; valid session → last route or `/r/$rid/home` (or `/select-resident`); else `/login`.

### 1.2 Language · `/welcome/language` · `lang`
Icon tile `languages`, bilingual title (both languages shown always), two large option cards (EN "Left to right" / עברית "מימין לשמאל") with radio-like state icon + "Selected/Select" label. Selecting applies immediately (layout flips live). Info box: "You can change the language at any time in More → Settings → Language." Primary "Continue" → `/login`.

### 1.3 Sign in · `/login` · `login`
Top end: language toggle button ("עברית"/"English") + theme toggle (moon/sun + label). Brand row (52 navy tile + CARETEX + "Family App"). Title + subtitle. Fields: **Phone number or username** (leading `smartphone`, helper "Use the phone number the care center registered for you.") and **Password** (leading `key-round`, trailing Show/Hide button with icon + label). Link "Forgot password?" (`key-square`). Primary "Sign in" (`log-in`). Info card "Your account is created by the care center" + phone `03-555-0100`. Footer "Secure, encrypted connection to CARETEX".
States: submitting (button spinner, fields disabled) · **1.6a error** (`loginError`): red alert box at top "We couldn't sign you in · … You have 2 attempts left …" (attempts from API), both field borders red, inline error under password · offline: disable submit with banner.
Outcomes: `200` + `mustChangePassword` → 1.4 · `200` → picker or home · `401 INVALID_CREDENTIALS` → 1.6a · `423 ACCOUNT_LOCKED` → 1.6b · `403 ACCOUNT_BLOCKED` → 1.7.

### 1.4 Create personal password · `/login/first-password` · `firstPw`
TopBar "Personal password". Violet key tile, title, explanation (temporary password). New password (visible by default with Hide), Confirm. Strength meter (4 segments; weak red 1 / medium amber 2 / good green 3 / strong green 4). Rules card with live checks (icon `circle-check` green "Met" / `circle-x` red "Not yet"): ≥8 chars, one uppercase A–Z, one number, one special character, passwords match. "Save and continue" disabled until all pass (disabled style + hint "Meet all the rules to continue"). Success → toast "Password saved" → picker/home.

### 1.5 Forgot password · `/forgot?step=` · `forgot1`–`forgot4`
3-step stepper (Phone · Code · New password; done = green check).
- **phone**: country select `+972` + number (dir ltr), helper "Mobile number without the leading 0", "Send code" (`message-square-text`), info "No longer using this number? …". Errors: unknown number → generic success anyway (no account enumeration) but backend returns same shape.
- **code**: "We sent a code by SMS to 050-***-4127" (masked from API). 6 OTP cells (dir ltr, auto-advance, backspace back, paste fills all, `autocomplete="one-time-code"`, numeric keyboard). Timer "Resend code in 00:42" (`timer`) → after 0 enables "Resend code". "Verify code", "Wrong number? Change it". Errors: wrong code (cells red + "The code is incorrect. 2 attempts left."), expired ("The code expired. Send a new one."), too many attempts → back to phone step.
- **password**: same rule set as 1.4, "Save new password".
- **done**: ResultScreen green "Your password was changed", chip "Changed on DD.MM.YYYY HH:mm", body mentions sign-out on other devices, "Back to sign in".

### 1.6b Account temporarily locked · `/locked` · `locked`
ResultScreen red `lock`, chip "Locked until 09:53" (from `lockedUntil`), title, body. "WHAT YOU CAN DO NOW" 3 step cards (Wait 15 minutes · Reset your password · Still stuck? Call us). Buttons: "Reset my password", "Call the care center" (`tel:`), link "Back to sign in". Countdown auto-enables sign in when `lockedUntil` passes.

### 1.7 Access blocked · `/blocked` · `blocked`
ResultScreen slate `shield-off`, chip "Account inactive", explanation. Center contact card (phone, email, address, office hours — from `GET /center/public`). Buttons "Call the care center", "Send an email", link "Back to sign in".

### 1.8 Session timeout sheet · overlay · `session`
Content behind is blurred (9px) and inert. Sheet: violet `lock-keyhole` tile, "Enter your password to continue", explanation (10 minutes idle), member row (initials, name, phone), password field, "Continue" (`lock-open`), "Not Dana? Sign out" (danger text). Wrong password → inline error; 5 failures → hard logout to `/locked`. Not dismissible by swipe/scrim.

### 1.9 Resident picker · `/select-resident` · `picker` and sheet · `pickerSheet`
"Hello, Dana" · "Who would you like to view?" · explanation. Card per linked resident: avatar 60 (photo or initials on tone), name, ward · room, "Your relation: Daughter" (`heart`), chip (`3 new` blue / `No new items` green). Info "You can switch at any time from the top of the screen…". Skipped automatically if only 1 resident.
Sheet version (from header): title "Switch resident", Close button (icon + label), rows with selected = 2px primary border + "Viewing" green check, others "View" chevron. Selecting → `setActiveResident` → navigate to the same tab for the new resident → toast "Now viewing Avraham Cohen".

---

## 2. Home · `/r/$rid/home` · `home` (`FamilyScreen.dc.html`)
Order (gap 24):
1. Greeting "Good morning, Dana" (morning 05–12, afternoon 12–17, evening 17–22, night) + date line "Wednesday, 14.10.2026".
2. **Resident card** (navy): 72px photo (placeholder stripes if none), name 20/800, `bed-double` ward · room, `building-2` center name, end "Profile" button → `/resident/general`.
3. **Since your last visit · DD.MM.YYYY** section header + count chip "5 new". Grouped list rows: tone tile + kind label (colored, 12/800) + title (15/700, wraps) + meta + chevron. Kinds: new update (teal `newspaper`), new reply (blue `message-square-reply`), new document (violet `file-text`), calendar change (amber `calendar-clock`), request handled (green `circle-check`). Each deep-links. "Last visit" = previous app session start (server-tracked, `POST /me/visits`). Empty: one row "Nothing new since your last visit" (green check).
4. **Needs your attention** + "5 to do" chip. Action cards: tile + title + sub, bottom row status chip + CTA button (44h primary, icon + label). Types: sign document (→ doc), confirm read (→ newsletter/doc), survey (→ intro), RSVP (→ event), reply needed (→ inquiry). Empty: green "You're all caught up" card.
5. **Latest update**: author row (avatar, name, role · date time), title, 2-line excerpt, 150px photo, "Read the full update ›".
6. **Upcoming appointment**: date block (weekday / day / month, blue), title, time, location, chip "Personal · Miriam", "Confirm" button (if `requiresConfirmation`) → appointment detail. Empty: hide section.
7. **Miriam's day · Today**: 5 rows (time ltr, tone icon, title, status chip Done/Now/Upcoming; done rows 75% opacity), "See the full day ›".
8. **Quick actions** 2×2 grid: New inquiry, Service request, Documents ("2 waiting for you"), Events ("1 invitation").
Pull-to-refresh on Home (and every list). Sections fail independently (one `QueryBoundary` per section with a compact inline error + retry) but share one `GET /dashboard` call; if the whole call fails show full ErrorState.

## 3. Resident tab · `/r/$rid/resident/*` (`FamilyScreen.dc.html`)
Segment bar (horizontal scroll, 44h pills, icon + label, active = primary fill, badge count on Updates): General · Updates · Medical · Care plan · {Name}'s day. Segment visibility from `permissions`: `allowed` → normal; `denied` → segment shows `lock` icon and opens 3.8a; `not_shared` → `hourglass` icon and opens 3.8b; `hidden` (if center chooses) → not rendered.

- **3.1 General** `resGeneral`: profile card (96 photo, name, ward + room chips), Details list (date of birth + age, ward, room, admitted, languages, primary family contact), Staff contacts (avatar, name, role with icon, "Inquiry" button → new inquiry pre-filled with department), Nurses' station row with "Call" (`tel:`).
- **3.2 Updates** `resUpdates`: intro line, cards grouped by date header (weekday · date), author avatar/name/role icon + role · time, "New" chip, title, body (3 lines), up to 2 photos, "Read the full update ›". Infinite scroll (cursor), "No updates yet" empty.
- **3.3 Update detail** `/resident/updates/$id` · `resUpdate`: author block, chips (date time, category), title 22, full body, photo grid (2fr/1fr, 2 rows of 96), hint "Tap a photo to open it full screen", "Shared by the care center on …", secondary "Ask the staff about this update" → new inquiry with subject prefilled + link to update. Marks update seen (`POST /updates/:id/seen`).
- **3.4 Photo viewer** `resPhoto`: black, Close (x + label), counter `1 / 3` (ltr), Save (download), photo (pinch-zoom, swipe), caption + author · date, Previous / Next buttons (disabled at ends). Escape/back closes.
- **3.5 Medical** `resMedical`: blue info box (shared for awareness; ask via Contact Staff). Category cards: Medications, Diagnoses, Allergies and sensitivities (red "Allergy" flag chip), Doctor visits, Test results, Nutrition, Physiotherapy. Each item: name, detail, "Shared by the care center on DD.MM.YYYY". Categories with no items are hidden; all empty → EmptyState.
- **3.6 Care plan** `resCare`: navy header (title, explanation, chips Reviewed / Next review). Goal cards: tile, "GOAL", title, status chip (On track amber / Achieved green / Monitoring amber), "What the team does", pink box "How you can help".
- **3.7 Day** `resDay ?date=`: day switcher (Yesterday ‹ · Today + date · Tomorrow ›; future beyond tomorrow disabled), vertical timeline: time (ltr), rail with dots (done green, now amber ring, upcoming hollow), card (tone tile, title, place, chip Done/Now/Upcoming; "now" card 2px amber border). Footnote with last-updated time. Auto-scroll to "now".
- **3.8a No permission** `resNoPerm` (slate `lock`) and **3.8b Not yet shared** `resNotShared` (amber `hourglass`): PermissionState template — icon tile 96, chip, title, body, note box, buttons ("View my permissions" → `/more/permissions`, "Ask the social worker" → new inquiry dept=social) / ("Ask the medical staff", "Back to general info").

---

## 4. Contact Staff (`FamilyStaffCal.dc.html`)
- **4.1 List** `/staff` · `inqList`: title + explanation, search field, filter buttons (Department dropdown sheet, Sort Newest/Oldest), horizontally scrolling status chips with counts (All, Waiting for you, In progress, New, Read, Handled, Closed). Cards: dept tile, subject (wraps), dept · date, "New reply" red marker, 2-line preview ("Yael: …" / "You: …"), status chip, ref `INQ-2041` + chevron. Unread cards have blue border. FAB "New inquiry" (icon + label) above tab bar. Paginated (cursor). **4.6 No results** `inqNoResults`: search-x tile, "No inquiries match your search", body with the query, "Clear search and filters", "New inquiry". **Empty (no inquiries at all)**: "You haven't opened any inquiries yet" + "New inquiry".
- **4.5a New · department** `/staff/new?step=department` · `inqNew1`: 2-step stepper, title, explanation, 2-column grid of 10 departments (tile, label, hint, selected = 2px primary + "Selected" check). "Continue" disabled until selected.
- **4.5b New · message** `?step=message` · `inqNew2`: "Sending to {dept} · {ward}" card with "Change"; Subject (helper), Message (counter `168 / 1000`, helper no passwords/IDs), Attachments (thumbnails, file row with name/size and Remove, "Add photo" camera / "Add file" — `accept="image/*,application/pdf"`, `capture` optional), helper limits; amber "not for emergencies" box with nurses' phone; "Send inquiry". Leaving with unsaved text → confirm sheet "Discard this inquiry?".
- **4.5c Sent** `/staff/new/sent/$id` · `inqSent`: ResultScreen green `send`, chip "Sent on …", title, body (expected response time from API), summary rows (reference, department, subject, status), "View inquiry", "Back to my inquiries".
- **4.2 Thread** `/staff/$id` · `inqThread`: header card (dept tile, subject, dept · ref · opened date, status chip, status description). Stepper: New → Read → In progress → Waiting for you → Handled → Closed (6 steps, labels 11px wrap 2 lines). Timeline: message cards (full width; family's own uses `mine` background; avatar, name, role with icon, time, text, attachment rows with Open) and inline status events (centered divider line with icon + text + time). Sticky reply bar: Attach button (icon + "Attach"), text area auto-grow (max 5 lines), "Send" (icon + label), footnote. Marks thread read on open. **4.3** after send: toast "Sent · Your reply was sent to Social work", appended message, status updated. **4.4 Closed** `inqClosed`: no reply bar; slate box "This inquiry is closed · Closed by … on …" + "Open a new inquiry on this topic" (prefills dept + subject).

## 5. Calendar (`FamilyStaffCal.dc.html`)
- Header segmented control Month / Week / List (icons calendar, calendar-range, list). Legend chips: "Personal · Miriam" (blue + dot) and "Center event" (pink + diamond).
- **5.1 Month** `calMonth`: card with ‹ month › nav (44 squares), weekday row (Sun→Sat; HE א׳–ש׳), 7-col grid of 48h cells: day number, markers row (dot personal, diamond center). Today = 2px primary outline; selected = primary fill. Below: "{WEEKDAY} · DD.MM.YYYY" header + item rows (start border 4px tone, tile, title, time · type, chevron) or "Nothing is scheduled for this day."
- **5.2 Week** `calWeek`: week nav with range `11.10.2026 – 17.10.2026`, 7 rows: day block (weekday + number; today filled) + item cards or "Nothing scheduled".
- **5.3 List** `calList`: grouped by day ("TODAY · …"), rows with time, tile, title, type chip.
- **5.4 Appointment** `/calendar/$id` · `calAppt`: chips (Personal, "Needs your confirmation" violet / "Confirmed" green), tile + title, details list (date and time, location, with, purpose, changed history), info box, primary "Confirm I will attend" → **5.4b** `calApptOk` (green confirmed bar + toast). Secondary: "Ask a question" (→ new inquiry), "Add to my calendar" (download `.ics`).
- **5.5 Center event** `calEvent` → same as 6.4 event detail (shared component); "RSVP to this event" → `/more/events/$id/rsvp`.

---

## 6. More (`FamilyMore.dc.html`, `FamilyAccount.dc.html`)
**6.0 More** `/more` · `moreMenu`: navy profile card (initials, Dana Cohen, relation line, phone). Grouped list of 8 items, each tile + label + one-line description + optional badge chip + chevron: Documents and Approvals ("3 to do"), Questionnaires and Surveys ("1 new"), Updates and Events ("2 new"), Service Requests ("1 open"), Center Information, Family Members and Permissions, Accounts and Payments ("Coming soon"), Settings. App version footer (ltr).

### 6.1 Documents
- **List** `docsList`: intro, segmented To sign (2) / To confirm (1) / Completed (4), filters Type ("All types") and Year (2026). Cards: tile, title, from · sent date, status chip, due line (amber "Due 15.10.2026", red `clock-alert` "Overdue since …", green check + signed date for completed). Empty per tab: **8.2** "There are currently no documents awaiting action" + "View completed documents".
- **Viewer** `docView`/`docConfirm`/`docApprove`: title, chips (status, from with dept icon, due). Paper page (always light): center name + doc code, title, paragraphs, resident/family footer. Page indicator "Page 1 of 2", Zoom, PDF download. Real docs: render `fileUrl` PDF (pdf.js) inside the paper frame; mock renders paragraphs. Sticky action bar depends on `requiredAction`:
  - `sign`: "Ask" (→ inquiry) + primary "Sign document" → sign sheet.
  - `confirm_read`: checkbox "I have read and understood this document" (required) + "Confirm I have read this" → toast + green bar "Read confirmed on …".
  - `approve`: "Decline" (red outline → reason sheet, reason required) + primary "Approve outing" → result screen.
- **Sign sheet** `docSign`: title, explanation, Cancel; signature pad 180h white with baseline and "×", helper "Sign with your finger inside the box", Clear + Undo; consent checkbox (text from API `signatureConsentText`); "Sign and send" disabled until stroke + consent. Sheet not dismissible while submitting.
- **Result** `docSigned`/`docApproved`: ResultScreen green with chip "Signed on 10.10.2026 18:34", rows (document, signed by, confirmation code), "Back to documents", "Download signed copy".

### 6.2 Surveys
- **List** `surveyList`: intro, segmented Active (n) / Completed (n). Cards: tile, title, meta (anonymous/identified · n questions · closes), progress bar, chip (Not started / Draft · x of y / Submitted), CTA Start/Continue/View.
- **Intro** `surveyIntro`: tile, title, description, 3 fact tiles (time, questions, closes), blue box anonymous/identified explanation (from `anonymous` flag), info "save a draft…", "Start survey" / "Continue survey".
- **Question** `sq1…sq9`: TopBar with "Exit" (x + label → draft sheet) and end "Save draft". Progress row "Question 3 of 9" + "About 3 min left", bar. Follow-up chip "Follow-up · because you answered "No"" (violet `git-branch`). Title 22, helper with type icon. Answer UI per type (see `05` §5.6). Sticky footer Back / Next ("Review answers" on last). Required questions disable Next with inline message on tap.
- **Draft sheet** `surveyDraft`: green save tile, "Draft saved", "You answered 4 of 9 questions…", progress, "Continue now", "Exit and continue later".
- **Review** `surveyReview`: title, explanation, numbered list (question, answer, Edit → that question then back to review), anonymity reminder, "Submit survey".
- **Thank you** `surveyThanks`: ResultScreen, chip "Submitted on …", rows, "Back to surveys", "Go to Home". Completed surveys open read-only review.

### 6.3 Updates and Events
- **Feed** `feed`: category chips (All, Updates, Newsletters, Activities, Events and invitations). Cards: tile, colored kind, title, meta, excerpt, optional status chip (Confirm reading / Awaiting RSVP), CTA. "View archive" button. Infinite scroll.
- **Newsletter** `newsletter`/`newsletterOk`: chips (Newsletter, read status), title, meta, cover image, body, bullet highlights, PDF attachment row (Open → new tab), confirm box (checkbox + "Confirm I have read this") → toast + green "You confirmed reading on …".
- **Event invitation** `/more/events/$id` · `eventInvite`: hero image 190h, chips (Invitation, RSVP status), title, body, details list (date and time, location, guests, accessibility), Program list (time ltr, icon, text), "RSVP" + deadline note. After RSVP: show "Your answer: Attending · 2 guests" with "Change my RSVP" (until deadline).
- **RSVP form** `rsvp`: event summary card, "Will you attend?" 3 options (Attending green / Not attending red / Not decided yet amber), Number of guests stepper (− Less / + More, 0–max), guest name fields (one per guest), note textarea, "Save my RSVP", "You can change your answer until …". Guests + names hidden when not attending.
- **RSVP saved** `rsvpSaved`: ResultScreen, rows (event, when, your answer), "Back to events", "Open calendar". Event added to calendar list.
- **Archive** `archive`: search, groups by month, compact rows.

### 6.6 Service requests (`FamilyAccount.dc.html`)
- **List** `serviceList`: intro, cards (tile, title, type · ref, meta, status chip; closed at 80% opacity), FAB "New request". Empty: "No service requests yet".
- **New** `serviceNew`: "What do you need?", 2-col grid of 7 types (tile, label, radio icon), Description (helper), Preferred time chips (Any time / Friday morning / Afternoon — options from type config), "Add a photo (optional)", "Send request". **8.6 error** `stateError`: red box "We couldn't send your request …" + "Try again"; text preserved.
- **Sent** `serviceSent`: ResultScreen + "View request", "All my requests".
- **Detail** `serviceDetail`: tile + title + type · ref · opened, status chip, 5-step stepper Opened → Assigned → In progress → Handled → Closed, details list (your request, preferred time, assigned to, expected), Activity log (icon, text, time), "Add a comment", "Cancel request" (confirm sheet; only while Opened/Assigned). **8.8** `stateChanged` banner when version changes.

### 6.7 Center information
`centerInfo`: navy header (name, address) with Call / Email / Directions; Visiting hours list (quiet hours in amber); Staff contacts by role (role, name, phone ltr, Call); row → Guide. `centerGuide`: cards for Response hours, Family procedures, What you may bring (green checks), Please don't bring (red x), Preparing for a visit, Services, Important phone numbers (with `tel:` links, emergency 101 red).

### 6.8 Permissions
`permissions`: blue info box (managed by the center, read-only), resident switcher segmented (avatar + name), chips (relation, updated date), list of 9 permissions with icon, label, note, chip Allowed (green check) / Not allowed (red x) / Not yet shared (amber hourglass). "Ask the social worker about permissions".

### 6.9 Payments
`payments`: wallet tile, "Coming soon" chip, title, body; dimmed preview (balance card + 3 invoice rows) with centered "Preview only" pill; "Notify me when it's ready" toggle (saved to prefs); Finance phone line.

### 6.10 Settings
`settings`: Language segmented (English / עברית, each label in its own font), Theme segmented (Light / Dark / System) + helper, Notifications toggles (Updates about {resident}, Inquiry replies, Documents and approvals, Events and invitations, Surveys) each with description and On/Off caption; "Message previews on lock screen" permanently Off (locked caption). Security and privacy rows: Change password (→ 1.5 password step with current password), Unlock with Face ID (web: "Coming soon"), Privacy policy, Terms of use. "Log out" danger button → `logoutSheet` (tile, "Log out of CARETEX Family?", explanation, "Log out" / "Stay signed in"). Version footer. Each toggle change → **8.5** toast "Saved · Your notification preferences were updated".

## 7. Notifications
- **7.1 Center** `/notifications` · `notifCenter` (bell from header): TopBar with end "Mark all read" (`check-check`). Groups by day ("TODAY · 14.10.2026", "YESTERDAY · …", weekday · date). Rows: unread dot + `unread` background + 800 weight; tone tile, title, "kind · time · New/Read", chevron. Tap → mark read + deep link (switch resident if `residentId` differs). Empty: "You're all caught up · New notifications will appear here".
- **7.2 Push / lock screen** `lockScreen`: generic text only ("You have a new message", "You have a new document waiting"), app name "CARETEX Family". Payload rules in `04` §13.

## 8. System states (`FamilyAccount.dc.html`, see `05-states-and-validation.md`)
`stateSkeleton` loading skeleton · `stateEmpty` empty · `resNoPerm` no permission · `resNotShared` not yet published · `stateToast` success toast · `stateError` action failed + retry · `stateOffline` no-internet banner · `stateChanged` changed since opened + refresh · `inqNoResults` search no results.
