import { cn } from "@/lib/utils";
import { STATUS_LABEL } from "@/lib/format";
import type {
  ExceptionStatus,
  IntegrationState,
  RunStatus,
} from "@/lib/product-api";

const base =
  "inline-flex items-center gap-1.5 rounded-sm border px-1.5 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-wide";

const exceptionTone: Record<ExceptionStatus, string> = {
  open: "border-warning/50 bg-warning/12 text-warning-foreground",
  needs_review: "border-info/40 bg-info/10 text-info",
  recovered: "border-success/40 bg-success/10 text-success",
  dismissed: "border-border-strong bg-muted text-muted-foreground",
};

export function ExceptionStatusBadge({ status }: { status: ExceptionStatus }) {
  return <span className={cn(base, exceptionTone[status])}>{STATUS_LABEL[status]}</span>;
}

const runTone: Record<RunStatus, string> = {
  queued: "border-border-strong bg-muted text-muted-foreground",
  running: "border-info/40 bg-info/10 text-info",
  completed: "border-success/40 bg-success/10 text-success",
  failed: "border-destructive/40 bg-destructive/10 text-destructive",
};

export function RunStatusBadge({ status }: { status: RunStatus }) {
  return <span className={cn(base, runTone[status])}>{status}</span>;
}

const integrationTone: Record<IntegrationState, string> = {
  live: "border-success/40 bg-success/10 text-success",
  pilot: "border-info/40 bg-info/10 text-info",
  planned: "border-border-strong bg-muted text-muted-foreground",
};

export function IntegrationStateBadge({ state }: { state: IntegrationState }) {
  return <span className={cn(base, integrationTone[state])}>{state}</span>;
}

export function DataSourceBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-sm border border-border-strong bg-secondary px-1.5 py-0.5 text-[0.6875rem] font-medium text-secondary-foreground">
      {label}
    </span>
  );
}
