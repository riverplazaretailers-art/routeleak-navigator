/**
 * RouteLeak ProductApi — the single typed boundary between this Lovable
 * frontend and the authoritative RouteLeak backend.
 *
 * The backend owns matching, CSV normalization, evidence lineage, exception
 * state rules, operator workflow, D1/R2 storage, auth and audit events.
 * Nothing in this frontend may re-implement those rules; it only calls them.
 */

export type UserRole = "owner" | "controller" | "service_manager" | "operator";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  accountId: string;
  accountName: string;
  /** True when the backend says this is a labeled, illustrative sample account. */
  isSampleAccount: boolean;
  permissions: string[];
}

export type ExceptionStatus = "open" | "needs_review" | "recovered" | "dismissed";

export type ExceptionCategory =
  "not_invoiced" | "underbilled" | "invoiced_not_collected" | "duplicate_visit";

export interface ExceptionSummary {
  id: string;
  runId: string;
  workOrderRef: string;
  customerName: string;
  technician: string;
  completedAt: string;
  /** Backend-computed recoverable value, in minor units of the run currency. */
  recoverableAmount: number;
  /** Backend-computed rank score, 0-100. */
  confidence: number;
  category: ExceptionCategory;
  status: ExceptionStatus;
  /** Backend-authored, human-readable reason for the exception. */
  reason: string;
}

export type EvidenceKind = "field_record" | "invoice" | "payment" | "contract" | "audit";

export interface EvidenceItem {
  id: string;
  kind: EvidenceKind;
  label: string;
  source: string;
  capturedAt: string;
  /** Backend-provided display summary. Never re-derived client-side. */
  summary: string;
  /** Backend lineage pointer (e.g. R2 object reference). Display only. */
  reference: string;
}

export interface LineageStep {
  step: string;
  detail: string;
  at: string;
}

export interface AuditEvent {
  actor: string;
  action: string;
  at: string;
  note?: string | undefined;
}

export interface ExceptionDetail extends ExceptionSummary {
  currency: string;
  evidence: EvidenceItem[];
  lineage: LineageStep[];
  audit: AuditEvent[];
  /** Backend-permitted next states for the current operator. */
  allowedStatuses: ExceptionStatus[];
}

export type RunStatus = "queued" | "running" | "completed" | "failed";

export interface Run {
  id: string;
  label: string;
  startedAt: string;
  completedAt?: string | undefined;
  status: RunStatus;
  sourceSummary: string;
  jobsAnalyzed: number;
  exceptionCount: number;
  recoverableTotal: number;
  currency: string;
  failureReason?: string | undefined;
}

export interface RunInput {
  periodLabel: string;
  fieldActivityFile?: File | null | undefined;
  invoicesFile?: File | null | undefined;
  paymentsFile?: File | null | undefined;
  notes?: string | undefined;
}

export interface EconomicSummary {
  periodLabel: string;
  currency: string;
  recoverableTotal: number;
  recoveredTotal: number;
  jobsAnalyzed: number;
  openCount: number;
  needsReviewCount: number;
  recoveredCount: number;
  dismissedCount: number;
  lastRunAt?: string | undefined;
}

export type IntegrationState = "live" | "pilot" | "planned";

export interface Integration {
  id: string;
  name: string;
  category: "field_service" | "accounting" | "file";
  state: IntegrationState;
  description: string;
}

export interface Plan {
  id: string;
  name: string;
  /** Null when pricing is quoted per account rather than published. */
  priceCopy: string | null;
  cadenceCopy: string;
  summary: string;
  features: string[];
  ctaLabel: string;
  highlighted?: boolean | undefined;
}

export type PaymentState = "none" | "current" | "past_due" | "failed";
export type SubscriptionState = "none" | "trial" | "pilot" | "active" | "canceled";

export interface BillingState {
  accountId: string;
  productId: "routeleak";
  planId: string | null;
  planName: string | null;
  subscriptionState: SubscriptionState;
  paymentState: PaymentState;
  /** Monthly recurring revenue in minor units, or null when not contracted. */
  mrr: number | null;
  currency: string;
  trialEndsAt?: string | undefined;
  renewsAt?: string | undefined;
  usage: { label: string; used: number; included: number | null }[];
}

export interface AccessRequest {
  companyName: string;
  contactName: string;
  email: string;
  role: string;
  techniciansCopy: string;
  notes?: string | undefined;
}

export interface AccountSettings {
  accountName: string;
  timezone: string;
  currency: string;
  minimumRecoverableAmount: number;
  notifyOnRunComplete: boolean;
  notifyOnRunFailure: boolean;
}

export interface JobFailure {
  id: string;
  runId: string;
  stage: string;
  message: string;
  occurredAt: string;
  retryable: boolean;
}

export interface ExportResult {
  filename: string;
  mimeType: string;
  /** Either a backend-signed URL or inline content produced by the backend. */
  url?: string | undefined;
  content?: string | undefined;
}

export type ProductApiErrorCode =
  "unauthorized" | "forbidden" | "not_found" | "invalid_input" | "conflict" | "network" | "server";

export class ProductApiError extends Error {
  code: ProductApiErrorCode;
  status?: number | undefined;

  constructor(code: ProductApiErrorCode, message: string, status?: number | undefined) {
    super(message);
    this.name = "ProductApiError";
    this.code = code;
    this.status = status;
  }
}

export interface ListExceptionsQuery {
  runId?: string | undefined;
  status?: ExceptionStatus | "all" | undefined;
  search?: string | undefined;
}

export interface ProductApi {
  /** Non-secret label surfaced in the UI, e.g. "Sample data" or "Live backend". */
  readonly adapterLabel: string;
  readonly isDemo: boolean;

  getSession(): Promise<SessionUser | null>;
  signIn(input: { email: string; password: string }): Promise<SessionUser>;
  signOut(): Promise<void>;

  getEconomicSummary(): Promise<EconomicSummary>;
  listRuns(): Promise<Run[]>;
  getRun(runId: string): Promise<Run>;
  startRun(input: RunInput): Promise<Run>;

  listExceptions(query?: ListExceptionsQuery): Promise<ExceptionSummary[]>;
  getException(exceptionId: string): Promise<ExceptionDetail>;
  updateExceptionStatus(input: {
    exceptionId: string;
    status: ExceptionStatus;
    note?: string | undefined;
  }): Promise<ExceptionDetail>;

  exportRun(runId: string): Promise<ExportResult>;

  listIntegrations(): Promise<Integration[]>;
  listPlans(): Promise<Plan[]>;
  getBillingState(): Promise<BillingState>;
  requestAccess(input: AccessRequest): Promise<{ received: true }>;

  getSettings(): Promise<AccountSettings>;
  updateSettings(input: Partial<AccountSettings>): Promise<AccountSettings>;

  listJobFailures(): Promise<JobFailure[]>;
  retryJob(failureId: string): Promise<{ queued: true }>;
}
