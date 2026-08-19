import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { AppShell } from "@/components/app-shell";
import { ErrorState, LoadingBlock } from "@/components/states";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/use-session";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const session = useSession();
  const navigate = useNavigate();
  const user = session.data;

  useEffect(() => {
    if (!session.isPending && !session.isError && !user) {
      void navigate({ to: "/sign-in" });
    }
  }, [session.isPending, session.isError, user, navigate]);

  if (session.isPending) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <LoadingBlock label="Checking your session" />
      </div>
    );
  }

  if (session.isError) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <ErrorState
          error={session.error}
          title="We couldn't confirm your session"
          onRetry={() => session.refetch()}
        />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="panel p-6">
          <h1 className="text-sm font-semibold">Sign in required</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            This area needs an authenticated RouteLeak session.
          </p>
          <Button asChild className="mt-4" size="sm">
            <Link to="/sign-in">Go to sign in</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <AppShell user={user}>
      <Outlet />
    </AppShell>
  );
}
