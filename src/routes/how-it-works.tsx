import { createFileRoute, Link } from "@tanstack/react-router";

import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How RouteLeak works — reconciliation workflow" },
      {
        name: "description",
        content:
          "Connect or upload field activity and billing exports, run reconciliation, review ranked exceptions with evidence, then mark each one recovered, dismissed or needs review.",
      },
      { property: "og:title", content: "How RouteLeak works" },
      {
        property: "og:description",
        content:
          "The RouteLeak reconciliation workflow, from source exports to a defensible, exportable exception queue.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HowItWorks,
});

const STAGES = [
  {
    n: "01",
    title: "Connect or upload sources",
    body: "Field activity for completed work, plus invoices and (optionally) payments. CSV upload is live; the backend normalizes column names, dates and identifiers.",
    detail: "Owner: RouteLeak backend normalization.",
  },
  {
    n: "02",
    title: "Run reconciliation",
    body: "Completed work is matched against billing records by reference, then by customer, site and date within tolerance. Match attempts are recorded, including the ones that fail.",
    detail: "Owner: RouteLeak matching engine.",
  },
  {
    n: "03",
    title: "Review ranked exceptions",
    body: "Findings are ordered by recoverable value with a confidence score and a category: never invoiced, underbilled, invoiced but not collected, or duplicate visit.",
    detail: "Owner: your controller.",
  },
  {
    n: "04",
    title: "Inspect evidence",
    body: "Each exception opens with the field record, billing comparison, match log and lineage from source export to finding — enough to raise the invoice or defend it.",
    detail: "Evidence lineage retained by the backend.",
  },
  {
    n: "05",
    title: "Decide and record",
    body: "Mark recovered, dismissed or needs review, with an optional note. Every change is written to the audit trail with the operator and timestamp.",
    detail: "Owner: your team; state rules enforced server-side.",
  },
  {
    n: "06",
    title: "Export and share",
    body: "Export the run for your billing team or an outside accountant. Figures come from the run, not a spreadsheet someone rebuilt.",
    detail: "Owner: RouteLeak export service.",
  },
];

function HowItWorks() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-4xl px-4 py-12">
        <p className="label-caps">Workflow</p>
        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
          From raw exports to a defensible recovery list
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          RouteLeak does not replace your dispatch or accounting system. It reads what they already
          produce, finds the work that fell between them, and gives your controller a queue they can
          defend.
        </p>

        <ol className="mt-8 divide-y divide-border border-y border-border">
          {STAGES.map((stage) => (
            <li key={stage.n} className="grid gap-2 py-5 sm:grid-cols-[3rem_1fr]">
              <span className="num text-sm font-semibold text-primary">{stage.n}</span>
              <div>
                <h2 className="text-sm font-semibold">{stage.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{stage.body}</p>
                <p className="mt-2 text-xs text-muted-foreground">{stage.detail}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/request-access">Request a pilot analysis</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/sign-in">Open the sample account</Link>
          </Button>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
