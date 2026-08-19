import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Check } from "lucide-react";

import { ModeNotice, StartCta } from "@/components/launch-cta";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { getLaunchConfig } from "@/lib/launch-config";
import { ErrorState, LoadingRows } from "@/components/states";
import { Button } from "@/components/ui/button";
import { createBilling, createManualBillingProvider } from "@/lib/billing";
import { getProductApi } from "@/lib/product-api";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "RouteLeak pricing — start with a pilot analysis" },
      {
        name: "description",
        content:
          "RouteLeak engagements start with a fixed-scope pilot analysis, quoted per account. Plan copy is configured by the backend; no invented list price.",
      },
      { property: "og:title", content: "RouteLeak pricing" },
      {
        property: "og:description",
        content:
          "Start with a scoped pilot analysis of a recent period, then decide whether recurring reconciliation is worth it.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PricingPage,
});

function PricingPage() {
  const billing = createBilling(getProductApi(), createManualBillingProvider());
  const { capabilities } = getLaunchConfig();
  const query = useQuery({
    queryKey: ["plans"],
    queryFn: () => billing.listPlans(),
    enabled: capabilities.backendCatalog,
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-5xl px-4 py-12">
        <p className="label-caps">Commercial</p>
        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
          Prove the leak exists before you commit to anything
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          Every engagement starts with a pilot analysis on a period you already closed. Pricing is
          quoted per account against technician count and data volume — we don't publish a number
          that would be wrong for your operation.
        </p>

        <div className="mt-8">
          {!capabilities.backendCatalog ? (
            <div className="space-y-4">
              <ModeNotice />
              <div className="panel p-5">
                <h2 className="text-base font-semibold">Pilot analysis</h2>
                <p className="num mt-3 text-lg font-semibold">Quoted per account</p>
                <p className="text-xs text-muted-foreground">Fixed scope, one closed period</p>
                <p className="mt-3 text-sm text-muted-foreground">
                  Plan copy is published by the RouteLeak backend. No binding price is invented
                  here.
                </p>
                <div className="mt-5">
                  <StartCta />
                </div>
              </div>
            </div>
          ) : query.isPending ? (
            <LoadingRows rows={2} label="Loading plans" />
          ) : query.isError ? (
            <ErrorState error={query.error} onRetry={() => query.refetch()} />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {query.data?.map((plan) => (
                <div
                  key={plan.id}
                  className={`panel flex flex-col p-5 ${plan.highlighted ? "border-primary" : ""}`}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <h2 className="text-base font-semibold">{plan.name}</h2>
                    {plan.highlighted ? (
                      <span className="label-caps text-primary">Start here</span>
                    ) : null}
                  </div>
                  <p className="num mt-3 text-lg font-semibold">
                    {plan.priceCopy ?? "Quoted per account"}
                  </p>
                  <p className="text-xs text-muted-foreground">{plan.cadenceCopy}</p>
                  <p className="mt-3 text-sm text-muted-foreground">{plan.summary}</p>
                  <ul className="mt-4 flex-1 space-y-2 text-sm">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex gap-2">
                        <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-5">
                    <StartCta
                      label={plan.ctaLabel}
                      planId={plan.id}
                      variant={plan.highlighted ? "default" : "outline"}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="panel mt-8 p-5">
          <h2 className="text-sm font-semibold">What we will not do</h2>
          <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
            <li>We won't quote a price before we understand your data volume.</li>
            <li>We won't promise a recovery figure. The pilot shows what is actually there.</li>
            <li>We won't require a dispatch or accounting migration.</li>
          </ul>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
