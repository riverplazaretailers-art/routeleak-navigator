import { createFileRoute, Link } from "@tanstack/react-router";
import { FileSpreadsheet, ListChecks, Search } from "lucide-react";

import { SignInCta, ModeNotice, StartCta } from "@/components/launch-cta";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { getLaunchConfig } from "@/lib/launch-config";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title: "RouteLeak — Find field work that was never invoiced",
      },
      {
        name: "description",
        content:
          "RouteLeak reconciles completed field work against invoices and payments, then ranks the jobs you were never paid for, with evidence for each one.",
      },
      {
        property: "og:title",
        content: "RouteLeak — Find field work that was never invoiced",
      },
      {
        property: "og:description",
        content:
          "Reconcile completed work orders against invoices and payments. Review ranked exceptions with evidence, then recover or dismiss each one.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const CONSEQUENCE = [
  {
    stat: "Every missed job",
    body: "is margin you already paid for: technician hours, drive time, parts and truck cost, with no invoice against it.",
  },
  {
    stat: "Weeks later",
    body: "the work order is closed, the customer disputes it, and the recovery conversation gets harder every day it ages.",
  },
  {
    stat: "Nobody owns it",
    body: "dispatch assumes billing caught it, billing assumes dispatch flagged it, and the gap never shows up in a report.",
  },
];

const STEPS = [
  {
    icon: FileSpreadsheet,
    title: "Bring your exports",
    body: "Upload completed field activity plus invoices and payments. RouteLeak normalizes them; you don't reformat anything.",
  },
  {
    icon: Search,
    title: "Run reconciliation",
    body: "The matching engine compares completed work against what was billed and what was collected.",
  },
  {
    icon: ListChecks,
    title: "Work the exceptions",
    body: "A ranked queue by recoverable value, each with the evidence behind it. Mark recovered, dismissed or needs review.",
  },
];

function Landing() {
  const { capabilities } = getLaunchConfig();
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="border-b border-border bg-surface">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 lg:grid-cols-[1.1fr_0.9fr] lg:py-16">
          <div>
            <p className="label-caps">Revenue recovery for field service</p>
            <h1 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl">
              Some of the work your crews finished last month was never invoiced.
            </h1>
            <p className="mt-4 max-w-xl text-base text-muted-foreground">
              RouteLeak reconciles completed field activity against your invoices and
              payments, then hands your controller a ranked list of the jobs that were
              missed, underbilled or never collected — with the evidence attached.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <StartCta />
              <SignInCta />
            </div>
            <div className="mt-4 max-w-xl">
              <ModeNotice />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Built for the owner, controller or service manager who signs off on
              billing. No dispatch change required.
            </p>
          </div>

          {capabilities.liveAnalysis ? null : (
          <div className="panel self-start">
            <div className="flex items-center justify-between border-b border-border px-4 py-2">
              <span className="label-caps">Illustrative exception queue</span>
              <span className="text-[0.6875rem] text-muted-foreground">Sample data</span>
            </div>
            <table className="w-full text-sm">
              <caption className="sr-only">
                Illustrative example of a RouteLeak exception queue
              </caption>
              <thead>
                <tr className="border-b border-border text-left">
                  <th scope="col" className="px-4 py-2 label-caps font-semibold">
                    Work order
                  </th>
                  <th scope="col" className="px-4 py-2 label-caps font-semibold">
                    Finding
                  </th>
                  <th scope="col" className="px-4 py-2 text-right label-caps font-semibold">
                    Recoverable
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  ["WO-48120", "Never invoiced", "$6,120"],
                  ["WO-48244", "Underbilled labour", "$3,884"],
                  ["WO-48301", "Invoiced, not collected", "$2,750"],
                ].map(([ref, finding, amount]) => (
                  <tr key={ref}>
                    <td className="num px-4 py-2">{ref}</td>
                    <td className="px-4 py-2 text-muted-foreground">{finding}</td>
                    <td className="num px-4 py-2 text-right font-semibold">{amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="border-t border-border px-4 py-2 text-xs text-muted-foreground">
              Illustrative figures for demonstration. Not customer results.
            </p>
          </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-xl font-semibold">What the gap costs you</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {CONSEQUENCE.map((item) => (
            <div key={item.stat} className="panel p-4">
              <p className="text-sm font-semibold">{item.stat}</p>
              <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <h2 className="text-xl font-semibold">How RouteLeak works</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {STEPS.map((step) => (
              <div key={step.title} className="border-l-2 border-primary/40 pl-4">
                <step.icon className="size-4 text-primary" aria-hidden />
                <h3 className="mt-2 text-sm font-semibold">{step.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{step.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-6">
            <Button asChild variant="outline" size="sm">
              <Link to="/how-it-works">See the full workflow</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="text-xl font-semibold">Evidence, not assertions</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Every exception carries the field record, the billing comparison and the
              match attempts that produced it. Your controller can defend each item to a
              customer, and every status change is recorded in an audit trail.
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              {[
                "Ranked by recoverable value, so the biggest items surface first",
                "Recovered / dismissed / needs review states owned by your team",
                "Exportable results your billing team can act on",
                "Retained lineage from source export to finding",
              ].map((line) => (
                <li key={line} className="flex gap-2">
                  <span aria-hidden className="mt-2 size-1.5 shrink-0 bg-primary" />
                  <span className="text-muted-foreground">{line}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="panel p-5">
            <p className="label-caps">Honest status</p>
            <p className="mt-2 text-sm text-muted-foreground">
              CSV upload is live today. Direct accounting and field-service connectors are
              planned and labeled as such — we don't claim an integration until it works.
            </p>
            <div className="mt-4 flex gap-2">
              <Button asChild size="sm" variant="outline">
                <Link to="/integrations">Integration status</Link>
              </Button>
              <Button asChild size="sm" variant="ghost">
                <Link to="/security">Security &amp; trust</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
