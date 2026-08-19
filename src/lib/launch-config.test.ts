import { describe, expect, it } from "vitest";

import { resolveLaunchConfig } from "./launch-config";

describe("launch config", () => {
  it("defaults to demo mode with no configuration", () => {
    const config = resolveLaunchConfig({});
    expect(config.mode).toBe("demo");
    expect(config.capabilities.demoData).toBe(true);
    expect(config.capabilities.liveAnalysis).toBe(false);
    expect(config.configError).toBeNull();
  });

  it("treats blank values as absent", () => {
    expect(
      resolveLaunchConfig({
        VITE_API_BASE_URL: "  ",
        VITE_SECURE_WORKSPACE_URL: "",
      }).mode,
    ).toBe("demo");
  });

  it("enters secure-link mode and never allows demo data", () => {
    const config = resolveLaunchConfig({
      VITE_SECURE_WORKSPACE_URL: "https://app.routeleak.example/",
    });
    expect(config.mode).toBe("secure-link");
    expect(config.secureWorkspaceUrl).toBe("https://app.routeleak.example/");
    expect(config.capabilities.demoData).toBe(false);
    expect(config.capabilities.inAppAuth).toBe(false);
    expect(config.capabilities.externalHandoff).toBe(true);
  });

  it("requires both halves of the v1 gateway contract", () => {
    const baseOnly = resolveLaunchConfig({
      VITE_API_BASE_URL: "https://api.routeleak.example",
    });
    expect(baseOnly.mode).toBe("misconfigured");
    expect(baseOnly.configError).toMatch(/VITE_API_CONTRACT_VERSION/);
    expect(baseOnly.capabilities.demoData).toBe(false);
    expect(baseOnly.capabilities.liveAnalysis).toBe(false);

    const versionOnly = resolveLaunchConfig({ VITE_API_CONTRACT_VERSION: "v1" });
    expect(versionOnly.mode).toBe("misconfigured");
    expect(versionOnly.configError).toMatch(/VITE_API_BASE_URL/);

    const wrongVersion = resolveLaunchConfig({
      VITE_API_BASE_URL: "https://api.routeleak.example",
      VITE_API_CONTRACT_VERSION: "v2",
    });
    expect(wrongVersion.mode).toBe("misconfigured");
  });

  it("enters api mode only with a valid base URL and contract v1", () => {
    const config = resolveLaunchConfig({
      VITE_API_BASE_URL: "https://api.routeleak.example",
      VITE_API_CONTRACT_VERSION: "v1",
    });
    expect(config.mode).toBe("api");
    expect(config.capabilities.liveAnalysis).toBe(true);
    expect(config.capabilities.demoData).toBe(false);

    expect(
      resolveLaunchConfig({
        VITE_API_BASE_URL: "not-a-url",
        VITE_API_CONTRACT_VERSION: "v1",
      }).mode,
    ).toBe("misconfigured");
  });

  it("fails closed when both api and secure-link are configured", () => {
    const config = resolveLaunchConfig({
      VITE_API_BASE_URL: "https://api.routeleak.example",
      VITE_API_CONTRACT_VERSION: "v1",
      VITE_SECURE_WORKSPACE_URL: "https://app.routeleak.example",
    });
    expect(config.mode).toBe("misconfigured");
    expect(config.configError).toMatch(/one launch mode/i);
  });

  it("rejects a non-absolute secure workspace URL", () => {
    expect(
      resolveLaunchConfig({ VITE_SECURE_WORKSPACE_URL: "/workspace" }).mode,
    ).toBe("misconfigured");
  });
});
