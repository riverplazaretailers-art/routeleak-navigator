# RouteLeak — a TwoRiverOps solution

Find completed field work that never made it onto an invoice.

RouteLeak reconciles field activity against invoices and payments, ranks the
exceptions by recoverable value, and gives an owner, controller or service
manager the evidence needed to decide: recover it, review it, or dismiss it.

This repository contains the **customer-facing application only**. The
authoritative RouteLeak backend remains the system of record.

---

## Architecture

```text
  Browser (this repo)                     RouteLeak backend (authoritative)
 ┌───────────────────────────┐           ┌──────────────────────────────────┐
 │ routes/  components/      │           │ CSV normalization                │
 │   presentation only       │           │ matching + confidence scoring    │
 │                           │  HTTPS    │ exception state machine          │
 │ lib/product-api  ─────────┼──────────▶│ operator workflow + permissions  │
 │   typed ProductApi        │  cookie   │ evidence lineage (R2)            │
 │   ├── http.ts   (live)    │  session  │ records + audit events (D1)      │
 │   └── demo.ts   (sample)  │           │ auth                             │
 │ lib/analytics  lib/billing│           └──────────────────────────────────┘
 └───────────────────────────┘
```

### Rules this codebase holds itself to

- **No domain logic in React.** Matching, CSV normalization, confidence
  scoring, exception categories, allowed state transitions, evidence lineage
  and audit events are produced by the backend and rendered here as-is.
  Components format values (currency, dates, labels); they never derive them.
- **One boundary.** Every backend interaction goes through the `ProductApi`
  interface in `src/lib/product-api/types.ts`. Screens never call `fetch`.
- **No replacement database.** No Supabase, no local persistence of records.
  The only browser storage is a demo sign-in marker used by the demo adapter.
- **No secrets in source.** The only configuration is `VITE_API_BASE_URL`
  (see `.env.example`). The backend authenticates the browser with an HttpOnly
  session cookie, so the client sends `credentials: "include"` and no keys.
- **Honest integration status.** Integrations are labeled Live, Pilot or
  Planned by the backend. CSV upload is Live; connectors stay Planned until
  the backend reports otherwise.

### Directory map

| Path                             | Responsibility                                        |
| -------------------------------- | ----------------------------------------------------- |
| `src/lib/product-api/types.ts`   | The typed contract: domain types + `ProductApi`       |
| `src/lib/product-api/http.ts`    | Live adapter, configured by `VITE_API_BASE_URL`       |
| `src/lib/product-api/demo.ts`    | Demo adapter (isolated, clearly labeled)              |
| `src/lib/product-api/demo-data.ts` | Fabricated sample-account data — demo adapter only  |
| `src/lib/product-api/index.ts`   | Adapter selection                                     |
| `src/lib/analytics.ts`           | Provider-neutral analytics + allow-list sanitizer      |
| `src/lib/billing.ts`             | Provider-neutral billing interface                     |
| `src/routes/*.tsx`               | Public pages                                           |
| `src/routes/_app.*.tsx`          | Authenticated workspace (gated in `_app.tsx`)          |

---

## API integration

Set `VITE_API_BASE_URL` to the backend origin (no trailing slash required) and
the HTTP adapter takes over automatically. With it unset, the app runs the
clearly labeled demo adapter.

Every request: `credentials: "include"`, `Accept: application/json`,
JSON bodies except run uploads, which are `multipart/form-data`.

| Method | Path                                | Purpose                                      |
| ------ | ----------------------------------- | -------------------------------------------- |
| GET    | `/v1/session`                       | Current operator; `401` means signed out     |
| POST   | `/v1/session`                       | Sign in (`{ email, password }`)              |
| DELETE | `/v1/session`                       | Sign out                                     |
| GET    | `/v1/summary`                       | Economic summary for the current period      |
| GET    | `/v1/runs`                          | Run history                                  |
| GET    | `/v1/runs/:id`                      | Single run                                   |
| POST   | `/v1/runs`                          | Start a run — multipart: `periodLabel`, `notes`, `fieldActivity`, `invoices`, `payments` |
| POST   | `/v1/runs/:id/export`               | Export results (`url` or inline `content`)   |
| GET    | `/v1/exceptions?runId&status&search`| Ranked exceptions                            |
| GET    | `/v1/exceptions/:id`                | Detail: evidence, lineage, audit, `allowedStatuses` |
| POST   | `/v1/exceptions/:id/status`         | Decision (`{ status, note? }`)               |
| GET    | `/v1/integrations`                  | Live / Pilot / Planned sources               |
| GET    | `/v1/plans`                         | Plan copy (no price is invented client-side) |
| GET    | `/v1/billing`                       | Subscription, payment state, usage           |
| POST   | `/v1/access-requests`               | Pilot analysis request                       |
| GET/PATCH | `/v1/settings`                   | Account settings                             |
| GET    | `/v1/admin/job-failures`            | Operations: failed stages                    |
| POST   | `/v1/admin/job-failures/:id/retry`  | Operations: retry                            |

**Error contract.** Non-2xx responses should return `{ "message": "..." }`.
Status codes map to `ProductApiError.code`: `401 → unauthorized`,
`403 → forbidden`, `404 → not_found`, `409 → conflict`,
`400/422 → invalid_input`, everything else `server`; a transport failure is
`network`. The UI renders the backend message verbatim, so backend messages are
customer-visible.

**Permissions.** The backend returns `permissions` on the session and
`allowedStatuses` on each exception; the UI only shows what those allow and
still expects the backend to reject anything else.

### Demo adapter

Active only when `VITE_API_BASE_URL` is empty. Sample account:
`controller@sample-fieldco.example` / password `demo`. Every screen shows a
"Sample account — demo data" notice, and the figures are fabricated — they are
never presented as customer results or proof of recovery.

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
