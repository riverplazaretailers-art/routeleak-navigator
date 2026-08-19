import { afterEach, describe, expect, it, vi } from "vitest";

import { resolveLaunchConfig, secureWorkspaceLink, __resetLaunchConfig } from "@/lib/launch-config";

import { createProductApiForConfig } from "./index";

afterEach(() => {
  vi.unstubAllGlobals();
  __resetLaunchConfig();
});

function apiFor(env: Record<string, string | undefined>) {
  return createProductApiForConfig(resolveLaunchConfig(env));
}

describe("launch mode adapter selection", () => {
  it("selects the demo adapter only in demo mode", () => {
    expect(apiFor({}).isDemo).toBe(true);
  });

  it("never selects demo data in secure-link mode", async () => {
    const api = apiFor({ VITE_SECURE_WORKSPACE_URL: "https://app.routeleak.example" });
    expect(api.isDemo).toBe(false);
    expect(api.adapterLabel.toLowerCase()).not.toContain("demo");
    await expect(api.getEconomicSummary()).rejects.toThrow(/secure RouteLeak workspace/i);
    await expect(api.listExceptions()).rejects.toThrow();
    expect(await api.getSession()).toBeNull();
  });

  it("never selects demo data in api mode", () => {
    const api = apiFor({
      VITE_API_BASE_URL: "https://api.routeleak.example",
      VITE_API_CONTRACT_VERSION: "v1",
    });
    expect(api.isDemo).toBe(false);
  });

  it("fails closed on partial api configuration", async () => {
    const api = apiFor({ VITE_API_BASE_URL: "https://api.routeleak.example" });
    expect(api.isDemo).toBe(false);
    await expect(api.listRuns()).rejects.toThrow(/VITE_API_CONTRACT_VERSION/);
  });

  it("makes no speculative /v1 request outside api mode", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const secure = apiFor({ VITE_SECURE_WORKSPACE_URL: "https://app.routeleak.example" });
    await secure.getSession();
    await secure.listIntegrations().catch(() => {});
    await secure.startRun({ periodLabel: "July" }).catch(() => {});

    const broken = apiFor({ VITE_API_BASE_URL: "https://api.routeleak.example" });
    await broken.listPlans().catch(() => {});

    const demo = apiFor({});
    await demo.listIntegrations().catch(() => {});
    await demo.getSession();

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("issues v1 calls only when the full contract is configured", async () => {
    const fetchSpy = vi.fn(
      async (url: unknown, _init?: unknown) => {
        void url;
        void _init;
        return new Response(JSON.stringify([]), { status: 200 });
      },
    );
    vi.stubGlobal("fetch", fetchSpy);

    const api = apiFor({
      VITE_API_BASE_URL: "https://api.routeleak.example",
      VITE_API_CONTRACT_VERSION: "v1",
    });
    await api.listIntegrations();

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(String(fetchSpy.mock.calls[0]![0])).toBe(
      "https://api.routeleak.example/v1/integrations",
    );
  });
});

describe("secure-link CTA targets", () => {
  it("builds every handoff from the configured URL only", () => {
    __resetLaunchConfig(
      resolveLaunchConfig({ VITE_SECURE_WORKSPACE_URL: "https://app.routeleak.example/" }),
    );

    expect(secureWorkspaceLink("/")).toBe("https://app.routeleak.example");
    expect(secureWorkspaceLink("/api/pilots")).toBe(
      "https://app.routeleak.example/api/pilots",
    );
    expect(secureWorkspaceLink("/api/uploads")).toBe(
      "https://app.routeleak.example/api/uploads",
    );
    for (const link of ["/", "/api/pilots", "/api/uploads", "/api/operator"]) {
      expect(secureWorkspaceLink(link)!.startsWith("https://app.routeleak.example")).toBe(
        true,
      );
    }
  });

  it("offers no handoff link outside secure-link mode", () => {
    __resetLaunchConfig(resolveLaunchConfig({}));
    expect(secureWorkspaceLink("/api/pilots")).toBeNull();

    __resetLaunchConfig(
      resolveLaunchConfig({
        VITE_API_BASE_URL: "https://api.routeleak.example",
        VITE_API_CONTRACT_VERSION: "v1",
      }),
    );
    expect(secureWorkspaceLink("/")).toBeNull();
  });
});
