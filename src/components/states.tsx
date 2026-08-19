import { AlertTriangle, CheckCircle2, Inbox, Lock, RefreshCw } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductApiError } from "@/lib/product-api";

export function LoadingRows({ rows = 5, label = "Loading" }: { rows?: number; label?: string }) {
  return (
    <div className="panel divide-y" role="status" aria-live="polite" aria-label={label}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
      <span className="sr-only">{label}</span>
    </div>
  );
}

export function LoadingBlock({ label = "Loading" }: { label?: string }) {
  return (
    <div className="panel p-6" role="status" aria-live="polite">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="mt-3 h-4 w-full" />
      <Skeleton className="mt-2 h-4 w-2/3" />
      <span className="sr-only">{label}</span>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="panel flex flex-col items-start gap-3 p-6">
      <Inbox className="size-5 text-muted-foreground" aria-hidden />
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="mt-1 max-w-prose text-sm text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  );
}

export function PermissionDenied({
  message = "Your role does not have access to this area. Ask an account owner to grant it.",
}: {
  message?: string;
}) {
  return (
    <div className="panel flex flex-col items-start gap-3 border-border-strong p-6">
      <Lock className="size-5 text-muted-foreground" aria-hidden />
      <div>
        <h3 className="text-sm font-semibold">Permission denied</h3>
        <p className="mt-1 max-w-prose text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

export function ErrorState({
  error,
  onRetry,
  title = "This didn't load",
}: {
  error: unknown;
  onRetry?: () => void;
  title?: string;
}) {
  if (error instanceof ProductApiError && error.code === "forbidden") {
    return <PermissionDenied message={error.message} />;
  }

  const message =
    error instanceof Error ? error.message : "An unexpected error occurred.";

  return (
    <div
      role="alert"
      className="panel flex flex-col items-start gap-3 border-destructive/40 p-6"
    >
      <AlertTriangle className="size-5 text-destructive" aria-hidden />
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="mt-1 max-w-prose text-sm text-muted-foreground">{message}</p>
      </div>
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="size-3.5" aria-hidden /> Try again
        </Button>
      ) : null}
    </div>
  );
}

export function SuccessNote({ children }: { children: ReactNode }) {
  return (
    <div
      role="status"
      className="flex items-start gap-2 rounded-md border border-success/40 bg-success/8 p-3 text-sm text-foreground"
    >
      <CheckCircle2 className="mt-0.5 size-4 text-success" aria-hidden />
      <div>{children}</div>
    </div>
  );
}
