/**
 * Provider-neutral analytics.
 *
 * Only value events and non-sensitive identifiers are emitted. Document
 * contents, file contents, invoice/financial line items, customer names,
 * tokens and personal data must never be passed here — the sanitizer drops
 * unknown keys defensively, but callers are responsible first.
 */

export const ANALYTICS_EVENTS = [
  "account_created",
  "onboarding_completed",
  "core_workflow_started",
  "first_successful_outcome",
  "core_workflow_completed",
  "workflow_failed",
  "repeat_usage",
  "converted_to_paid",
  "subscription_cancelled",
] as const;

export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[number];

/** Keys allowed to leave the app. Everything else is dropped. */
const ALLOWED_KEYS = [
  "product",
  "accountId",
  "userId",
  "role",
  "workflow",
  "runId",
  "outcome",
  "exceptionCount",
  "jobsAnalyzed",
  "sourceCount",
  "planId",
  "subscriptionState",
  "isSampleAccount",
  "durationMs",
  "failureStage",
  "runIndex",
] as const;

export type AnalyticsProps = Partial<
  Record<(typeof ALLOWED_KEYS)[number], string | number | boolean | null>
>;

export interface AnalyticsProvider {
  name: string;
  track(event: AnalyticsEvent, props: AnalyticsProps): void;
  identify(userId: string, props: AnalyticsProps): void;
}

export function sanitize(props: Record<string, unknown>): AnalyticsProps {
  const out: Record<string, string | number | boolean | null> = {};
  for (const key of ALLOWED_KEYS) {
    const value = props[key];
    if (value === undefined) continue;
    if (
      value === null ||
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      out[key] = value;
    }
  }
  return out;
}

/** Default no-network provider. Swap for a real provider at the edge of the app. */
export function createConsoleAnalyticsProvider(): AnalyticsProvider {
  return {
    name: "console",
    track(event, props) {
      if (import.meta.env.DEV) {
        console.info(`[analytics] ${event}`, props);
      }
    },
    identify(userId, props) {
      if (import.meta.env.DEV) {
        console.info("[analytics] identify", userId, props);
      }
    },
  };
}

export interface Analytics {
  track(event: AnalyticsEvent, props?: Record<string, unknown>): void;
  identify(userId: string, props?: Record<string, unknown>): void;
  provider: string;
}

export function createAnalytics(provider: AnalyticsProvider): Analytics {
  return {
    provider: provider.name,
    track(event, props = {}) {
      // Instrumentation must never break the operator's workflow.
      try {
        provider.track(event, sanitize({ product: "routeleak", ...props }));
      } catch (error) {
        console.warn("[analytics] track failed", error);
      }
    },
    identify(userId, props = {}) {
      try {
        provider.identify(userId, sanitize({ product: "routeleak", ...props }));
      } catch (error) {
        console.warn("[analytics] identify failed", error);
      }
    },
  };
}

let analyticsInstance: Analytics | null = null;

export function getAnalytics(): Analytics {
  if (!analyticsInstance) {
    analyticsInstance = createAnalytics(createConsoleAnalyticsProvider());
  }
  return analyticsInstance;
}

/** Allows a host to install a real provider without touching feature code. */
export function setAnalyticsProvider(provider: AnalyticsProvider) {
  analyticsInstance = createAnalytics(provider);
}
