/**
 * Launch configuration — the single source of truth for what this Lovable app
 * is allowed to do at runtime.
 *
 * RouteLeak's preserved backend is authoritative and today exposes
 * `/api/audits`, `/api/pilots`, `/api/uploads` and `/api/operator` behind its
 * own secure workspace authentication. This app therefore has three explicit
 * modes and never claims a live connection it does not have:
 *
 *   demo        no configuration -> synthetic, clearly labeled sample data.
 *   secure-link VITE_SECURE_WORKSPACE_URL set -> every real-analysis, sign-in
 *               and start CTA hands off to that secure workspace. This app
 *               stays the public/product UI.
 *   api         VITE_API_BASE_URL *and* VITE_API_CONTRACT_VERSION=v1 set ->
 *               the typed v1 gateway adapter is used. This is a future
 *               contract: a base URL alone is never enough and never "Live".
 *
 * Any partial or contradictory configuration fails closed with a
 * configuration error instead of silently degrading.
 */

export type LaunchMode = "demo" | "secure-link" | "api" | "misconfigured";

export const SUPPORTED_API_CONTRACT_VERSION = "v1";

export interface LaunchCapabilities {
  /** The synthetic demo adapter may be selected. */
  demoData: boolean;
  /** Sign-in / session handling happens inside this app. */
  inAppAuth: boolean;
  /** Real reconciliation runs and exception decisions are available here. */
  liveAnalysis: boolean;
  /** Integration, plan and billing catalogs can be read through ProductApi. */
  backendCatalog: boolean;
  /** CTAs must hand off to the external secure workspace. */
  externalHandoff: boolean;
}

export interface LaunchConfig {
  mode: LaunchMode;
  secureWorkspaceUrl: string | null;
  apiBaseUrl: string | null;
  apiContractVersion: string | null;
  capabilities: LaunchCapabilities;
  /** Human-readable reason the app is failing closed, or null. */
  configError: string | null;
}

type EnvLike = Record<string, string | undefined>;

function clean(value: string | undefined): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isAbsoluteHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function capabilitiesFor(mode: LaunchMode): LaunchCapabilities {
  switch (mode) {
    case "demo":
      return {
        demoData: true,
        inAppAuth: true,
        liveAnalysis: false,
        backendCatalog: true,
        externalHandoff: false,
      };
    case "secure-link":
      return {
        demoData: false,
        inAppAuth: false,
        liveAnalysis: false,
        backendCatalog: false,
        externalHandoff: true,
      };
    case "api":
      return {
        demoData: false,
        inAppAuth: true,
        liveAnalysis: true,
        backendCatalog: true,
        externalHandoff: false,
      };
    case "misconfigured":
    default:
      return {
        demoData: false,
        inAppAuth: false,
        liveAnalysis: false,
        backendCatalog: false,
        externalHandoff: false,
      };
  }
}

export function resolveLaunchConfig(env: EnvLike): LaunchConfig {
  const apiBaseUrl = clean(env["VITE_API_BASE_URL"]);
  const apiContractVersion = clean(env["VITE_API_CONTRACT_VERSION"]);
  const secureWorkspaceUrl = clean(env["VITE_SECURE_WORKSPACE_URL"]);

  const build = (mode: LaunchMode, configError: string | null = null): LaunchConfig => ({
    mode,
    secureWorkspaceUrl: mode === "secure-link" ? secureWorkspaceUrl : null,
    apiBaseUrl: mode === "api" ? apiBaseUrl : null,
    apiContractVersion: mode === "api" ? apiContractVersion : null,
    capabilities: capabilitiesFor(mode),
    configError,
  });

  // API mode requires both halves of the gateway contract.
  if (apiBaseUrl || apiContractVersion) {
    if (!apiBaseUrl) {
      return build(
        "misconfigured",
        `VITE_API_CONTRACT_VERSION is set but VITE_API_BASE_URL is missing. API mode requires both, with VITE_API_CONTRACT_VERSION=${SUPPORTED_API_CONTRACT_VERSION}.`,
      );
    }
    if (!apiContractVersion) {
      return build(
        "misconfigured",
        `VITE_API_BASE_URL is set but VITE_API_CONTRACT_VERSION is missing. A base URL alone does not make the v1 gateway live; set VITE_API_CONTRACT_VERSION=${SUPPORTED_API_CONTRACT_VERSION} once a same-origin, conventional-auth v1 gateway is actually deployed.`,
      );
    }
    if (apiContractVersion !== SUPPORTED_API_CONTRACT_VERSION) {
      return build(
        "misconfigured",
        `VITE_API_CONTRACT_VERSION="${apiContractVersion}" is not supported. This app implements contract version ${SUPPORTED_API_CONTRACT_VERSION} only.`,
      );
    }
    if (!isAbsoluteHttpUrl(apiBaseUrl)) {
      return build("misconfigured", "VITE_API_BASE_URL must be an absolute http(s) URL.");
    }
    if (secureWorkspaceUrl) {
      return build(
        "misconfigured",
        "VITE_API_BASE_URL and VITE_SECURE_WORKSPACE_URL are both set. Choose one launch mode: api or secure-link.",
      );
    }
    return build("api");
  }

  if (secureWorkspaceUrl) {
    if (!isAbsoluteHttpUrl(secureWorkspaceUrl)) {
      return build(
        "misconfigured",
        "VITE_SECURE_WORKSPACE_URL must be an absolute http(s) URL pointing at the RouteLeak secure workspace.",
      );
    }
    return build("secure-link");
  }

  return build("demo");
}

let cached: LaunchConfig | null = null;

export function getLaunchConfig(): LaunchConfig {
  if (cached) return cached;
  cached = resolveLaunchConfig(import.meta.env as unknown as EnvLike);
  return cached;
}

/** Test-only reset. */
export function __resetLaunchConfig(next?: LaunchConfig) {
  cached = next ?? null;
}

export function getCapabilities(): LaunchCapabilities {
  return getLaunchConfig().capabilities;
}

/** Absolute URL inside the configured secure workspace, or null. */
export function secureWorkspaceLink(path = "/"): string | null {
  const { secureWorkspaceUrl } = getLaunchConfig();
  if (!secureWorkspaceUrl) return null;
  const root = secureWorkspaceUrl.replace(/\/+$/, "");
  if (!path || path === "/") return root;
  return `${root}${path.startsWith("/") ? path : `/${path}`}`;
}

export const MODE_LABEL: Record<LaunchMode, string> = {
  demo: "Demo mode — synthetic data",
  "secure-link": "Secure workspace mode",
  api: "v1 gateway mode",
  misconfigured: "Configuration error",
};
