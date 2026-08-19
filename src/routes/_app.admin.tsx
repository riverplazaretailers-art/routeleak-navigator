import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { PageHeader } from "@/components/app-shell";
import { EmptyState, ErrorState, LoadingRows, PermissionDenied, SuccessNote } from "@/components/states";
import { Button } from "@/components/ui/button";
import { can, useSession } from "@/hooks/use-session";
import { dateTime } from "@/lib/format";
import { getProductApi } from "@/lib/product-api";

export const Route = createFileRoute("/_app/admin")({
  head: () => ({
    meta: [
      { title: "Operations — RouteLeak" },
      {
        name: "description",
        content:
          "Failed reconciliation jobs for this account, the stage that stopped, and retry once the source export is fixed.",
      },
      { property: "og:title", content: "RouteLeak operations" },
      {
        property: "og:description",
        content: "Failed ingestion and reconciliation jobs, with retry.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const api = getProductApi();
  const session = useSession();
  const queryClient = useQueryClient();
  const allowed = can(session.data, "ops:view");
  const [note, setNote] = useState<string | null>(null);

  const failures = useQuery({
    queryKey: ["job-failures"],
    queryFn: () => api.listJobFailures(),
    enabled: allowed,
  });

  const retry = useMutation({
    mutationFn: (failureId: string) => api.retryJob(failureId),
    onSuccess: () => {
      setNote("Retry queued with the RouteLeak backend.");
      void queryClient.invalidateQueries({ queryKey: ["job-failures"] });
      void queryClient.invalidateQueries({ queryKey: ["runs"] });
    },
  });

  if (!allowed) {
    return (
      <>
        <PageHeader title="Operations" />
        <PermissionDenied message="Operations is limited to account owners and controllers." />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Operations"
        description="Jobs that stopped before producing results. Fix the source export, then retry — nothing partial is presented as a finding."
      />

      {note ? <div className="mb-4"><SuccessNote>{note}</SuccessNote></div> : null}

      {failures.isPending ? (
        <LoadingRows rows={3} label="Loading job failures" />
      ) : failures.isError ? (
        <ErrorState error={failures.error} onRetry={() => failures.refetch()} />
      ) : (failures.data ?? []).length === 0 ? (
        <EmptyState
          title="No failed jobs"
          description="Every ingestion and reconciliation job for this account completed."
        />
      ) : (
        <div className="panel overflow-x-auto">
          <table className="w-full min-w-[42rem] border-collapse text-sm">
            <caption className="sr-only">Failed RouteLeak jobs</caption>
            <thead>
              <tr className="border-b border-border bg-secondary/60 text-left">
                <th scope="col" className="label-caps px-3 py-2 font-semibold">Occurred</th>
                <th scope="col" className="label-caps px-3 py-2 font-semibold">Run</th>
                <th scope="col" className="label-caps px-3 py-2 font-semibold">Stage</th>
                <th scope="col" className="label-caps px-3 py-2 font-semibold">Message</th>
                <th scope="col" className="label-caps px-3 py-2 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(failures.data ?? []).map((failure) => (
                <tr key={failure.id}>
                  <td className="num px-3 py-2 text-muted-foreground">
                    {dateTime(failure.occurredAt)}
                  </td>
                  <td className="num px-3 py-2">{failure.runId}</td>
                  <td className="px-3 py-2">{failure.stage}</td>
                  <td className="px-3 py-2 text-muted-foreground">{failure.message}</td>
                  <td className="px-3 py-2 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!failure.retryable || retry.isPending}
                      onClick={() => retry.mutate(failure.id)}
                    >
                      {failure.retryable ? "Retry" : "Not retryable"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {retry.isError ? (
        <div className="mt-4">
          <ErrorState error={retry.error} title="Retry failed" />
        </div>
      ) : null}
    </>
  );
}
