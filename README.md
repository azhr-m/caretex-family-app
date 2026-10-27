# CARETEX Family App

Mobile-first web app for families of care-home residents. React 19 + TypeScript + Vite, TanStack Router/Query/Form, Zustand, i18next (EN/HE, RTL), Tailwind v4, Radix/shadcn-style primitives, MSW mocks.

Build status per phase: [`PROGRESS.md`](PROGRESS.md).

The spec and designs are in [`design_handoff_caretex_family_app/`](design_handoff_caretex_family_app/README.md). Work rules are in [`CLAUDE.md`](CLAUDE.md).

## Getting started

```bash
corepack enable          # or prefix commands with: corepack pnpm@9.15.9
pnpm install
pnpm dev                 # http://localhost:5175
```

All data is mocked by MSW (`VITE_USE_MOCKS=true` in `.env`). To use the real CARETEX API, see [docs/BACKEND_INTEGRATION.md](docs/BACKEND_INTEGRATION.md).

## Scripts

| Command           | What it does                                                                         |
| ----------------- | ------------------------------------------------------------------------------------ |
| `pnpm dev`        | Vite dev server with mocks                                                           |
| `pnpm build`      | Typecheck + production build                                                         |
| `pnpm typecheck`  | `tsc -b`                                                                             |
| `pnpm lint`       | ESLint, including the RTL rule that blocks `ml-/mr-/pl-/pr-/left-/right-/text-left…` |
| `pnpm test`       | Vitest unit tests                                                                    |
| `pnpm e2e`        | Playwright: journeys, visual snapshots, axe, layout and PWA tests (uses local Chrome) |
| `pnpm e2e:update` | Refresh visual baselines after an intended UI change                                 |
| `pnpm build:prod` | Production build with mocks off, into `dist-prod/`                                   |
| `pnpm lighthouse` | Lighthouse mobile on `dist-prod/`: fails below 90 performance / 100 accessibility    |
| `pnpm i18n:check` | Fails if `en` and `he` locale keys differ                                            |

## Dev tools

In dev builds a **Dev** button (bottom-start) opens the Dev panel: language, theme, mock scenario, demo sign-in, and the network simulator (Normal, Slow 3G, Very slow, Offline, Random errors, Force 401, Force 403), and **Long strings**, which doubles every translation to stress layouts. `/dev/components` shows every shared component.

## Layout

```
src/
  app/         providers, router, query client, theme
  api/         client (fetch + refresh + errors), schemas (zod), endpoints, queries, keys
  mocks/       MSW worker, handlers, fixtures, simulator, scenarios
  stores/      prefs, session, network, ui, surveyDrafts, dev
  components/  ui/ (primitives) · common/ · states/ · app/ (shell, dev panel)
  routes/      TanStack file routes (routeTree.gen.ts is generated)
  lib/         format, i18n, status, utils
  locales/     en/*.json, he/*.json
```
