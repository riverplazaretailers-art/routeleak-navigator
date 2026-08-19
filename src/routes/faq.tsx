import { createFileRoute, Link } from "@tanstack/react-router";

import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "RouteLeak FAQ — data, accuracy and getting started" },
      {
        name: "description",
        content:
          "Common questions about RouteLeak: what data is needed, how findings are evidenced, what happens to disputed items, and how a pilot analysis runs.",
      },
      { property: "og:title", content: "RouteLeak FAQ" },
      {
        property: "og:description",
        content:
          "What data RouteLeak needs, how each finding is evidenced, and how a pilot analysis runs.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FaqPage,
});

const FAQS = [
  {
    q: "What data do you need to start?",
    a: "A completed-work export from your field service or dispatch system, and an invoice export from your accounting system, covering the same period. A payments export is optional but lets us also find invoiced work that was never collected.",
  },
  {
    q: "Do we have to change how dispatch or billing works?",
    a: "No. RouteLeak reads what your systems already produce. Nothing is written back into your dispatch or accounting system.",
  },
  {
    q: "How accurate are the findings?",
    a: "Each finding carries a confidence score and the evidence behind it, including the match attempts that failed. Your controller decides; RouteLeak never invoices anything on your behalf.",
  },
  {
    q: "What if an exception is wrong?",
    a: "Dismiss it with a note, or mark it needs review to park it for someone else. The decision and the reason are recorded in the audit trail.",
  },
  {
    q: "Can you connect directly to our accounting or FSM system?",
    a: "CSV upload is live today. Direct connectors are labeled Planned on the integrations page and we will not describe one as available until it is working and tested for your systems.",
  },
  {
    q: "How long does a pilot analysis take?",
    a: "Most of the elapsed time is getting exports out of your systems. Once sources are in, a reconciliation run over a normal month completes in minutes.",
  },
  {
    q: "What does it cost?",
    a: "Pilot analyses are fixed-scope and quoted per account against technician count and data volume. We don't publish a list price that would be wrong for most operations.",
  },
  {
    q: "Is the sample account real customer data?",
    a: "No. The sample account is fabricated to illustrate the workflow and is labeled as demo data everywhere it appears. It is not proof of recovery for any customer.",
  },
];

function FaqPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-3xl px-4 py-12">
        <p className="label-caps">Questions</p>
        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
          Straight answers before you send us data
        </h1>

        <Accordion type="single" collapsible className="mt-6 border-t border-border">
          {FAQS.map((item, i) => (
            <AccordionItem key={item.q} value={`item-${i}`}>
              <AccordionTrigger className="text-left text-sm font-semibold">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/request-access">Request a pilot analysis</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/help">Help &amp; support</Link>
          </Button>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
