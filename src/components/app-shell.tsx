import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, Menu } from "lucide-react";
import { useState, type ReactNode } from "react";

import { AdapterTag, DemoNotice } from "@/components/demo-notice";
import { Button } from "@/components/ui/button";
import { useSignOut } from "@/hooks/use-session";
import type { SessionUser } from "@/lib/product-api";

const NAV = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/reconcile", label: "Run reconciliation" },
  { to: "/history", label: "History" },
  { to: "/billing", label: "Account & billing" },
  { to: "/settings", label: "Settings" },
  { to: "/help", label: "Help" },
] as const;

export function AppShell({
  user,
  children,
}: {
  user: SessionUser;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const signOut = useSignOut();
  const navigate = useNavigate();
  const showAdmin = user.role === "owner" || user.role === "controller";

  const nav = showAdmin ? [...NAV, { to: "/admin", label: "Operations" } as const] : NAV;

  async function handleSignOut() {
    await signOut.mutateAsync();
    void navigate({ to: "/sign-in" });
  }

  return (
    <div className="min-h-screen bg-background">
      <DemoNotice />
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4">
          <Link to="/dashboard" className="text-sm font-bold tracking-tight">
            RouteLeak
          </Link>
          <span className="hidden truncate text-xs text-muted-foreground sm:inline">
            {user.accountName}
          </span>
          <div className="ml-auto hidden items-center gap-3 md:flex">
            <AdapterTag />
            <span className="text-xs text-muted-foreground">
              {user.name} · {user.role.replace("_", " ")}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              disabled={signOut.isPending}
            >
              <LogOut className="size-3.5" aria-hidden />
              {signOut.isPending ? "Signing out…" : "Log out"}
            </Button>
          </div>
          <Button
            variant="outline"
            size="icon"
            className="ml-auto md:hidden"
            aria-expanded={open}
            aria-label="Toggle menu"
            onClick={() => setOpen((v) => !v)}
          >
            <Menu className="size-4" aria-hidden />
          </Button>
        </div>

        <nav aria-label="Workspace" className="hidden border-t border-border md:block">
          <ul className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-2">
            {nav.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className="inline-block border-b-2 border-transparent px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
                  activeProps={{
                    className: "border-primary text-foreground font-medium",
                  }}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {open ? (
          <nav aria-label="Workspace (mobile)" className="border-t border-border md:hidden">
            <ul className="px-4 py-2">
              {nav.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className="block py-2 text-sm"
                    activeProps={{ className: "font-semibold text-primary" }}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              <li className="border-t border-border pt-2">
                <button
                  onClick={handleSignOut}
                  className="py-2 text-sm text-destructive"
                  type="button"
                >
                  Log out
                </button>
              </li>
            </ul>
          </nav>
        ) : null}
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
        {description ? (
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
