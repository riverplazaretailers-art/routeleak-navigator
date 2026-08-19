import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

import { PageHeader } from "@/components/app-shell";
import { ExceptionTable } from "@/components/exception-table";
import { EmptyState, ErrorState, LoadingRows } from "@/components/states";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/use-session";
import { getAnalytics } from "@/lib/analytics";
import { dateTime, money } from "@/lib/format";
import { getProductApi } from "@/lib/product-api";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — RouteLeak" },
      {
        name: "description",
        content:
          "Recoverable value, exception counts and the highest-value open findings from your latest RouteLeak reconciliation run.",
      },
      { property: "og:title", content: "RouteLeak dashboard" },
      {
        property: "og:description",
        content: "Recoverable value and the highest-value open findings.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DashboardPage,
});

function Metric({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="panel p-4">
      <p className="label-caps">{label}</p>
      <p className="num mt-1 text-xl font-semibold">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function DashboardPage() {
  const api = getProductApi();
  const session = useSession();
  const summary = useQuery({
    queryKey: ["summary"],
    queryFn: () => api.getEconomicSummary(),
  });
  const exceptions = useQuery({
    queryKey: ["exceptions", { status: "all" }],
    queryFn: () => api.listExceptions({ status: "all" }),
  });
  const runs = useQuery({ queryKey: ["runs"], queryFn: () => api.listRuns() });

  const repeatTracked = useRef(false);
  useEffect(() => {
    const completed = runs.data?.filter((r) => r.status === "completed").length ?? 0;
    if (!repeatTracked.current && completed > 1) {
      repeatTracked.current = true;
      getAnalytics().track("repeat_usage", {
        accountId: session.data?.accountId ?? null,
        workflow: "reconciliation",
        runIndex: completed,
        isSampleAccount: session.data?.isSampleAccount ?? null,
      });
    }
  }, [runs.data, session.data]);

  const open = (exceptions.data ?? []).filter(
    (e) => e.status === "open" || e.status === "needs_review",
  );

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="What the latest reconciliation found, and what is still unresolved."
        actions={
          <Button asChild size="sm">
            <Link to="/reconcile">Run reconciliation</Link>
          </Button>
        }
      />

      {summary.isPending ? (
        <LoadingRows rows={2} label="Loading summary" />
      ) : summary.isError ? (
        <ErrorState error={summary.error} onRetry={() => summary.refetch()} />
      ) : summary.data ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric
            label="Unresolved recoverable"
            value={money(summary.data.recoverableTotal, summary.data.currency)}
            hint={`${summary.data.openCount} open · ${summary.data.needsReviewCount} needs review`}
          />
          <Metric
            label="Marked recovered"
            value={money(summary.data.recoveredTotal, summary.data.currency)}
            hint={`${summary.data.recoveredCount} exceptions`}
          />
          <Metric
            label="Jobs analyzed"
            value={summary.data.jobsAnalyzed.toLocaleString("en-US")}
            hint={summary.data.periodLabel}
          />
          <Metric
            label="Last run"
            value={summary.data.lastRunAt ? dateTime(summary.data.lastRunAt) : "—"}
            hint={`${summary.data.dismissedCount} dismissed to date`}
          />
        </div>
      ) : null}

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Unresolved exceptions by value</h2>
          <Link
            to="/history"
            className="text-sm text-primary underline-offset-2 hover:underline"
          >
            All runs
          </Link>
        </div>

        {exceptions.isPending ? (
          <LoadingRows label="Loading exceptions" />
        ) : exceptions.isError ? (
          <ErrorState error={exceptions.error} onRetry={() => exceptions.refetch()} />
        ) : open.length === 0 ? (
          <EmptyState
            title="Nothing unresolved"
            description="Every exception from the latest run has been recovered or dismissed. Run a new reconciliation when your next period closes."
            action={
              <Button asChild size="sm" variant="outline">
                <Link to="/reconcile">Run reconciliation</Link>
              </Button>
            }
          />
        ) : (
          <ExceptionTable
            exceptions={open}
            caption="Unresolved RouteLeak exceptions ordered by recoverable value"
          />
        )}
      </section>
    </>
  );
}
