import { createFileRoute, Link } from "@tanstack/react-router";

import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { title: "RouteLeak help — exports, runs and exception states" },
      {
        name: "description",
        content:
          "Practical help for RouteLeak operators: preparing exports, reading a reconciliation run, exception states, evidence, and what to do when a run fails.",
      },
      { property: "og:title", content: "RouteLeak help" },
      {
        property: "og:description",
        content:
          "Prepare exports, read a run, work the exception queue, and recover from a failed run.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HelpPage,
});

const TOPICS = [
  {
    title: "Preparing your exports",
    body: "Export completed work orders for the period, including customer, site, technician, completion timestamp, labour hours and parts. Export invoices for the same period with the work order reference where your system carries it. Payments are optional. Keep the original column headers — normalization happens server-side.",
  },
  {
    title: "Reading a run",
    body: "A run records what was ingested, how many completed jobs were analyzed, and how many exceptions were produced. A failed run tells you which stage stopped and why; nothing partial is presented as a result.",
  },
  {
    title: "Exception states",
    body: "Open means nobody has decided yet. Needs review parks an item for someone with more context. Recovered means the value was billed or collected. Dismissed means no recovery is due — always leave a note so the audit trail explains it.",
  },
  {
    title: "Evidence",
    body: "Each exception shows the field record, the billing comparison, the match log and the lineage from source export to finding. That's what you send a customer who questions a late invoice.",
  },
  {
    title: "When a run fails",
    body: "Most failures are a missing column in an export, usually a customer or work order identifier. The Operations screen lists failures with the stage and message, and account owners can retry after re-exporting.",
  },
  {
    title: "Getting a person",
    body: "Pilot accounts have a named operational contact. Reply to your onboarding thread with the run label and the exception reference and we will look at the same evidence you're seeing.",
  },
];

function HelpPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-3xl px-4 py-12">
        <p className="label-caps">Help</p>
        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Working with RouteLeak</h1>
        <dl className="mt-6 divide-y divide-border border-y border-border">
          {TOPICS.map((topic) => (
            <div key={topic.title} className="py-5">
              <dt className="text-sm font-semibold">{topic.title}</dt>
              <dd className="mt-1 text-sm text-muted-foreground">{topic.body}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link to="/faq">FAQ</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/security">Security &amp; trust</Link>
          </Button>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
