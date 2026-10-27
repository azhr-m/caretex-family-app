# 06 · Shared components

Measurements in px. Colors are token names from `01-design-tokens.md`. All components must work in LTR and RTL and in both themes. Build on shadcn/ui where noted, restyled.

## Layout
- **Screen**: `min-h-dvh` column; content scroll area `overflow-y-auto overscroll-contain`; respects `env(safe-area-inset-*)`. Max content width 480, centered on larger screens (desktop shows the app in a centered column on `bg`).
- **AppHeader** (main screens): row, padding 6/14/12, gap 10, bottom border. *Resident switcher* = button flex-1 min-h 56 r16 border surface: avatar 42 (initials 15/800 on tone) · name 16/800 (truncate) + "Ward B · Room 12" 13 text-2 · end `chevrons-up-down` 18 + "Switch" 11/700. *Bell* = 62×56 r16 border surface: `bell` 22 + "Alerts" 11/700; badge 19 circle danger with count (99+), 2px surface border, `inset-inline-end:-10px top:-6px`. `aria-label="Notifications, 5 unread"`.
- **TabBar**: surface, top border, padding 6/4 + safe area (26 in design). 5 equal items min-h 54: icon 22 inside pill 52×30 r15 (`pill` bg when active), label 12 (600/800) `whitespace-nowrap`; colors tab-active/tab-idle; badge 18 danger at pill end-top. Order mirrors in RTL automatically. Hide badge on the active tab.
- **TopBar**: padding 4/12/10, bottom border; start: back button min-w 92 min-h 44, `DirIcon arrow-left` 20 + label 15/700 link color (label = parent name: "Inquiries", "Documents", "Back", "Cancel"); center title 17/800 truncate; end slot same min width (actions: "Mark all read", "Save draft"). Survey questions use `x` + "Exit".
- **StickyActionBar**: surface, top border, padding 12/16 + safe area, column gap 10.

## Content
- **Card**: surface, 1px border, r18, padding 14, card shadow (light only).
- **NavyCard**: navy bg, white text, r18, padding 16; inner buttons `rgba(255,255,255,.08)` bg + `.2` border.
- **SectionHeader**: row gap 8, color label: icon 16 + text 12/800 uppercase .06em (no uppercase in HE) flex-1 + optional count chip (12/800, tone bg/fg, r999, padding 2/8).
- **IconTile**: square, r12 (36→r10, 96→r28), tone bg + fg, centered icon (size ≈ 50%).
- **ListRow** (in grouped card): full-width button, padding 12/14, min-h 64, gap 12, divider bottom (none on last): IconTile 42 · column (kind 12/800 tone fg optional, title 15/700 lh 1.3 wraps, meta 13 text-2) · `DirIcon chevron-right` 20 text-2.
- **ActionCard** (Needs your attention): Card with row (IconTile 44, title 16/800, sub 13) and footer row space-between: StatusChip + compact primary Button.
- **StatusChip**: inline-flex, gap 5, padding 4/10 (small 2/8), r999, 1px border tone bd, bg tone bg, fg tone fg, icon 14 + label 12/800, `whitespace-nowrap`. Props: `status` → maps through `lib/status.ts`.
- **Avatar**: circle, photo or initials on tone.
- **ImagePlaceholder**: `repeating-linear-gradient(135deg, stripe-a 0 10px, stripe-b 10px 20px)`, centered monospace 11–12 text-2 caption.
- **DetailsList**: Card of rows (icon 20 text-2 · column label 12/700 text-2 + value 15/700).
- **InfoBox**: surface-2 (or tone bg + bd) r14 padding 14, icon 18 + text 14 text-2.
- **Stepper**: equal columns; circle 28–32 (2px border) with icon 14–16; connector 2px line from circle center to next (`inset-inline-start:50%`, width 100%); done = green fg fill + white check; active = primary fill; future = surface + border; label 11–12 centered, 2 lines max, active 800.
- **ProgressBar**: 8h r4 surface-2 track, tone fill, width transition.
- **Timeline** (day): time col 46 (ltr, 14/800) · rail 20 (2px lines, 14 dot) · card.
- **MessageCard** (inquiry): Card (family's own: `mine` bg) — header row avatar 38 + name 15/800 + role 12 with icon + time 12 (ltr) · text 15 lh 1.5 · attachments rows (surface-2 r12, file icon, name ltr, size, "Open"). **StatusEvent**: centered row, lines either side, icon 14 + text 12/700 + time.

## Inputs
- **Button**: variants `primary` (primary/on-primary, h56 r16, 17/800, icon 20 + label, gap 10), `secondary` (surface + border), `danger` (red tone bg + bd + fg; destructive solid in sheets = red fg bg + on-danger), `ghost-link` (no bg, link color, min-h 44), `compact` (h44 r12 padding 0/16 14/800, icon 17). Disabled: `disabled` bg + `disabled-text`. Loading: spinner replaces icon. Pressed: scale .98 + 6% darker (framer `whileTap`).
- **TextField**: label 14/700 above (gap 6) · box h54 r14 border 1.5 border-color, surface, padding 0/14, leading icon 20 text-2, gap 10 · focus 2px primary · error 2px danger · helper 13 text-2 below / error 13 danger + `circle-x` 15. Phone/password/OTP inputs `dir="ltr"` and `text-start`.
- **PasswordField**: TextField + trailing toggle button h42 r10 surface-2 (`eye`/`eye-off` 18 + "Show"/"Hide" 13/700).
- **TextArea**: min-h 100–160, auto-grow, counter `n / max` (ltr) end-aligned with helper start.
- **OtpInput**: 6 cells 48×60 r14 border 2, 26/800, gap 8, `dir="ltr"`, active = primary border, filled = text-2 border, error = danger.
- **SegmentedControl**: track surface-2 r16 padding 4 gap 4; items flex-1 h44–48 r12 14/800 icon 17; active surface + shadow, inactive transparent text-2. Radix ToggleGroup.
- **FilterChips**: horizontal scroll row (`-mx-4 px-4`), chips h40–44 r20–22 border, icon 15–17 + label 13–14/800 + optional count (opacity .75); active = primary fill. Radix ToggleGroup single.
- **OptionCard** (radio/checkbox): min-h 58 r16 border 2 (selected primary + `pill` bg, weight 800) icon 22–24 (`circle`/`circle-dot`, `square`/`square-check`).
- **GridOption** (department/service type): 2-col grid gap 10, card r16 border 2 padding 12, tile 40 + label 15/800 + hint 12; selected adds "Selected" + `circle-check` at top-end.
- **Toggle**: 51×31 track (on green fg / off `#D6D9E0` light `#3B424F` dark), knob 25 white, knob uses `inset-inline-start` so it mirrors; caption "On/Off/Locked" 10/800 under it. Radix Switch. Whole row is the hit target.
- **Counter stepper** (guests): two 64×56 r14 buttons (`minus`/`plus` + "Less"/"More") with value 28/900 between.
- **SignaturePad**: `signature_pad` on canvas, 180h r16, 2px dashed border, white bg always, baseline + "×" at start, helper text; Clear, Undo buttons (h44 compact secondary); exports PNG (trimmed).

## Overlays and feedback
- **BottomSheet** (vaul Drawer): bg token, top radius 28, padding 10/20/34+safe, grab handle 44×5 r3 border-color; scrim rgba(10,14,22,.45–.5); focus trap; `dismissible={false}` for session lock and while submitting. Used for: resident switcher, session lock, sign, draft saved, log out, discard confirmation, department/type filters, decline reason.
- **Toast** (sonner, custom render): toast-bg/fg, r16, padding 14/16, shadow; 34px green circle with check (3px stroke) + title 15/800 + body 13 (.8 opacity); error variant red circle `x`; position bottom above tab bar or action bar (offset 104/128/34).
- **Banner**: full-width under header. Offline (slate, white, `wifi-off` 20, title 15/800 + body 13). Changed (amber bg, bottom border amber bd, `refresh-ccw-dot` 22, text, compact primary "Refresh"). Back online (green, 3 s).
- **Fab**: h56 r28 padding 0/20, primary, icon 20 + label 16/800, shadow; fixed `bottom: tabbar + 16`, `inset-inline-end: 16`. Content gets bottom padding 100 so the last card is never hidden.
- **ResultScreen**: centered column (padding 44/22/32): tile 96 r28 tone (+ border bd) icon 44–46 · StatusChip (13) · title 26/800 · body 16 text-2 · optional summary DetailsList · spacer · actions (primary, secondary, ghost link). Success animation (tokens §6).
- **EmptyState / ErrorState / PermissionState**: same structure as ResultScreen, smaller (tile 88–96, title 20–22), inside the content area (header/tab bar remain).
- **Skeleton**: blocks in `skeleton` / `skeleton-2`, radius matching real component, shimmer.
- **QueryBoundary**: props `query`, `skeleton`, `isEmpty?`, `empty?`, `onRetry?`, `permissionKey?`; renders states per `05`.

## Utilities
- **Ltr**: `<bdi dir="ltr">`; also exported `formatPhone("+97235550100") → "03-555-0100"`.
- **DirIcon**: wraps Lucide; if the icon is in the directional set, adds `rtl:-scale-x-100`.
- **format.ts**: `date(d) → 14.10.2026`, `time(d) → 09:41`, `dateTime → 14.10.2026 09:41`, `weekday(d, lang)`, `dayGroupLabel(d)` ("TODAY · 14.10.2026"), `fileSize(320000) → "320 KB"`, `age(dob)`, `relativeGreeting(now)`. All via `Intl` with `timeZone:'Asia/Jerusalem'` and locale `en-GB`/`he-IL` (numbers stay Latin digits).
