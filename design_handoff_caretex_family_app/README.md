# Handoff: CARETEX Family App (mobile-first web app)

## Overview
The CARETEX Family App is a companion app for the families of residents in care homes that use the CARETEX care-management system. A family member (sample user: **Dana Cohen**, daughter) signs in with an account created by the care center and can:

- see updates, medical info, the care plan and the daily schedule of a linked resident (sample: **Miriam Levi**, Ward B, Room 12; second linked resident **Avraham Cohen**, Ward D, Room 4);
- open and follow **inquiries** to staff departments (organized cases with statuses, **not a chat**);
- view a **calendar** of personal appointments and center events;
- sign, approve or confirm **documents**; fill **surveys**; RSVP to **events**; open **service requests**;
- read center info, see their own **permissions**, manage **settings** and **notifications**.

The app is a window into CARETEX: every screen shows data that came from CARETEX and every action is sent back to it. In this build, **all data is static/mocked**, behind a typed API layer whose contracts are documented in `docs/04-api-contracts.md` so the backend team can implement the real endpoints later.

Two languages (English LTR, Hebrew RTL), two themes (Light, Dark, + System), mobile-first.

## About the design files
Everything in `design/` is a **design reference built in HTML** (a custom "Design Component" format: `*.dc.html` files containing a template plus a small JS logic class). They are prototypes that show the intended look, copy and behavior. **Do not ship or port this HTML directly.** Recreate the designs in the target stack described below (React + TypeScript + Vite + TanStack + Zustand + i18next + Tailwind + shadcn/ui + framer-motion).

How to view them: open any `design/*.dc.html` in a browser served from the `design/` folder (e.g. `npx serve design`). `support.js` and `icons.js` must sit next to them. Start with `design/Prototype.dc.html` (clickable, all screens) and the five `Phase *.dc.html` boards (all screens side by side, with flow arrows).

**The four screen files are the source of truth for copy and sample data:**

| File | Contains |
|---|---|
| `design/FamilyScreen.dc.html` | Onboarding, auth, security, resident picker, Home, Resident tab |
| `design/FamilyStaffCal.dc.html` | Contact Staff (inquiries), Calendar |
| `design/FamilyMore.dc.html` | More menu, Documents, Surveys, Updates & Events, RSVP, Archive |
| `design/FamilyAccount.dc.html` | Service requests, Center info, Permissions, Payments, Settings, Notifications, Lock screen, System states |

Inside each file's `<script data-dc-script>` logic class, every string is written as `L('English', 'עברית')`. **Extract these pairs verbatim** into `src/locales/en/*.json` and `src/locales/he/*.json`. Sample data (residents, inquiries, documents, events, etc.) is defined in the same class as arrays and should become mock fixtures.

`design/reference/` contains screenshots of the existing **Caretex Caregiver app**, whose visual language this app follows.

## Fidelity
**High-fidelity.** Colors, type scale, radii, spacing, component shapes, iconography (Lucide), copy and flows are final. Recreate them closely using Tailwind + shadcn/ui primitives restyled with the tokens in `docs/01-design-tokens.md`. Where the prototype is static (e.g. a toggle that does nothing), implement the real behavior described in the docs.

## Documents in this package

| File | What it is |
|---|---|
| `CLAUDE.md` | Standing instructions for Claude Code. **Copy to the repo root.** |
| `docs/00-implementation-phases.md` | The build plan: 7 phases with scope, files and acceptance criteria. **Work one phase at a time.** |
| `docs/01-design-tokens.md` | Colors (light/dark), status tones, type, spacing, radii, shadows, motion |
| `docs/02-architecture.md` | Stack, folder structure, routing, state, data layer, mocks, i18n/RTL, theming |
| `docs/03-screens.md` | Every screen: route, purpose, layout, components, actions, states, endpoints |
| `docs/04-api-contracts.md` | Every endpoint with request/response TypeScript types and JSON examples |
| `docs/05-states-and-validation.md` | Loading, empty, error, offline, slow network, no results, permission, session, validation rules |
| `docs/06-components.md` | Shared component specs (header, tab bar, chips, stepper, sheets, toasts, etc.) |

## How to use this with Claude Code
1. Create an empty repo. Copy this whole folder into it as `/handoff`. Copy `handoff/CLAUDE.md` to the repo root.
2. Start Claude Code in the repo and give it this first prompt:

   > Read `CLAUDE.md`, `handoff/README.md` and `handoff/docs/00-implementation-phases.md`. Then implement **Phase 0** only. Read the other docs only as Phase 0 requires. When Phase 0 is complete and its acceptance checklist passes, stop and give me a summary.

3. For each following phase:

   > Implement **Phase N** from `handoff/docs/00-implementation-phases.md`. Re-read the sections of `03-screens.md`, `04-api-contracts.md` and the design file listed for this phase. Stop when the acceptance checklist passes.

4. Review between phases (run the app, switch EN/HE and Light/Dark, try the network simulator).

## Files
```
design_handoff_caretex_family_app/
├── README.md
├── CLAUDE.md
├── docs/
│   ├── 00-implementation-phases.md
│   ├── 01-design-tokens.md
│   ├── 02-architecture.md
│   ├── 03-screens.md
│   ├── 04-api-contracts.md
│   ├── 05-states-and-validation.md
│   └── 06-components.md
└── design/
    ├── Prototype.dc.html                       ← clickable prototype (all screens)
    ├── Phase 1 - Onboarding Home Resident.dc.html
    ├── Phase 2 - Contact Staff and Calendar.dc.html
    ├── Phase 3 - Documents Surveys Events.dc.html
    ├── Phase 4 - Services Settings Notifications.dc.html
    ├── Phase 5 - Variants and Hebrew Dark.dc.html
    ├── FamilyScreen.dc.html   FamilyStaffCal.dc.html
    ├── FamilyMore.dc.html     FamilyAccount.dc.html
    ├── support.js  icons.js
    └── reference/             ← Caretex Caregiver app screenshots
```
