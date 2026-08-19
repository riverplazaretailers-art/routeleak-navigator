import { createFileRoute, Link } from "@tanstack/react-router";

import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/security")({
  head: () => ({
    meta: [
      { title: "RouteLeak security and trust — data handling" },
      {
        name: "description",
        content:
          "How RouteLeak handles your field activity and billing exports: scoped access, retained evidence lineage, audit trails, and no customer data in analytics.",
      },
      { property: "og:title", content: "RouteLeak security and trust" },
      {
        property: "og:description",
        content:
          "Scoped access, audit trails, retained evidence lineage, and analytics that never receive document contents or financial line items.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SecurityPage,
});

const SECTIONS = [
  {
    title: "What we ask for",
    body: "Completed field activity, invoice records and (optionally) payment records for the period under analysis. We do not need your bank credentials, customer payment instruments or employee records.",
  },
  {
    title: "Where analysis happens",
    body: "Normalization, matching and evidence storage run in the RouteLeak backend. This application is a client of that backend; it holds no separate copy of your data and applies no billing rules of its own.",
  },
  {
    title: "Access control",
    body: "Every request is authorized server-side against your account and role. Actions that change exception state require an explicit permission, and the interface tells you plainly when your role is not allowed to act.",
  },
  {
    title: "Audit trail",
    body: "Each exception records who changed its state, when, and any note they left. Evidence lineage from source export through match attempt to finding is retained with the run.",
  },
  {
    title: "Analytics boundaries",
    body: "Product analytics record workflow events and counts only — never document contents, invoice or payment line items, customer names, or personal data. The event sanitizer drops anything outside an explicit allow-list.",
  },
  {
    title: "Secrets",
    body: "No credentials or endpoints are embedded in this application's source. The backend endpoint is supplied by environment configuration, and the browser session is held in an HttpOnly cookie issued by the backend.",
  },
  {
    title: "Retention and exit",
    body: "Source exports and derived evidence are retained for the agreed analysis window and removed on request. Exports are yours: results leave in a format your billing team and accountant can read.",
  },
];

function SecurityPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-3xl px-4 py-12">
        <p className="label-caps">Security &amp; trust</p>
        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
          You're handing us billing data. Here's how it's treated.
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          This page describes current, implemented behaviour. Where a control is planned
          rather than in place, we say so instead of implying a certification we don't
          hold.
        </p>

        <dl className="mt-8 divide-y divide-border border-y border-border">
          {SECTIONS.map((section) => (
            <div key={section.title} className="py-5">
              <dt className="text-sm font-semibold">{section.title}</dt>
              <dd className="mt-1 text-sm text-muted-foreground">{section.body}</dd>
            </div>
          ))}
        </dl>

        <p className="mt-6 text-xs text-muted-foreground">
          RouteLeak does not currently claim SOC 2 or ISO 27001 certification. If a formal
          attestation is required for your procurement process, ask and we'll tell you
          exactly where we stand.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/request-access">Request a pilot analysis</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/faq">Read the FAQ</Link>
          </Button>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
