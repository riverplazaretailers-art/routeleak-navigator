import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

import { ModeNotice, SignInCta, StartCta } from "@/components/launch-cta";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { getLaunchConfig } from "@/lib/launch-config";
import { ErrorState, SuccessNote } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getAnalytics } from "@/lib/analytics";
import { getProductApi, type AccessRequest } from "@/lib/product-api";

export const Route = createFileRoute("/request-access")({
  validateSearch: (search: Record<string, unknown>): { plan?: string } =>
    typeof search["plan"] === "string" ? { plan: search["plan"] } : {},
  head: () => ({
    meta: [
      { title: "Request a RouteLeak pilot analysis" },
      {
        name: "description",
        content:
          "Tell us what you run and we will scope a fixed pilot analysis on a period you already closed, so you can see what was missed before committing.",
      },
      { property: "og:title", content: "Request a RouteLeak pilot analysis" },
      {
        property: "og:description",
        content:
          "A fixed-scope reconciliation of a recent period, with evidence for every finding.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RequestAccessPage,
});

function RequestAccessPage() {
  const api = getProductApi();
  const { plan } = Route.useSearch();
  const [form, setForm] = useState<AccessRequest>({
    companyName: "",
    contactName: "",
    email: "",
    role: "",
    techniciansCopy: "",
    notes: "",
  });

  const mutation = useMutation({
    mutationFn: (input: AccessRequest) => api.requestAccess(input),
    onSuccess: () => {
      getAnalytics().track("account_created", {
        workflow: "access_request",
        planId: plan ?? null,
        outcome: "requested",
      });
    },
  });

  function set<K extends keyof AccessRequest>(key: K, value: AccessRequest[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-2xl px-4 py-12">
        <p className="label-caps">Start here</p>
        <h1 className="mt-2 text-2xl font-bold">Request a pilot analysis</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          We scope the pilot to a period you have already closed, so the findings are checkable
          against what you actually billed.
          {plan ? ` Requested plan: ${plan}.` : ""}
        </p>

        {!getLaunchConfig().capabilities.backendCatalog ? (
          <div className="mt-6 space-y-4">
            <ModeNotice />
            <div className="flex flex-wrap gap-2">
              <StartCta label="Start a pilot request in the secure workspace" />
              <SignInCta variant="outline" />
            </div>
          </div>
        ) : mutation.isSuccess ? (
          <div className="mt-6 space-y-4">
            <SuccessNote>
              <p className="font-semibold">Request received.</p>
              <p className="mt-1 text-muted-foreground">
                We will reply with the exports we need and a scoped quote. Nothing is charged and no
                data is required until you agree the scope.
              </p>
            </SuccessNote>
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link to="/how-it-works">See the workflow</Link>
              </Button>
              <SignInCta variant="ghost" />
            </div>
          </div>
        ) : (
          <form
            className="panel mt-6 space-y-4 p-5"
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              mutation.mutate(form);
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="companyName">Company</Label>
                <Input
                  id="companyName"
                  required
                  value={form.companyName}
                  onChange={(e) => set("companyName", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="contactName">Your name</Label>
                <Input
                  id="contactName"
                  required
                  value={form.contactName}
                  onChange={(e) => set("contactName", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Work email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="role">Role</Label>
                <Input
                  id="role"
                  placeholder="Owner, controller, service manager"
                  value={form.role}
                  onChange={(e) => set("role", e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="techniciansCopy">Field team size</Label>
              <Input
                id="techniciansCopy"
                placeholder="e.g. 24 technicians across 3 branches"
                value={form.techniciansCopy}
                onChange={(e) => set("techniciansCopy", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes">What systems produce your work orders and invoices?</Label>
              <Textarea
                id="notes"
                rows={4}
                value={form.notes ?? ""}
                onChange={(e) => set("notes", e.target.value)}
              />
            </div>

            {mutation.isError ? (
              <ErrorState error={mutation.error} title="Request not sent" />
            ) : null}

            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Sending…" : "Send request"}
            </Button>
            <p className="text-xs text-muted-foreground">
              We only use these details to scope the pilot. No data exports are needed yet.
            </p>
          </form>
        )}
      </div>
      <SiteFooter />
    </div>
  );
}
