import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { PageHeader } from "@/components/app-shell";
import { ErrorState, LoadingBlock, PermissionDenied, SuccessNote } from "@/components/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { can, useSession } from "@/hooks/use-session";
import { getAnalytics } from "@/lib/analytics";
import { createBilling, createManualBillingProvider, formatMinorUnits } from "@/lib/billing";
import { shortDate } from "@/lib/format";
import { getProductApi } from "@/lib/product-api";

export const Route = createFileRoute("/_app/billing")({
  head: () => ({
    meta: [
      { title: "Account & billing — RouteLeak" },
      {
        name: "description",
        content:
          "Your RouteLeak plan, subscription state, payment state and usage against included volume.",
      },
      { property: "og:title", content: "RouteLeak account & billing" },
      {
        property: "og:description",
        content: "Plan, subscription state and usage for your RouteLeak account.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BillingPage,
});

function BillingPage() {
  const api = getProductApi();
  const billing = createBilling(api, createManualBillingProvider());
  const queryClient = useQueryClient();
  const session = useSession();
  const manages = can(session.data, "billing:manage");
  const [note, setNote] = useState<string | null>(null);

  const state = useQuery({ queryKey: ["billing"], queryFn: () => billing.getState() });
  const plans = useQuery({ queryKey: ["plans"], queryFn: () => billing.listPlans() });

  const checkout = useMutation({
    mutationFn: async (planId: string) => {
      const accountId = session.data?.accountId ?? "";
      const result = await billing.startCheckout({
        planId,
        accountId,
        returnPath: "/billing",
      });
      return { planId, ...result };
    },
    onSuccess: ({ planId, redirectUrl }) => {
      getAnalytics().track("converted_to_paid", {
        accountId: session.data?.accountId ?? null,
        planId,
        workflow: "billing",
        outcome: redirectUrl ? "redirect" : "sales_assisted",
      });
      setNote(
        redirectUrl
          ? "Redirecting to the payment provider."
          : "Request sent. Your TwoRiverOps contact will confirm scope and terms.",
      );
      if (redirectUrl) window.location.assign(redirectUrl);
      void queryClient.invalidateQueries({ queryKey: ["billing"] });
    },
  });

  const cancel = useMutation({
    mutationFn: () =>
      billing.cancelSubscription({ accountId: session.data?.accountId ?? "" }),
    onSuccess: () => {
      getAnalytics().track("subscription_cancelled", {
        accountId: session.data?.accountId ?? null,
        planId: state.data?.planId ?? null,
        subscriptionState: state.data?.subscriptionState ?? null,
        workflow: "billing",
      });
      setNote("Cancellation recorded. Access continues until the end of the term.");
      void queryClient.invalidateQueries({ queryKey: ["billing"] });
    },
  });

  return (
    <>
      <PageHeader
        title="Account & billing"
        description="Commercial state is held by the RouteLeak backend and is provider-neutral — no payment vendor is embedded in the workflow."
      />

      {state.isPending ? (
        <LoadingBlock label="Loading billing state" />
      ) : state.isError ? (
        <ErrorState error={state.error} onRetry={() => state.refetch()} />
      ) : state.data ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="panel p-5">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-semibold">
                {state.data.planName ?? "No plan contracted"}
              </h2>
              <Badge variant="outline">{state.data.subscriptionState}</Badge>
              <Badge variant="outline">payment: {state.data.paymentState}</Badge>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div>
                <dt className="label-caps">Recurring</dt>
                <dd className="num mt-0.5 text-sm">
                  {state.data.mrr === null
                    ? "Not contracted"
                    : `${formatMinorUnits(state.data.mrr, state.data.currency)} / mo`}
                </dd>
              </div>
              <div>
                <dt className="label-caps">Renews</dt>
                <dd className="num mt-0.5 text-sm">
                  {state.data.renewsAt ? shortDate(state.data.renewsAt) : "—"}
                </dd>
              </div>
              <div>
                <dt className="label-caps">Trial ends</dt>
                <dd className="num mt-0.5 text-sm">
                  {state.data.trialEndsAt ? shortDate(state.data.trialEndsAt) : "—"}
                </dd>
              </div>
            </dl>

            <h3 className="mt-6 text-sm font-semibold">Usage this period</h3>
            <ul className="mt-2 divide-y divide-border border-y border-border">
              {state.data.usage.map((row) => (
                <li key={row.label} className="flex justify-between py-2 text-sm">
                  <span className="text-muted-foreground">{row.label}</span>
                  <span className="num font-medium">
                    {row.used.toLocaleString("en-US")}
                    {row.included === null
                      ? ""
                      : ` / ${row.included.toLocaleString("en-US")}`}
                  </span>
                </li>
              ))}
            </ul>

            {note ? (
              <div className="mt-4">
                <SuccessNote>{note}</SuccessNote>
              </div>
            ) : null}

            {manages ? (
              state.data.subscriptionState === "active" ||
              state.data.subscriptionState === "pilot" ? (
                <Button
                  className="mt-4"
                  size="sm"
                  variant="outline"
                  disabled={cancel.isPending}
                  onClick={() => cancel.mutate()}
                >
                  {cancel.isPending ? "Working…" : "Cancel subscription"}
                </Button>
              ) : null
            ) : (
              <div className="mt-4">
                <PermissionDenied message="Only account owners can change the commercial plan." />
              </div>
            )}
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-semibold">Plans</h2>
            {plans.isPending ? (
              <LoadingBlock label="Loading plans" />
            ) : plans.isError ? (
              <ErrorState error={plans.error} onRetry={() => plans.refetch()} />
            ) : (
              (plans.data ?? []).map((plan) => (
                <div key={plan.id} className="panel p-4">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="text-sm font-semibold">{plan.name}</h3>
                    <span className="num text-sm">{plan.priceCopy ?? "Quoted"}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{plan.cadenceCopy}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{plan.summary}</p>
                  <Button
                    className="mt-3"
                    size="sm"
                    variant={plan.id === state.data?.planId ? "outline" : "default"}
                    disabled={!manages || checkout.isPending || plan.id === state.data?.planId}
                    onClick={() => checkout.mutate(plan.id)}
                  >
                    {plan.id === state.data?.planId ? "Current plan" : plan.ctaLabel}
                  </Button>
                </div>
              ))
            )}
            {checkout.isError ? (
              <ErrorState error={checkout.error} title="Request not sent" />
            ) : null}
            {cancel.isError ? (
              <ErrorState error={cancel.error} title="Cancellation failed" />
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
