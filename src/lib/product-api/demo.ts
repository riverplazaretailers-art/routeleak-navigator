/**
 * DEMO ADAPTER — isolated, clearly labeled sample-account behaviour.
 *
 * Used only when VITE_API_BASE_URL is absent. It mirrors the ProductApi
 * contract with in-memory sample data so the workflow is demoable; it is not
 * a reimplementation of the backend's matching or state rules and must never
 * be used for production accounts.
 */
import {
  DEMO_BILLING,
  DEMO_INTEGRATIONS,
  DEMO_JOB_FAILURES,
  DEMO_PLANS,
  DEMO_SESSION,
  createDemoState,
  detailFor,
  type DemoState,
} from "./demo-data";
import {
  ProductApiError,
  type AccountSettings,
  type EconomicSummary,
  type ExceptionStatus,
  type ProductApi,
  type Run,
  type SessionUser,
} from "./types";

const SESSION_KEY = "routeleak.demo.session";
const DEMO_PASSWORD = "demo";

let state: DemoState | null = null;
function store(): DemoState {
  if (!state) state = createDemoState();
  return state;
}

function readStoredSession(): SessionUser | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(SESSION_KEY) ? DEMO_SESSION : null;
}

const delay = (ms = 220) => new Promise((resolve) => setTimeout(resolve, ms));

function requireSession(): SessionUser {
  const session = readStoredSession();
  if (!session) {
    throw new ProductApiError("unauthorized", "Sign in to continue.");
  }
  return session;
}

function summarize(s: DemoState): EconomicSummary {
  const current = s.exceptions;
  const count = (status: ExceptionStatus) => current.filter((e) => e.status === status).length;
  const total = (status: ExceptionStatus) =>
    current.filter((e) => e.status === status).reduce((sum, e) => sum + e.recoverableAmount, 0);

  return {
    periodLabel: "July 2026",
    currency: "USD",
    recoverableTotal: current
      .filter((e) => e.status === "open" || e.status === "needs_review")
      .reduce((sum, e) => sum + e.recoverableAmount, 0),
    recoveredTotal: total("recovered"),
    jobsAnalyzed: 812,
    openCount: count("open"),
    needsReviewCount: count("needs_review"),
    recoveredCount: count("recovered"),
    dismissedCount: count("dismissed"),
    lastRunAt: s.runs[0]?.completedAt ?? s.runs[0]?.startedAt,
  };
}

export function createDemoProductApi(): ProductApi {
  return {
    adapterLabel: "Sample data (demo adapter)",
    isDemo: true,

    async getSession() {
      await delay(80);
      return readStoredSession();
    },

    async signIn({ email, password }) {
      await delay();
      if (!email.includes("@") || password.length < 4) {
        throw new ProductApiError(
          "invalid_input",
          "Enter an email address and a password of at least 4 characters.",
        );
      }
      if (password !== DEMO_PASSWORD) {
        throw new ProductApiError(
          "unauthorized",
          "This demo accepts the sample password only. Use password: demo",
        );
      }
      if (typeof window !== "undefined") {
        window.localStorage.setItem(SESSION_KEY, "1");
      }
      return DEMO_SESSION;
    },

    async signOut() {
      await delay(60);
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(SESSION_KEY);
      }
    },

    async getEconomicSummary() {
      requireSession();
      await delay();
      return summarize(store());
    },

    async listRuns() {
      requireSession();
      await delay();
      return [...store().runs];
    },

    async getRun(runId) {
      requireSession();
      await delay();
      const run = store().runs.find((r) => r.id === runId);
      if (!run) throw new ProductApiError("not_found", "Run not found.");
      return run;
    },

    async startRun(input) {
      requireSession();
      if (!input.fieldActivityFile || !input.invoicesFile) {
        throw new ProductApiError(
          "invalid_input",
          "A field activity export and an invoice export are both required.",
        );
      }
      await delay(700);
      const s = store();
      const run: Run = {
        id: `run-demo-${s.runs.length + 1}`,
        label: input.periodLabel || "Ad-hoc reconciliation",
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        status: "completed",
        sourceSummary: [
          input.fieldActivityFile.name,
          input.invoicesFile.name,
          input.paymentsFile?.name,
        ]
          .filter(Boolean)
          .join(" + "),
        jobsAnalyzed: 812,
        exceptionCount: s.exceptions.length,
        recoverableTotal: summarize(s).recoverableTotal,
        currency: "USD",
      };
      s.runs = [run, ...s.runs];
      s.exceptions = s.exceptions.map((e) => ({ ...e, runId: run.id }));
      return run;
    },

    async listExceptions(query) {
      requireSession();
      await delay();
      const s = store();
      let list = [...s.exceptions];
      if (query?.runId) list = list.filter((e) => e.runId === query.runId);
      if (query?.status && query.status !== "all") {
        list = list.filter((e) => e.status === query.status);
      }
      if (query?.search) {
        const q = query.search.toLowerCase();
        list = list.filter(
          (e) =>
            e.workOrderRef.toLowerCase().includes(q) || e.customerName.toLowerCase().includes(q),
        );
      }
      return list.sort((a, b) => b.recoverableAmount - a.recoverableAmount);
    },

    async getException(exceptionId) {
      requireSession();
      await delay();
      const s = store();
      const summary = s.exceptions.find((e) => e.id === exceptionId);
      if (!summary) throw new ProductApiError("not_found", "Exception not found.");
      return detailFor(summary, s, "USD");
    },

    async updateExceptionStatus({ exceptionId, status, note }) {
      const session = requireSession();
      if (!session.permissions.includes("exceptions:update")) {
        throw new ProductApiError("forbidden", "Your role cannot change exception status.");
      }
      await delay(300);
      const s = store();
      const index = s.exceptions.findIndex((e) => e.id === exceptionId);
      if (index === -1) throw new ProductApiError("not_found", "Exception not found.");
      const current = s.exceptions[index]!;
      const updated = { ...current, status };
      s.exceptions = [...s.exceptions.slice(0, index), updated, ...s.exceptions.slice(index + 1)];
      const detail = detailFor(updated, s, "USD");
      const existing = s.details[exceptionId];
      const audit = [
        ...(existing?.audit ?? detail.audit),
        {
          actor: session.name,
          action: `Marked ${status.replace("_", " ")}`,
          at: new Date().toISOString(),
          ...(note ? { note } : {}),
        },
      ];
      s.details[exceptionId] = {
        evidence: existing?.evidence ?? detail.evidence,
        lineage: existing?.lineage ?? detail.lineage,
        audit,
      };
      return { ...detail, audit };
    },

    async exportRun(runId) {
      requireSession();
      await delay(400);
      const s = store();
      const rows = s.exceptions.filter((e) => e.runId === runId || true);
      const header =
        "work_order,customer,technician,completed_at,category,status,recoverable_usd\n";
      const body = rows
        .map((e) =>
          [
            e.workOrderRef,
            `"${e.customerName}"`,
            e.technician,
            e.completedAt,
            e.category,
            e.status,
            (e.recoverableAmount / 100).toFixed(2),
          ].join(","),
        )
        .join("\n");
      return {
        filename: `routeleak-demo-${runId}.csv`,
        mimeType: "text/csv",
        content: header + body,
      };
    },

    async listIntegrations() {
      await delay(120);
      return DEMO_INTEGRATIONS;
    },

    async listPlans() {
      await delay(120);
      return DEMO_PLANS;
    },

    async getBillingState() {
      requireSession();
      await delay();
      return DEMO_BILLING;
    },

    async requestAccess(input) {
      await delay(400);
      if (!input.email.includes("@") || !input.companyName.trim()) {
        throw new ProductApiError(
          "invalid_input",
          "Company name and a valid work email are required.",
        );
      }
      return { received: true };
    },

    async getSettings() {
      requireSession();
      await delay();
      return { ...store().settings };
    },

    async updateSettings(input) {
      requireSession();
      await delay(250);
      const s = store();
      s.settings = { ...s.settings, ...input } as AccountSettings;
      return { ...s.settings };
    },

    async listJobFailures() {
      requireSession();
      await delay();
      return DEMO_JOB_FAILURES;
    },

    async retryJob(failureId) {
      const session = requireSession();
      if (!DEMO_JOB_FAILURES.some((f) => f.id === failureId)) {
        throw new ProductApiError("not_found", "Job failure not found.");
      }
      if (session.role !== "owner" && session.role !== "controller") {
        throw new ProductApiError("forbidden", "Only account owners can retry jobs.");
      }
      await delay(300);
      return { queued: true };
    },
  };
}

/** Test helper: reset in-memory demo state between cases. */
export function __resetDemoState() {
  state = null;
}
