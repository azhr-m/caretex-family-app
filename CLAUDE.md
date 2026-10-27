# CLAUDE.md — CARETEX Family App

You are building the CARETEX Family App: a mobile-first React web app for families of care-home residents. The full spec lives in `design_handoff_caretex_family_app/`. This file holds the rules that apply to every phase.

## How to work

- Build **one phase at a time** from `design_handoff_caretex_family_app/docs/00-implementation-phases.md`. Do not start the next phase until asked.
- At the start of a phase, read only the docs and design files that the phase lists. Do not re-read whole docs you already read in this session.
- At the end of a phase: run `pnpm typecheck && pnpm lint && pnpm test`, fix everything, walk the acceptance checklist, then stop and summarize (what was built, what was deferred, any open questions).
- When the spec and the HTML design disagree, the **docs win** for behavior and data; the **design wins** for visuals and copy. Note any conflict in your summary.
- Never invent copy. All user-facing text comes from the `L('en','he')` pairs in `design_handoff_caretex_family_app/design/*.dc.html`, extracted verbatim into locale files. If a string you need doesn't exist (e.g. a new validation message), add it in both languages and list it in your summary.

## Stack (fixed)

React 19 + TypeScript (strict) + Vite · TanStack Router (file-based, typed search params) · TanStack Query v5 · TanStack Form + Zod · Zustand (with `persist` where specified) · i18next + react-i18next · Tailwind CSS v4 · shadcn/ui (Radix) restyled to our tokens · vaul (bottom sheets, via shadcn Drawer) · sonner (toasts) · lucide-react · framer-motion (light motion only) · MSW v2 (mock API) · Vitest + Testing Library · Playwright (visual and e2e). Package manager: pnpm.

Do not add other UI kits or CSS-in-JS. Ask before adding any dependency not listed.

## Non-negotiable rules

1. **Icon + label everywhere.** No icon-only buttons, tabs, chips or rows. Icon-only is allowed only for decorative icons next to text.
2. **Logical CSS only.** Use `ms-/me-/ps-/pe-/start-/end-/text-start/text-end/border-s/border-e/rounded-s/rounded-e`. Never `ml-/mr-/pl-/pr-/left-/right-/text-left/text-right` (lint rule enforces this).
3. **Directional icons mirror in RTL, others never do.** Use `<DirIcon>` for chevrons, arrows, back, "send", progress direction. Never mirror clock, bell, check, camera, phone, etc.
4. **LTR islands.** Phone numbers, dates, times, numbers, reference IDs (`INQ-2041`), file names, emails and the brand "CARETEX" are always wrapped in `<Ltr>` (`<bdi dir="ltr">`).
5. **No overflow, ever.** Every flex child holding text gets `min-w-0`. Long text wraps (`break-words`, `text-pretty`) or clamps (`line-clamp-*`) as specified. No fixed widths on text containers. The app must look right at 320–430 px width, in both languages, with OS font size up to 200%.
6. **Tap targets ≥ 44×44 px.** Primary buttons 56 px tall.
7. **Contrast ≥ 4.5:1** for text in both themes. Status is never conveyed by color alone (icon + label).
8. **Dates:** UI shows `DD.MM.YYYY` and 24-hour `HH:mm`, timezone `Asia/Jerusalem`. API uses ISO 8601. Format only through `src/lib/format.ts`.
9. **Privacy.** Never put resident names, medical text or message content in push/lock-screen text, document titles, URLs, logs or analytics. Medical data is never persisted to storage (memory cache only).
10. **Every mutation gives feedback**: pending state on the button, success toast or success screen, error with retry. Copy follows the design ("Sent", "Signed", "Your RSVP was saved").
11. **All data goes through `src/api/`** typed functions + Zod schemas that match `design_handoff_caretex_family_app/docs/04-api-contracts.md` exactly. Components never call `fetch` or import fixtures directly.
12. **Every query screen handles every state** in `design_handoff_caretex_family_app/docs/05-states-and-validation.md`: loading (skeleton), empty, error + retry, offline, slow, permission denied / not shared, session expired. Use the shared `<QueryBoundary>`.
13. Motion is subtle: 150–250 ms, ease-out, respects `prefers-reduced-motion`. No bouncy springs, no parallax.
14. No social-media patterns: no chat bubbles, no typing indicators, no likes, no avatars-in-bubbles.

## Commands

`pnpm dev` · `pnpm build` · `pnpm typecheck` · `pnpm lint` · `pnpm test` · `pnpm e2e` · `pnpm i18n:check` (fails if en/he keys differ)

## Dev tools (build in Phase 0, keep forever in dev builds)

A floating **Dev panel** (only when `import.meta.env.DEV`) to switch language, theme, active mock user scenario, and the **network simulator**: Normal / Slow 3G (2–4 s latency) / Offline / Random 20% errors / Force 401 session expired / Force 403 permission. Every phase must be verified with each simulator mode.

## Environment notes (this repo)

- The handoff lives in `design_handoff_caretex_family_app/` (not `/handoff`).
- Node 20.19 on this machine, so these are pinned: TypeScript ~6.0 (typescript-eslint doesn't support 7 yet), Vitest 3 + jsdom 26 (newer need Node 22.22+), MSW 2.
- pnpm comes from corepack and is pinned via `packageManager` (pnpm 9). If `pnpm` fails, use `corepack pnpm@9.15.9 <cmd>`.
- Physical-direction classes are blocked by the local ESLint rule `eslint-rules/no-physical-direction.js` (checks `className` and `cn/cva/clsx` args).
- Custom font-size tokens are registered with tailwind-merge in `src/lib/utils.ts`; add new `--text-*` tokens there too, or `cn()` will drop text colors.
- Never name a font-size token like a color token: `text-label` is the label **color**; the 12px size is `text-tag` (a shared name made Tailwind emit only the color).
