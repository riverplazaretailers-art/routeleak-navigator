/**
 * DEMO DATA — illustrative sample account only.
 *
 * These figures are fabricated for product demonstration. They are NOT
 * customer results and must never be presented as proof of outcomes.
 * This module is imported only by the demo adapter.
 */
import type {
  AccountSettings,
  AuditEvent,
  BillingState,
  EvidenceItem,
  ExceptionDetail,
  ExceptionSummary,
  Integration,
  JobFailure,
  LineageStep,
  Plan,
  Run,
  SessionUser,
} from "./types";

export const DEMO_SESSION: SessionUser = {
  id: "demo-user-1",
  name: "Dana Whitfield",
  email: "controller@sample-fieldco.example",
  role: "controller",
  accountId: "demo-account",
  accountName: "Sample Field Co (demo)",
  isSampleAccount: true,
  permissions: [
    "exceptions:read",
    "exceptions:update",
    "runs:create",
    "billing:read",
  ],
};

export interface DemoState {
  runs: Run[];
  exceptions: ExceptionSummary[];
  details: Record<
    string,
    { evidence: EvidenceItem[]; lineage: LineageStep[]; audit: AuditEvent[] }
  >;
  settings: AccountSettings;
}

const RUN_ID = "run-2026-07";

export function createDemoState(): DemoState {
  const runs: Run[] = [
    {
      id: RUN_ID,
      label: "July 2026 reconciliation",
      startedAt: "2026-08-03T08:12:00.000Z",
      completedAt: "2026-08-03T08:14:41.000Z",
      status: "completed",
      sourceSummary: "field_activity_july.csv + invoices_july.csv + payments_july.csv",
      jobsAnalyzed: 812,
      exceptionCount: 5,
      recoverableTotal: 1487400,
      currency: "USD",
    },
    {
      id: "run-2026-06",
      label: "June 2026 reconciliation",
      startedAt: "2026-07-02T09:04:00.000Z",
      completedAt: "2026-07-02T09:06:12.000Z",
      status: "completed",
      sourceSummary: "field_activity_june.csv + invoices_june.csv",
      jobsAnalyzed: 774,
      exceptionCount: 4,
      recoverableTotal: 962500,
      currency: "USD",
    },
    {
      id: "run-2026-05",
      label: "May 2026 reconciliation",
      startedAt: "2026-06-02T10:22:00.000Z",
      status: "failed",
      sourceSummary: "field_activity_may.csv",
      jobsAnalyzed: 0,
      exceptionCount: 0,
      recoverableTotal: 0,
      currency: "USD",
      failureReason:
        "Invoice export was missing a customer identifier column; reconciliation halted before matching.",
    },
  ];

  const exceptions: ExceptionSummary[] = [
    {
      id: "exc-1041",
      runId: RUN_ID,
      workOrderRef: "WO-48120",
      customerName: "Harbor Ridge Property Group",
      technician: "M. Ortiz",
      completedAt: "2026-07-09T16:40:00.000Z",
      recoverableAmount: 612000,
      confidence: 94,
      category: "not_invoiced",
      status: "open",
      reason:
        "Completed emergency repair with parts and 4.5 labour hours; no invoice line found in the billing export for this work order.",
    },
    {
      id: "exc-1042",
      runId: RUN_ID,
      workOrderRef: "WO-48244",
      customerName: "Cedar Valley Schools",
      technician: "J. Nkemelu",
      completedAt: "2026-07-14T11:05:00.000Z",
      recoverableAmount: 388400,
      confidence: 88,
      category: "underbilled",
      status: "open",
      reason:
        "Field record shows two technicians for 6 hours; invoice billed a single technician at the standard rate.",
    },
    {
      id: "exc-1043",
      runId: RUN_ID,
      workOrderRef: "WO-48301",
      customerName: "Northgate Retail Trust",
      technician: "S. Barrow",
      completedAt: "2026-07-18T14:20:00.000Z",
      recoverableAmount: 275000,
      confidence: 81,
      category: "invoiced_not_collected",
      status: "needs_review",
      reason:
        "Invoice issued and aged 41 days with no matching payment record in the payments export.",
    },
    {
      id: "exc-1044",
      runId: RUN_ID,
      workOrderRef: "WO-48355",
      customerName: "Willow Bend Facilities",
      technician: "M. Ortiz",
      completedAt: "2026-07-22T09:55:00.000Z",
      recoverableAmount: 142000,
      confidence: 72,
      category: "not_invoiced",
      status: "recovered",
      reason:
        "After-hours diagnostic visit closed without a billing record; invoiced after review.",
    },
    {
      id: "exc-1045",
      runId: RUN_ID,
      workOrderRef: "WO-48390",
      customerName: "Ridgeline Cold Storage",
      technician: "A. Fuentes",
      completedAt: "2026-07-27T13:10:00.000Z",
      recoverableAmount: 70000,
      confidence: 58,
      category: "duplicate_visit",
      status: "dismissed",
      reason:
        "Second visit within 48 hours on the same asset; contract covers warranty rework, so no recovery is due.",
    },
  ];

  const details: DemoState["details"] = {
    "exc-1041": {
      evidence: [
        {
          id: "ev-1",
          kind: "field_record",
          label: "Completed work order WO-48120",
          source: "field_activity_july.csv, row 214",
          capturedAt: "2026-07-09T16:40:00.000Z",
          summary:
            "Status completed, 4.5 labour hours, 3 parts logged, technician signature captured on site.",
          reference: "evidence/demo/wo-48120/field-record",
        },
        {
          id: "ev-2",
          kind: "invoice",
          label: "No invoice line matched",
          source: "invoices_july.csv",
          capturedAt: "2026-08-03T08:13:10.000Z",
          summary:
            "No invoice references WO-48120 or the customer/site/date combination within the tolerance window.",
          reference: "evidence/demo/wo-48120/invoice-miss",
        },
        {
          id: "ev-3",
          kind: "audit",
          label: "Match attempt log",
          source: "RouteLeak matching engine",
          capturedAt: "2026-08-03T08:13:11.000Z",
          summary:
            "Reference match, customer+date match and fuzzy site match all returned no candidate.",
          reference: "evidence/demo/wo-48120/match-log",
        },
      ],
      lineage: [
        {
          step: "Ingested",
          detail: "field_activity_july.csv normalized, 812 completed jobs retained.",
          at: "2026-08-03T08:12:30.000Z",
        },
        {
          step: "Matched",
          detail: "Compared against 796 invoice lines and 741 payment records.",
          at: "2026-08-03T08:13:10.000Z",
        },
        {
          step: "Flagged",
          detail: "Category not_invoiced, confidence 94, recoverable estimate $6,120.00.",
          at: "2026-08-03T08:13:12.000Z",
        },
      ],
      audit: [
        {
          actor: "RouteLeak",
          action: "Exception created",
          at: "2026-08-03T08:13:12.000Z",
        },
      ],
    },
  };

  const settings: AccountSettings = {
    accountName: "Sample Field Co (demo)",
    timezone: "America/Chicago",
    currency: "USD",
    minimumRecoverableAmount: 5000,
    notifyOnRunComplete: true,
    notifyOnRunFailure: true,
  };

  return { runs, exceptions, details, settings };
}

export const DEMO_INTEGRATIONS: Integration[] = [
  {
    id: "csv",
    name: "CSV upload",
    category: "file",
    state: "live",
    description:
      "Upload field activity, invoice and payment exports. Normalization and matching run in the RouteLeak backend.",
  },
  {
    id: "accounting-generic",
    name: "Accounting export connector",
    category: "accounting",
    state: "planned",
    description:
      "Direct pull of invoices and payments from your accounting system. Not available yet.",
  },
  {
    id: "fsm-generic",
    name: "Field service management connector",
    category: "field_service",
    state: "planned",
    description:
      "Direct pull of completed work orders from your dispatch system. Not available yet.",
  },
];

export const DEMO_PLANS: Plan[] = [
  {
    id: "pilot",
    name: "Pilot analysis",
    priceCopy: null,
    cadenceCopy: "Fixed-scope engagement, quoted per account",
    summary:
      "One reconciliation across a recent period so you can see what was missed before committing to anything.",
    features: [
      "Up to 3 months of field activity and billing exports",
      "Ranked exception list with evidence for each item",
      "Reviewed walkthrough of findings with your controller",
      "Exportable results for your billing team",
    ],
    ctaLabel: "Request a pilot analysis",
    highlighted: true,
  },
  {
    id: "operating",
    name: "Operating",
    priceCopy: null,
    cadenceCopy: "Monthly, scoped to technician count",
    summary:
      "Recurring reconciliation for teams that want leakage caught every billing cycle.",
    features: [
      "Monthly or per-cycle reconciliation runs",
      "Exception queue with recovered / dismissed / needs review states",
      "Evidence lineage retained for audit",
      "Named operational contact",
    ],
    ctaLabel: "Talk about ongoing runs",
  },
];

export const DEMO_BILLING: BillingState = {
  accountId: "demo-account",
  productId: "routeleak",
  planId: "pilot",
  planName: "Pilot analysis (demo)",
  subscriptionState: "pilot",
  paymentState: "none",
  mrr: null,
  currency: "USD",
  usage: [
    { label: "Reconciliation runs this period", used: 2, included: 3 },
    { label: "Jobs analyzed", used: 1586, included: null },
  ],
};

export const DEMO_JOB_FAILURES: JobFailure[] = [
  {
    id: "fail-3081",
    runId: "run-2026-05",
    stage: "invoice_normalization",
    message: "Missing required column: customer_id",
    occurredAt: "2026-06-02T10:22:38.000Z",
    retryable: true,
  },
];

export function detailFor(
  summary: ExceptionSummary,
  state: DemoState,
  currency: string,
): ExceptionDetail {
  const extra = state.details[summary.id] ?? {
    evidence: [
      {
        id: `${summary.id}-ev-1`,
        kind: "field_record" as const,
        label: `Completed work order ${summary.workOrderRef}`,
        source: "field_activity_july.csv",
        capturedAt: summary.completedAt,
        summary:
          "Backend-provided field record for this work order, retained with the run.",
        reference: `evidence/demo/${summary.workOrderRef}/field-record`,
      },
      {
        id: `${summary.id}-ev-2`,
        kind: "invoice" as const,
        label: "Billing comparison",
        source: "invoices_july.csv",
        capturedAt: "2026-08-03T08:13:10.000Z",
        summary: summary.reason,
        reference: `evidence/demo/${summary.workOrderRef}/billing`,
      },
    ],
    lineage: [
      {
        step: "Ingested",
        detail: "Sources normalized by the RouteLeak backend.",
        at: "2026-08-03T08:12:30.000Z",
      },
      {
        step: "Flagged",
        detail: `Category ${summary.category}, confidence ${summary.confidence}.`,
        at: "2026-08-03T08:13:12.000Z",
      },
    ],
    audit: [
      {
        actor: "RouteLeak",
        action: "Exception created",
        at: "2026-08-03T08:13:12.000Z",
      },
    ],
  };

  return {
    ...summary,
    currency,
    evidence: extra.evidence,
    lineage: extra.lineage,
    audit: extra.audit,
    allowedStatuses: ["open", "needs_review", "recovered", "dismissed"],
  };
}
