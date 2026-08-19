# RouteLeak — a TwoRiverOps solution

Find completed field work that never made it onto an invoice.

RouteLeak reconciles field activity against invoices and payments, ranks the
exceptions by recoverable value, and gives an owner, controller or service
manager the evidence needed to decide: recover it, review it, or dismiss it.

This repository contains the **customer-facing application only**. The
authoritative RouteLeak backend remains the system of record.

---

## Launch modes

The preserved RouteLeak backend is authoritative. It exposes `/api/uploads`,
`/api/audits`, `/api/pilots` and `/api/operator` and authenticates through its
own secure workspace session. This app never pretends to be connected to it.

Exactly one mode is resolved at runtime by `src/lib/launch-config.ts`:

| Mode | Configuration | Behaviour |
| ---- | ------------- | --------- |
| `demo` | no variables set | Synthetic, clearly labeled sample data. No backend calls at all. |
| `secure-link` | `VITE_SECURE_WORKSPACE_URL` | This app stays the public/product UI. Every real-analysis, sign-in and start CTA links to that URL only. Demo data is disabled and the in-app workspace is closed. |
| `api` | `VITE_API_BASE_URL` **and** `VITE_API_CONTRACT_VERSION=v1` | The typed v1 gateway adapter is used. |
| `misconfigured` | anything partial or contradictory | Fails closed: the UI shows the configuration error and every live action is disabled. |

A base URL alone is **not** enough and is never labeled Live. Capabilities
(`demoData`, `inAppAuth`, `liveAnalysis`, `backendCatalog`, `externalHandoff`)
are typed, and the UI hides or disables unsupported actions instead of showing
buttons that would 404.

### v1 gateway requirement

`api` mode targets a *future* gateway, not the current backend routes. Enable it
only when a gateway exists that:

- is served same-origin with this app (or from a CORS-approved origin) and
  authenticates with the conventional session cookie — `credentials: "include"`,
  no API keys in the browser;
- implements the typed contract in `src/lib/product-api/types.ts`, mapping the
  preserved `/api/uploads`, `/api/audits`, `/api/pilots` and `/api/operator`
  routes behind `/v1/*`.

## Architecture

```text
  Browser (this repo)                     RouteLeak backend (authoritative)
 ┌───────────────────────────┐           ┌──────────────────────────────────┐
 │ routes/  components/      │           │ /api/uploads   CSV normalization │
 │   presentation only       │  link or  │ /api/audits    matching + scoring│
 │ lib/launch-config  ───────┼──────────▶│ /api/pilots    pilot requests    │
 │   mode + capabilities     │  future   │ /api/operator  workflow + jobs   │
 │ lib/product-api           │  gateway  │ secure workspace auth, audit,    │
 │   ├── http.ts   (v1, api) │           │ evidence lineage (R2), D1        │
 │   ├── unavailable.ts      │           └──────────────────────────────────┘
 │   └── demo.ts   (sample)  │
 └───────────────────────────┘
```

### Rules this codebase holds itself to

- **No domain logic in React.** Matching, CSV normalization, confidence
  scoring, exception categories, allowed state transitions, evidence lineage
  and audit events belong to the backend.
- **One boundary.** Every backend interaction goes through the `ProductApi`
  interface in `src/lib/product-api/types.ts`. Screens never call `fetch`.
- **No replacement database.** No Supabase, no local persistence of records.
  The only browser storage is a demo sign-in marker used by the demo adapter.
- **No secrets in source.** Configuration is limited to the three `VITE_*`
  variables in `.env.example`.
- **Honest status.** Integrations are Live / Pilot / Planned as published by the
  backend; in secure-link mode only CSV upload is shown as Live and connectors
  stay Planned.

### Directory map

| Path                             | Responsibility                                        |
| -------------------------------- | ----------------------------------------------------- |
| `src/lib/launch-config.ts`       | Launch mode resolution + typed capabilities           |
| `src/lib/product-api/types.ts`   | The typed v1 contract: domain types + `ProductApi`    |
| `src/lib/product-api/http.ts`    | v1 gateway adapter (api mode only)                    |
| `src/lib/product-api/unavailable.ts` | Fail-closed adapter (secure-link / misconfigured) |
| `src/lib/product-api/demo.ts`    | Demo adapter (isolated, clearly labeled)              |
| `src/lib/product-api/demo-data.ts` | Fabricated sample-account data — demo adapter only  |
| `src/components/launch-cta.tsx`  | Mode-aware start / sign-in CTAs and mode notices      |
| `src/routes/*.tsx`               | Public pages                                           |
| `src/routes/_app.*.tsx`          | Authenticated workspace (demo/api modes only)          |

## v1 contract reference (api mode)

| Method | Path | Purpose |
| ------ | ---- | ------- |
| GET/POST/DELETE | `/v1/session` | Session lifecycle (`401` = signed out) |
| GET | `/v1/summary` | Economic summary for the current period |
| GET/POST | `/v1/runs`, `/v1/runs/:id`, `/v1/runs/:id/export` | Runs and exports |
| GET/POST | `/v1/exceptions`, `/v1/exceptions/:id`, `/v1/exceptions/:id/status` | Ranked exceptions and decisions |
| GET | `/v1/integrations`, `/v1/plans`, `/v1/billing`, `/v1/settings` | Catalog, plan copy, billing, settings |
| POST | `/v1/access-requests` | Pilot analysis request |
| GET/POST | `/v1/admin/job-failures`, `/v1/admin/job-failures/:id/retry` | Operations |

**Error contract.** Non-2xx responses return `{ "message": "..." }`;
`401 → unauthorized`, `403 → forbidden`, `404 → not_found`, `409 → conflict`,
`400/422 → invalid_input`, else `server`; transport failure is `network`.

### Demo adapter

Selected only in demo mode. Sample account:
`controller@sample-fieldco.example` / password `demo`. Every screen shows a
"Sample account — demo data" notice, and the figures are fabricated.

---

## Analytics

`src/lib/analytics.ts` is provider-neutral: install a real provider with
`setAnalyticsProvider`. Instrumented value events: `account_created`,
`onboarding_completed`, `core_workflow_started`, `first_successful_outcome`,
`core_workflow_completed`, `workflow_failed`, `repeat_usage`,
`converted_to_paid`, `subscription_cancelled`.

Properties pass through an **allow-list sanitizer** — identifiers, counts,
timings and outcomes only. Document contents, invoice lines, amounts, customer
names, emails and tokens are dropped even if a caller passes them.

## Billing

`src/lib/billing.ts` models product, plan, account, MRR, usage, trial and
payment state without any vendor SDK. The default provider is `manual`
(pilot analyses are quoted). Swapping in Stripe/Paddle touches only that file.

---

## Development

```sh
npm install
cp .env.example .env   # leave VITE_API_BASE_URL empty for the demo adapter
npm run dev
npm test               # adapter + workflow-transition tests
npm run build
```

## Built with

TanStack Start, React, TypeScript, Tailwind CSS, TanStack Query, Vitest.
