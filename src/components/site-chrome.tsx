import { Link } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { useState } from "react";

import { DemoNotice } from "@/components/demo-notice";
import { SignInCta, StartCta } from "@/components/launch-cta";
import { getLaunchConfig, secureWorkspaceLink } from "@/lib/launch-config";
import { Button } from "@/components/ui/button";

const NAV = [
  { to: "/how-it-works", label: "How it works" },
  { to: "/integrations", label: "Integrations" },
  { to: "/pricing", label: "Pricing" },
  { to: "/security", label: "Security" },
  { to: "/faq", label: "FAQ" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <DemoNotice compact />
      <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4">
          <Link to="/" className="flex items-baseline gap-2">
            <span className="text-sm font-bold tracking-tight">RouteLeak</span>
            <span className="hidden text-[0.6875rem] text-muted-foreground sm:inline">
              A TwoRiverOps solution
            </span>
          </Link>

          <nav aria-label="Main" className="ml-auto hidden items-center gap-5 md:flex">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                activeProps={{ className: "text-foreground font-medium" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2 md:ml-0">
            <span className="hidden sm:inline-flex">
              <SignInCta variant="ghost" />
            </span>
            <StartCta />
            <Button
              variant="outline"
              size="icon"
              className="md:hidden"
              aria-expanded={open}
              aria-label="Toggle navigation"
              onClick={() => setOpen((v) => !v)}
            >
              <Menu className="size-4" aria-hidden />
            </Button>
          </div>
        </div>

        {open ? (
          <nav aria-label="Main (mobile)" className="border-t border-border md:hidden">
            <ul className="mx-auto max-w-6xl px-4 py-2">
              {[
                ...NAV,
                ...(getLaunchConfig().capabilities.inAppAuth
                  ? ([{ to: "/sign-in", label: "Sign in" }] as const)
                  : []),
              ].map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className="block py-2 text-sm text-foreground"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
      </header>
    </>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border bg-surface">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3">
        <div>
          <p className="text-sm font-semibold">RouteLeak</p>
          <p className="mt-2 max-w-xs text-sm text-muted-foreground">
            Find completed field work that never made it onto an invoice.
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            A TwoRiverOps solution — software for expensive operational problems.
          </p>
        </div>
        <div>
          <p className="label-caps">Product</p>
          <ul className="mt-2 space-y-1.5 text-sm">
            {NAV.map((item) => (
              <li key={item.to}>
                <Link to={item.to} className="text-muted-foreground hover:text-foreground">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="label-caps">Get started</p>
          <ul className="mt-2 space-y-1.5 text-sm">
            {secureWorkspaceLink("/") ? (
              <li>
                <a
                  href={secureWorkspaceLink("/")!}
                  rel="noopener"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Secure workspace
                </a>
              </li>
            ) : (
              <>
                <li>
                  <Link
                    to="/request-access"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Request a pilot analysis
                  </Link>
                </li>
                {getLaunchConfig().capabilities.inAppAuth ? (
                  <li>
                    <Link to="/sign-in" className="text-muted-foreground hover:text-foreground">
                      Sign in
                    </Link>
                  </li>
                ) : null}
              </>
            )}
            <li>
              <Link to="/help" className="text-muted-foreground hover:text-foreground">
                Help
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
