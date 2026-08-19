import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { IntegrationStateBadge } from "@/components/status-badge";
import { EmptyState, ErrorState, LoadingRows } from "@/components/states";
import { Button } from "@/components/ui/button";
import { getProductApi } from "@/lib/product-api";

export const Route = createFileRoute("/integrations")({
  head: () => ({
    meta: [
      { title: "RouteLeak integrations — Live, Pilot and Planned status" },
      {
        name: "description",
        content:
          "CSV upload is live today. Direct accounting and field-service connectors are labeled Planned until they are working and tested.",
      },
      { property: "og:title", content: "RouteLeak integrations and honest status" },
      {
        property: "og:description",
        content:
          "Every RouteLeak data source is labeled Live, Pilot or Planned. No integration is claimed before it works.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: IntegrationsPage,
});

const CATEGORY_LABEL = {
  file: "File exports",
  accounting: "Accounting",
  field_service: "Field service management",
} as const;

function IntegrationsPage() {
  const api = getProductApi();
  const query = useQuery({
    queryKey: ["integrations"],
    queryFn: () => api.listIntegrations(),
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-4xl px-4 py-12">
        <p className="label-caps">Data sources</p>
        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
          What RouteLeak can read today
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          Integration status comes from the RouteLeak backend configuration, not from
          marketing copy. <strong className="font-semibold">Live</strong> means it works
          in production. <strong className="font-semibold">Pilot</strong> means it works
          for named accounts under supervision.{" "}
          <strong className="font-semibold">Planned</strong> means it does not exist yet.
        </p>

        <div className="mt-8">
          {query.isPending ? (
            <LoadingRows rows={3} label="Loading integrations" />
          ) : query.isError ? (
            <ErrorState error={query.error} onRetry={() => query.refetch()} />
          ) : query.data && query.data.length > 0 ? (
            <ul className="panel divide-y divide-border">
              {query.data.map((integration) => (
                <li key={integration.id} className="flex flex-wrap gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-sm font-semibold">{integration.name}</h2>
                      <IntegrationStateBadge state={integration.state} />
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {integration.description}
                    </p>
                  </div>
                  <span className="label-caps self-start">
                    {CATEGORY_LABEL[integration.category]}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title="No sources configured"
              description="The backend has not published any data sources for this deployment yet."
            />
          )}
        </div>

        <div className="panel mt-8 p-5">
          <h2 className="text-sm font-semibold">Need a connector we don't have?</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Most pilots start with exports from the systems you already use, which avoids
            any change to dispatch. Tell us what you run and we'll say plainly whether a
            direct connector is realistic.
          </p>
          <div className="mt-4">
            <Button asChild size="sm">
              <Link to="/request-access">Request a pilot analysis</Link>
            </Button>
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
