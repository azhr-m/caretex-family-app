# 01 · Design tokens

Derived from the Caretex Caregiver app (warm cream ground, white bordered cards, navy blocks, tinted icon tiles, pill status chips). Implement as CSS variables consumed by Tailwind v4 `@theme`. Names below are the variable names to use (`--color-bg` → `bg-bg`, etc.).

## 1. Base colors

| Token | Light | Dark | Use |
|---|---|---|---|
| `bg` | `#FCF8F1` | `#10141C` | App background |
| `surface` | `#FFFFFF` | `#1A202B` | Cards, inputs, tab bar, sheets content |
| `surface-2` | `#F4EFE6` | `#242B38` | Secondary buttons, info boxes, segmented track, chips (neutral) |
| `border` | `#E6E1D7` | `#2D3544` | Card borders, dividers, input borders |
| `text` | `#1A2233` | `#ECEEF2` | Primary text |
| `text-2` | `#5C6474` | `#A9B0BC` | Secondary text, helper text, meta |
| `label` | `#6B7180` | `#929AA8` | Section labels (uppercase) |
| `navy` | `#1F2A44` | `#26314D` | Hero cards (resident card, care plan header, center header, More profile card). Text on navy is `#FFFFFF` |
| `splash` | `#1F2A44` | `#141B2B` | Splash background |
| `primary` | `#1F2A44` | `#B9C7F2` | Primary buttons, selected states, focus border |
| `on-primary` | `#FFFFFF` | `#10141C` | Text/icons on primary |
| `link` | `#2A4FB8` | `#9DB4FF` | Text buttons, links, "Read the full update ›" |
| `danger` | `#D63A40` | `#FF6B71` | Badges, error field borders/text |
| `tab-active` | `#1F2A44` | `#E4E9F7` | Active tab icon + label |
| `tab-idle` | `#737985` | `#8E95A3` | Inactive tabs |
| `pill` | `#E9EDF6` | `#2B3550` | Active tab pill, selected option background |
| `disabled` | `#ECE8E0` | `#262D3A` | Disabled button background |
| `disabled-text` | `#A3A8B2` | `#6B7383` | Disabled text |
| `skeleton` | `#ECE7DE` | `#262D3A` | Skeleton blocks |
| `skeleton-2` | `#F3EFE8` | `#20262F` | Secondary skeleton lines |
| `stripe-a` / `stripe-b` | `#EFEAE1` / `#F7F3EC` | `#232A36` / `#1D232E` | Image placeholder stripes (135°, 10px bands) |
| `toast-bg` / `toast-fg` | `#1F2A44` / `#FFFFFF` | `#ECEEF2` / `#10141C` | Toast |
| `unread` | `#F3F6FC` | `#1C2333` | Unread notification row background |
| `mine` | `#F1F4FA` | `#1E2638` | Family member's own message card in an inquiry thread |
| `paper` | `#FFFFFF` | `#F4F1EA` | Document page in viewer (always light, text `#1A2233`) |
| `offline-bg` | `#3B424F` | `#3B424F` | Offline banner (text `#FFFFFF`) |
| `scrim` | `rgba(10,14,22,.45)` | same | Behind sheets |

## 2. Tones (status + category colors)
Each tone has `fg` (text/icon), `bg` (tile/chip fill), `bd` (chip border). All `fg` on `bg` pass 4.5:1.

| Tone | Light fg / bg / bd | Dark fg / bg / bd |
|---|---|---|
| blue | `#1F5FD1` / `#EAF1FE` / `#C5D8FB` | `#8DB4FF` / `#1A2742` / `#2C4370` |
| amber | `#935800` / `#FFF4E0` / `#F3D296` | `#F5C46B` / `#33280F` / `#5A4518` |
| violet | `#6B3FC9` / `#F2ECFE` / `#D9CBFA` | `#C3A8FF` / `#2A2142` / `#45366B` |
| green | `#157347` / `#E7F6EE` / `#BCE5CF` | `#6FD6A0` / `#15291F` / `#24503A` |
| red | `#C42B32` / `#FDECEC` / `#F6C3C5` | `#FF8E92` / `#3A1A1C` / `#64292D` |
| slate | `#4B5563` / `#F0F1F4` / `#D6D9E0` | `#B4BAC6` / `#252A33` / `#3B424F` |
| teal | `#0F766E` / `#E3F5F2` / `#B5E3DB` | `#5ED3C2` / `#11302C` / `#1F514A` |
| pink | `#B8195A` / `#FDEBF2` / `#F6C4D7` | `#FF8FB8` / `#3A1926` / `#62293F` |

### Status → tone + icon (Lucide) — always icon + label
| Generic status | Tone | Icon |
|---|---|---|
| New | blue | `sparkles` |
| In progress | amber | `loader` |
| Needs action / Waiting for you / To sign / To confirm / To approve | violet | `circle-alert` / `reply` / `pen-line` / `eye` / `circle-check` |
| Completed / Handled / Signed / Confirmed / Achieved | green | `circle-check` |
| Overdue | red | `clock-alert` |
| Blocked / Closed / No permission / Coming soon | slate | `ban` / `archive` / `lock` / `clock` |
| Not yet shared / Awaiting RSVP / Draft | amber | `hourglass` / `hourglass` / `save` |
| Read | slate | `eye` |
| Assigned | violet | `user-check` |

### Category → tone + icon
Departments: Nursing teal `stethoscope` · Doctor blue `briefcase-medical` · Social work violet `hand-heart` · Physiotherapy pink `footprints` · Nutrition green `salad` · Activities amber `palette` · Management slate `building-2` · Finance blue `wallet` · Maintenance amber `wrench` · Other slate `circle-help`.
Service types: Maintenance amber `wrench` · Laundry/Clothing violet `shirt` · Hairdresser pink `scissors` · Personal equipment blue `package` · Request a conversation teal `message-circle` · Finance green `wallet` · Other slate `circle-help`.
Calendar: **Personal** blue, circle dot marker, `user-round` · **Center event** pink, diamond marker (8px square rotated 45°), `building-2`.
Feed: Updates blue `megaphone` · Newsletters violet `newspaper` · Activities amber `palette` · Events & invitations pink `party-popper`.
Avatars (initials): Miriam pink, Avraham teal, Dana pink; staff avatars use their department tone.

## 3. Typography
- English: **Nunito** 400/600/700/800/900. Hebrew: **Rubik** 400/500/600/700/800. Switch by `html[lang]`. Wordmark "CARETEX" always Nunito 900, letter-spacing .14–.18em.
- Base: 16px, line-height 1.4. Long reading text (update body, newsletter, document paragraphs): line-height 1.55 (doc paper 1.6).
- Hebrew: map weight 900 → 800 (Rubik max 800).

| Role | Size / weight | Where |
|---|---|---|
| display | 28 / 800, lh 1.2 | Sign-in title |
| title-xl | 26 / 800, lh 1.2 | Result/empty screen titles, picker title, first-password title |
| title-lg | 24 / 800 | Page greeting, Forgot titles, Feed/event titles |
| title-md | 22 / 800 | Update detail title, question title, step titles, sheet titles |
| title-sm | 20 / 800 | Resident card name, document title, sheet headers |
| title-xs | 18 / 800 | Navy card titles, thread subject |
| button-lg | 17 / 800 | Primary buttons, top bar title |
| body-strong | 16 / 800 | Card titles |
| body | 15–16 / 400–700 | Body |
| secondary | 14 / 400–700 | Descriptions, helper boxes |
| meta | 13 / 400–700 | Meta lines, helper text under fields, chip-sized buttons |
| label | 12 / 800, uppercase (EN only), letter-spacing .06em | Section headers, status chips (no uppercase) |
| micro | 11 / 700–800 | Tab badges, tiny button captions ("Switch", "Alerts", "Close") |
| tab | 12 / 600 idle, 800 active | Tab labels |

Hebrew has no uppercase: section labels render as-is.

## 4. Spacing, sizing, radii
- Spacing scale (px): 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 28, 32, 40.
- Screen horizontal padding: **16** (lists, dashboards); **20–22** (auth forms, result screens). Top padding 14–16 under the header. Bottom padding 28 (+ safe area).
- Vertical gap between Home sections: 24. Between cards in a list: 10. Inside cards: 10–12.
- Card padding 14 (hero 16). List row padding 12×14, min height 64.

| Radius | px | Use |
|---|---|---|
| `r-sheet` | 28 (top corners) | Bottom sheets |
| `r-hero` | 28 | 96px result icon tiles |
| `r-card` | 18 | Cards, grouped lists |
| `r-btn` | 16 | Primary buttons (56h), large options, header controls |
| `r-input` | 14 | Inputs, info boxes, attachment rows |
| `r-tile` | 12 | Icon tiles 40–44, small buttons (44h) |
| `r-sm` | 10 | 36px tiles, inline pills inside inputs |
| `r-pill` | 999 | Chips, filter chips (r20–22 for 40–44h), FAB (28) |

Sizes: primary button 56h · secondary/compact button 44h · input 54h (OTP cell 48×60) · icon tile 44 (list 42, small 36–40, hero 96, intro 56–64) · avatar 42 (header), 60 (picker), 96 (profile) · tab bar item min 54h, pill 52×30 · badge 18–19 circle, 2px border in surface color · header controls 56h.

## 5. Elevation
- Card (light): `0 1px 2px rgba(26,34,51,.05)` + 1px `border`. Dark: no shadow, border only.
- Phone/device (design only): ignore.
- Toast: `0 14px 30px -10px rgba(10,14,22,.5)`.
- FAB: `0 10px 24px -8px rgba(15,20,30,.45)`.
- Dropdown/listbox: `0 10px 24px -12px rgba(0,0,0,.25)`.
- Segmented active item: `0 1px 3px rgba(0,0,0,.12)`.

## 6. Motion (framer-motion)
- Page push: 200 ms ease-out, x 16px→0 (mirror sign in RTL) + opacity 0→1. Pop: reverse, 160 ms. Tab switch: crossfade 150 ms, no slide.
- Bottom sheet: vaul defaults (spring disabled → 250 ms ease-out), scrim fade 200 ms.
- Toast: slide up 12px + fade, 200 ms; auto-dismiss 4 s (errors 6 s, with action).
- Skeleton shimmer: 1.4 s linear infinite, low contrast.
- Stepper/progress bars: width transition 300 ms ease-out.
- Success icon on result screens: scale .9→1 + fade, 250 ms.
- `prefers-reduced-motion: reduce` → opacity-only, 0–100 ms.

## 7. Icons
Lucide (`lucide-react`), stroke 2, sizes 13–24 (hero 44–54). Directional icons that mirror in RTL: `chevron-left/right`, `arrow-left/right`, `chevrons-*` horizontal, `send`, `log-in`, `log-out`, `undo-2`, `reply`, `external-link`, `navigation`? (no — map icon, don't mirror), `list-ordered` (no). Keep the list in `DirIcon`.
