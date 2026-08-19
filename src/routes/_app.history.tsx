import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { PageHeader } from "@/components/app-shell";
import { ExceptionTable } from "@/components/exception-table";
import { EmptyState, ErrorState, LoadingRows } from "@/components/states";
import { RunStatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { dateTime, money } from "@/lib/format";
import { getProductApi } from "@/lib/product-api";

export const Route = createFileRoute("/_app/history")({
  head: () => ({
    meta: [
      { title: "Run history — RouteLeak" },
      {
        name: "description",
        content:
          "Every RouteLeak reconciliation run for this account, with sources, jobs analyzed, exceptions produced and export.",
      },
      { property: "og:title", content: "RouteLeak run history" },
      {
        property: "og:description",
        content: "Past reconciliation runs, their sources and their findings.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const api = getProductApi();
  const runs = useQuery({ queryKey: ["runs"], queryFn: () => api.listRuns() });
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [exportNote, setExportNote] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const activeRunId =
    selectedRunId ??
    runs.data?.find((run) => run.status === "completed")?.id ??
    null;

  const exceptions = useQuery({
    queryKey: ["exceptions", { runId: activeRunId }],
    queryFn: () => api.listExceptions({ runId: activeRunId ?? undefined, status: "all" }),
    enabled: Boolean(activeRunId),
  });

  const activeRun = runs.data?.find((run) => run.id === activeRunId) ?? null;

  async function handleExport(runId: string) {
    setExportError(null);
    try {
      const result = await api.exportRun(runId);
      setExportNote(`${result.filename} is ready from the RouteLeak backend.`);
    } catch (error) {
      setExportError(error instanceof Error ? error.message : "Export failed.");
    }
  }

  return (
    <>
      <PageHeader
        title="History"
        description="Runs are immutable records. Select one to review the exceptions it produced."
        actions={
          <Button asChild size="sm" variant="outline">
            <Link to="/reconcile">New run</Link>
          </Button>
        }
      />

      {runs.isPending ? (
        <LoadingRows label="Loading runs" />
      ) : runs.isError ? (
        <ErrorState error={runs.error} onRetry={() => runs.refetch()} />
      ) : (runs.data ?? []).length === 0 ? (
        <EmptyState
          title="No runs yet"
          description="Once you reconcile a period, every run is recorded here with its sources and findings."
          action={
            <Button asChild size="sm">
              <Link to="/reconcile">Run reconciliation</Link>
            </Button>
          }
        />
      ) : (
        <div className="panel overflow-x-auto">
          <table className="w-full min-w-[48rem] border-collapse text-sm">
            <caption className="sr-only">RouteLeak reconciliation run history</caption>
            <thead>
              <tr className="border-b border-border bg-secondary/60 text-left">
                <th scope="col" className="label-caps px-3 py-2 font-semibold">Run</th>
                <th scope="col" className="label-caps px-3 py-2 font-semibold">Started</th>
                <th scope="col" className="label-caps px-3 py-2 font-semibold">Sources</th>
                <th scope="col" className="label-caps px-3 py-2 text-right font-semibold">Jobs</th>
                <th scope="col" className="label-caps px-3 py-2 text-right font-semibold">Exceptions</th>
                <th scope="col" className="label-caps px-3 py-2 text-right font-semibold">Recoverable</th>
                <th scope="col" className="label-caps px-3 py-2 font-semibold">Status</th>
                <th scope="col" className="label-caps px-3 py-2 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(runs.data ?? []).map((run) => (
                <tr
                  key={run.id}
                  className={run.id === activeRunId ? "bg-secondary/50" : undefined}
                >
                  <td className="px-3 py-2 font-medium">{run.label}</td>
                  <td className="num px-3 py-2 text-muted-foreground">
                    {dateTime(run.startedAt)}
                  </td>
                  <td className="max-w-[16rem] truncate px-3 py-2 text-muted-foreground">
                    {run.sourceSummary}
                  </td>
                  <td className="num px-3 py-2 text-right">
                    {run.jobsAnalyzed.toLocaleString("en-US")}
                  </td>
                  <td className="num px-3 py-2 text-right">{run.exceptionCount}</td>
                  <td className="num px-3 py-2 text-right font-semibold">
                    {run.status === "completed"
                      ? money(run.recoverableTotal, run.currency)
                      : "—"}
                  </td>
                  <td className="px-3 py-2">
                    <RunStatusBadge status={run.status} />
                    {run.failureReason ? (
                      <p className="mt-1 max-w-[16rem] text-xs text-muted-foreground">
                        {run.failureReason}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {run.status === "completed" ? (
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedRunId(run.id)}
                        >
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => void handleExport(run.id)}
                        >
                          Export
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {exportNote ? (
        <p role="status" className="mt-3 text-sm text-success">
          {exportNote}
        </p>
      ) : null}
      {exportError ? (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {exportError}
        </p>
      ) : null}

      {activeRun ? (
        <section className="mt-8">
          <h2 className="mb-3 text-sm font-semibold">
            Exceptions in {activeRun.label}
          </h2>
          {exceptions.isPending ? (
            <LoadingRows label="Loading exceptions" />
          ) : exceptions.isError ? (
            <ErrorState error={exceptions.error} onRetry={() => exceptions.refetch()} />
          ) : (exceptions.data ?? []).length === 0 ? (
            <EmptyState
              title="No exceptions in this run"
              description="Every completed job in this period matched an invoice at the expected value."
            />
          ) : (
            <ExceptionTable
              exceptions={exceptions.data ?? []}
              currency={activeRun.currency}
              caption={`Exceptions produced by ${activeRun.label}`}
            />
          )}
        </section>
      ) : null}
    </>
  );
}
