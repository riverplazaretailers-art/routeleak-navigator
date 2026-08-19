import { Link } from "@tanstack/react-router";
import { ExternalLink, ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getLaunchConfig, secureWorkspaceLink } from "@/lib/launch-config";

/**
 * Mode-aware calls to action.
 *
 * In secure-link mode every "start" / "sign in" action points at the
 * configured secure workspace URL and nothing else. In demo and api mode the
 * in-app routes are used. In misconfigured mode the action is disabled rather
 * than pointing at an endpoint that would 404.
 */

type Variant = "default" | "outline" | "ghost";

export function StartCta({
  label = "Request a pilot analysis",
  variant = "default",
  className,
  planId,
}: {
  label?: string;
  variant?: Variant;
  className?: string;
  planId?: string;
}) {
  const { mode } = getLaunchConfig();
  const href = secureWorkspaceLink("/api/pilots");

  if (mode === "secure-link" && href) {
    return (
      <Button asChild variant={variant} className={className}>
        <a href={href} rel="noopener">
          {label} <ExternalLink className="size-4" aria-hidden />
        </a>
      </Button>
    );
  }

  if (mode === "misconfigured") {
    return (
      <Button variant={variant} className={className} disabled>
        {label}
      </Button>
    );
  }

  return (
    <Button asChild variant={variant} className={className}>
      <Link to="/request-access" search={planId ? { plan: planId } : {}}>
        {label}
      </Link>
    </Button>
  );
}

export function SignInCta({
  label,
  variant = "outline",
  className,
}: {
  label?: string;
  variant?: Variant;
  className?: string;
}) {
  const { mode, capabilities } = getLaunchConfig();
  const href = secureWorkspaceLink("/");

  if (mode === "secure-link" && href) {
    return (
      <Button asChild variant={variant} className={className}>
        <a href={href} rel="noopener">
          {label ?? "Open the secure workspace"} <ExternalLink className="size-4" aria-hidden />
        </a>
      </Button>
    );
  }

  if (!capabilities.inAppAuth) {
    return (
      <Button variant={variant} className={className} disabled>
        {label ?? "Sign in"}
      </Button>
    );
  }

  return (
    <Button asChild variant={variant} className={className}>
      <Link to="/sign-in">
        {label ?? (capabilities.demoData ? "Open the sample account" : "Sign in")}
      </Link>
    </Button>
  );
}

/** Shown wherever a live action is unavailable in the current mode. */
export function ModeNotice() {
  const { mode, configError, secureWorkspaceUrl } = getLaunchConfig();

  if (mode === "misconfigured") {
    return (
      <div
        role="alert"
        className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs"
      >
        <ShieldAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        <p>
          <span className="font-semibold">RouteLeak is not configured.</span> {configError}
        </p>
      </div>
    );
  }

  if (mode === "secure-link" && secureWorkspaceUrl) {
    return (
      <div
        role="note"
        className="rounded-md border border-border bg-surface p-3 text-xs text-muted-foreground"
      >
        <span className="font-semibold text-foreground">
          Real analysis runs in the secure RouteLeak workspace.
        </span>{" "}
        This site is the public product UI. Sign-in, uploads and the exception queue are served by
        the preserved backend at{" "}
        <a
          className="text-primary underline-offset-2 hover:underline"
          href={secureWorkspaceUrl}
          rel="noopener"
        >
          {secureWorkspaceUrl}
        </a>
        .
      </div>
    );
  }

  return null;
}
