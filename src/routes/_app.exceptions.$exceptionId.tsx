import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { PageHeader } from "@/components/app-shell";
import { ErrorState, LoadingBlock, SuccessNote } from "@/components/states";
import { ExceptionStatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CATEGORY_LABEL, STATUS_LABEL, dateTime, money } from "@/lib/format";
import { getProductApi, type ExceptionStatus } from "@/lib/product-api";

export const Route = createFileRoute("/_app/exceptions/$exceptionId")({
  head: () => ({
    meta: [
      { title: "Exception detail — RouteLeak" },
      {
        name: "description",
        content:
          "Evidence, lineage and audit trail behind a single RouteLeak exception, with the operator decision.",
      },
      { property: "og:title", content: "RouteLeak exception detail" },
      {
        property: "og:description",
        content: "The evidence behind one finding, and the decision recorded against it.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ExceptionDetailPage,
});

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="label-caps">{label}</dt>
      <dd className="mt-0.5 text-sm">{value}</dd>
    </div>
  );
}

function ExceptionDetailPage() {
  const { exceptionId } = Route.useParams();
  const api = getProductApi();
  const queryClient = useQueryClient();
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState<ExceptionStatus | null>(null);

  const detail = useQuery({
    queryKey: ["exception", exceptionId],
    queryFn: () => api.getException(exceptionId),
  });

  const update = useMutation({
    mutationFn: (status: ExceptionStatus) =>
      api.updateExceptionStatus({ exceptionId, status, note: note || undefined }),
    onSuccess: (updated) => {
      setSaved(updated.status);
      setNote("");
      queryClient.setQueryData(["exception", exceptionId], updated);
      void queryClient.invalidateQueries({ queryKey: ["exceptions"] });
      void queryClient.invalidateQueries({ queryKey: ["summary"] });
    },
  });

  if (detail.isPending) {
    return (
      <>
        <PageHeader title="Exception" />
        <LoadingBlock label="Loading exception" />
      </>
    );
  }

  if (detail.isError) {
    return (
      <>
        <PageHeader title="Exception" />
        <ErrorState error={detail.error} onRetry={() => detail.refetch()} />
      </>
    );
  }

  const exception = detail.data;

  return (
    <>
      <PageHeader
        title={`${exception.workOrderRef} · ${exception.customerName}`}
        description={exception.reason}
        actions={
          <Button asChild size="sm" variant="outline">
            <Link to="/dashboard">Back to queue</Link>
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-6">
          <div className="panel p-5">
            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Field label="Finding" value={CATEGORY_LABEL[exception.category]} />
              <Field
                label="Recoverable"
                value={money(exception.recoverableAmount, exception.currency)}
              />
              <Field label="Confidence" value={`${exception.confidence} / 100`} />
              <Field label="Technician" value={exception.technician} />
              <Field label="Completed" value={dateTime(exception.completedAt)} />
              <div>
                <dt className="label-caps">Status</dt>
                <dd className="mt-1">
                  <ExceptionStatusBadge status={exception.status} />
                </dd>
              </div>
            </dl>
          </div>

          <section className="panel p-5">
            <h2 className="text-sm font-semibold">Evidence</h2>
            <ul className="mt-3 divide-y divide-border border-y border-border">
              {exception.evidence.map((item) => (
                <li key={item.id} className="py-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="num text-xs text-muted-foreground">
                      {item.source} · {dateTime(item.capturedAt)}
                    </p>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{item.summary}</p>
                  <p className="num mt-1 text-xs text-muted-foreground">{item.reference}</p>
                </li>
              ))}
            </ul>
          </section>

          <section className="panel p-5">
            <h2 className="text-sm font-semibold">Lineage</h2>
            <ol className="mt-3 space-y-3">
              {exception.lineage.map((step) => (
                <li key={`${step.step}-${step.at}`} className="border-l-2 border-border pl-3">
                  <p className="text-sm font-medium">{step.step}</p>
                  <p className="text-sm text-muted-foreground">{step.detail}</p>
                  <p className="num text-xs text-muted-foreground">{dateTime(step.at)}</p>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <div className="space-y-6">
          <section className="panel p-5">
            <h2 className="text-sm font-semibold">Decision</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              The backend records who decided what, and when.
            </p>

            <div className="mt-3 space-y-1.5">
              <Label htmlFor="note">Note (recorded in the audit trail)</Label>
              <Textarea
                id="note"
                rows={3}
                value={note}
                onChange={(event) => setNote(event.target.value)}
              />
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {exception.allowedStatuses.map((status) => (
                <Button
                  key={status}
                  size="sm"
                  variant={status === "recovered" ? "default" : "outline"}
                  disabled={update.isPending}
                  onClick={() => update.mutate(status)}
                >
                  Mark {STATUS_LABEL[status].toLowerCase()}
                </Button>
              ))}
            </div>

            {exception.allowedStatuses.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">
                Your role can view this exception but not change its state.
              </p>
            ) : null}

            {update.isError ? (
              <div className="mt-3">
                <ErrorState error={update.error} title="Status not saved" />
              </div>
            ) : null}

            {saved ? (
              <div className="mt-3">
                <SuccessNote>Saved as {STATUS_LABEL[saved].toLowerCase()}.</SuccessNote>
              </div>
            ) : null}
          </section>

          <section className="panel p-5">
            <h2 className="text-sm font-semibold">Audit trail</h2>
            <ul className="mt-3 space-y-3">
              {exception.audit.map((event, index) => (
                <li key={`${event.at}-${index}`} className="text-sm">
                  <p className="font-medium">{event.action}</p>
                  <p className="text-muted-foreground">
                    {event.actor} · {dateTime(event.at)}
                  </p>
                  {event.note ? (
                    <p className="mt-0.5 text-muted-foreground">{event.note}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </>
  );
}
