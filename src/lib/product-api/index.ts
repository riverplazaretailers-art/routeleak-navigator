/**
 * Adapter selection — driven entirely by the launch configuration.
 *
 *   demo         -> isolated, clearly labeled demo adapter (synthetic data).
 *   secure-link  -> fail-closed adapter; real work happens in the preserved
 *                   secure workspace, which the UI links out to.
 *   api          -> typed v1 gateway adapter (requires BOTH VITE_API_BASE_URL
 *                   and VITE_API_CONTRACT_VERSION=v1).
 *   misconfigured-> fail-closed adapter carrying the configuration error.
 *
 * No credentials or endpoints are hardcoded here, and the demo adapter can
 * only ever be selected in demo mode.
 */
import { getLaunchConfig, type LaunchConfig } from "@/lib/launch-config";

import { createDemoProductApi } from "./demo";
import { createHttpProductApi } from "./http";
import { createUnavailableProductApi } from "./unavailable";
import type { ProductApi } from "./types";

export function createProductApiForConfig(config: LaunchConfig): ProductApi {
  switch (config.mode) {
    case "demo":
      return createDemoProductApi();
    case "api":
      return createHttpProductApi(config.apiBaseUrl!);
    case "secure-link":
      return createUnavailableProductApi(
        "Secure workspace (not called from here)",
        "RouteLeak analysis runs in the secure RouteLeak workspace. Continue there to sign in and work real data.",
      );
    case "misconfigured":
    default:
      return createUnavailableProductApi(
        "Configuration error",
        config.configError ??
          "RouteLeak is not configured. Set no variables for demo mode, VITE_SECURE_WORKSPACE_URL for secure-link mode, or both VITE_API_BASE_URL and VITE_API_CONTRACT_VERSION=v1 for API mode.",
      );
  }
}

let instance: ProductApi | null = null;

export function getProductApi(): ProductApi {
  if (!instance) instance = createProductApiForConfig(getLaunchConfig());
  return instance;
}

/** Test-only reset. */
export function __resetProductApi() {
  instance = null;
}

export * from "./types";
