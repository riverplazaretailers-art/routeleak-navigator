import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";

import { PageHeader } from "@/components/app-shell";
import { ErrorState, SuccessNote } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "@/hooks/use-session";
import { getAnalytics } from "@/lib/analytics";
import { getProductApi, type Run, type RunInput } from "@/lib/product-api";

export const Route = createFileRoute("/_app/reconcile")({
  head: () => ({
    meta: [
      { title: "Run reconciliation — RouteLeak" },
      {
        name: "description",
        content:
          "Upload field activity, invoice and payment exports and run a RouteLeak reconciliation for the period.",
      },
      { property: "og:title", content: "Run a RouteLeak reconciliation" },
      {
        property: "og:description",
        content: "Upload your period exports and reconcile completed work against billing.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ReconcilePage,
});

function FileField({
  id,
  label,
  hint,
  required,
  onChange,
}: {
  id: string;
  label: string;
  hint: string;
  required?: boolean;
  onChange: (file: File | null) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </Label>
      <Input
        id={id}
        type="file"
        accept=".csv,text/csv"
        aria-describedby={`${id}-hint`}
        onChange={(event) => onChange(event.target.files?.[0] ?? null)}
      />
      <p id={`${id}-hint`} className="text-xs text-muted-foreground">
        {hint}
      </p>
    </div>
  );
}

function ReconcilePage() {
  const api = getProductApi();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const session = useSession();
  const startedAt = useRef<number>(0);

  const runs = useQuery({ queryKey: ["runs"], queryFn: () => api.listRuns() });
  const isFirstRun =
    (runs.data ?? []).filter((r) => r.status === "completed").length === 0;

  const [periodLabel, setPeriodLabel] = useState("");
  const [fieldActivityFile, setFieldActivityFile] = useState<File | null>(null);
  const [invoicesFile, setInvoicesFile] = useState<File | null>(null);
  const [paymentsFile, setPaymentsFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");

  const mutation = useMutation({
    mutationFn: (input: RunInput) => {
      startedAt.current = Date.now();
      getAnalytics().track("core_workflow_started", {
        accountId: session.data?.accountId ?? null,
        workflow: "reconciliation",
        sourceCount: [input.fieldActivityFile, input.invoicesFile, input.paymentsFile]
          .filter(Boolean).length,
        isSampleAccount: session.data?.isSampleAccount ?? null,
      });
      return api.startRun(input);
    },
    onSuccess: (run: Run) => {
      const analytics = getAnalytics();
      const base = {
        accountId: session.data?.accountId ?? null,
        workflow: "reconciliation",
        runId: run.id,
        exceptionCount: run.exceptionCount,
        jobsAnalyzed: run.jobsAnalyzed,
        durationMs: Date.now() - startedAt.current,
      };
      if (isFirstRun) {
        analytics.track("onboarding_completed", base);
        analytics.track("first_successful_outcome", base);
      }
      analytics.track("core_workflow_completed", { ...base, outcome: run.status });
      void queryClient.invalidateQueries();
    },
    onError: (error: unknown) => {
      getAnalytics().track("workflow_failed", {
        accountId: session.data?.accountId ?? null,
        workflow: "reconciliation",
        failureStage: "start_run",
        outcome: error instanceof Error ? error.name : "error",
      });
    },
  });

  const completedRun = mutation.data;

  return (
    <>
      <PageHeader
        title="Run reconciliation"
        description="Bring the period's exports. Normalization and matching run in the RouteLeak backend; nothing is written back to your systems."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,32rem)_1fr]">
        <form
          className="panel space-y-4 p-5"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            mutation.mutate({
              periodLabel,
              fieldActivityFile,
              invoicesFile,
              paymentsFile,
              notes,
            });
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="periodLabel">Period label</Label>
            <Input
              id="periodLabel"
              placeholder="e.g. August 2026"
              value={periodLabel}
              onChange={(e) => setPeriodLabel(e.target.value)}
            />
          </div>

          <FileField
            id="fieldActivity"
            label="Field activity export"
            hint="Completed work orders with customer, site, technician, completion time and labour."
            required
            onChange={setFieldActivityFile}
          />
          <FileField
            id="invoices"
            label="Invoice export"
            hint="Invoices covering the same period, with work order reference where available."
            required
            onChange={setInvoicesFile}
          />
          <FileField
            id="payments"
            label="Payments export (optional)"
            hint="Adds detection of invoiced work that was never collected."
            onChange={setPaymentsFile}
          />

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes for the run (optional)</Label>
            <Textarea
              id="notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {mutation.isError ? (
            <ErrorState error={mutation.error} title="Reconciliation did not start" />
          ) : null}

          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Reconciling…" : "Start reconciliation"}
          </Button>
        </form>

        <div className="space-y-4">
          {completedRun ? (
            <SuccessNote>
              <p className="font-semibold">
                {completedRun.label} completed — {completedRun.exceptionCount} exceptions
                across {completedRun.jobsAnalyzed.toLocaleString("en-US")} jobs.
              </p>
              <div className="mt-3 flex gap-2">
                <Button size="sm" onClick={() => void navigate({ to: "/dashboard" })}>
                  Review exceptions
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link to="/history">Run history</Link>
                </Button>
              </div>
            </SuccessNote>
          ) : null}

          <div className="panel p-5">
            <h2 className="text-sm font-semibold">What happens to these files</h2>
            <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
              <li>Files are sent to the RouteLeak backend and normalized there.</li>
              <li>
                Matching, confidence scoring and exception categories are produced by the
                backend engine — this interface does not compute them.
              </li>
              <li>
                Evidence lineage is retained with the run so each finding can be defended
                later.
              </li>
              <li>
                Analytics record only counts and timings. No file contents, invoice lines
                or customer names leave the product.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
