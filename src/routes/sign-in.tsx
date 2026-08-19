import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { ErrorState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSession, useSignIn } from "@/hooks/use-session";
import { getProductApi } from "@/lib/product-api";

export const Route = createFileRoute("/sign-in")({
  head: () => ({
    meta: [
      { title: "Sign in to RouteLeak" },
      {
        name: "description",
        content:
          "Sign in to your RouteLeak workspace to run reconciliation and work the exception queue.",
      },
      { property: "og:title", content: "Sign in to RouteLeak" },
      {
        property: "og:description",
        content: "Access your RouteLeak reconciliation workspace.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SignInPage,
});

function SignInPage() {
  const api = getProductApi();
  const navigate = useNavigate();
  const session = useSession();
  const signIn = useSignIn();
  const [email, setEmail] = useState(api.isDemo ? "controller@sample-fieldco.example" : "");
  const [password, setPassword] = useState(api.isDemo ? "demo" : "");

  useEffect(() => {
    if (session.data) void navigate({ to: "/dashboard" });
  }, [session.data, navigate]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    try {
      await signIn.mutateAsync({ email, password });
      void navigate({ to: "/dashboard" });
    } catch {
      /* surfaced below */
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-md px-4 py-14">
        <h1 className="text-xl font-semibold">Sign in</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Access your RouteLeak workspace. Authentication is handled by the RouteLeak
          backend.
        </p>

        {api.isDemo ? (
          <p className="mt-4 rounded-md border border-warning/40 bg-warning/12 p-3 text-xs">
            Demo mode: the sample account is pre-filled. Password is{" "}
            <span className="num font-semibold">demo</span>. All figures are illustrative.
          </p>
        ) : null}

        <form onSubmit={handleSubmit} className="panel mt-5 space-y-4 p-5" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="email">Work email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {signIn.isError ? <ErrorState error={signIn.error} title="Sign in failed" /> : null}

          <Button type="submit" className="w-full" disabled={signIn.isPending}>
            {signIn.isPending ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <p className="mt-4 text-sm text-muted-foreground">
          No workspace yet?{" "}
          <Link to="/request-access" className="text-primary underline-offset-2 hover:underline">
            Request a pilot analysis
          </Link>
          .
        </p>
      </div>
      <SiteFooter />
    </div>
  );
}
