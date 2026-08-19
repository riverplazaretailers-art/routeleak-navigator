import { describe, expect, it, vi } from "vitest";

import { ANALYTICS_EVENTS, createAnalytics, sanitize, type AnalyticsProvider } from "./analytics";

function recorder() {
  const events: { event: string; props: Record<string, unknown> }[] = [];
  const identified: { userId: string; props: Record<string, unknown> }[] = [];
  const provider: AnalyticsProvider = {
    name: "test",
    track: (event, props) => events.push({ event, props }),
    identify: (userId, props) => identified.push({ userId, props }),
  };
  return { provider, events, identified };
}

describe("analytics", () => {
  it("covers every required value event", () => {
    expect([...ANALYTICS_EVENTS]).toEqual([
      "account_created",
      "onboarding_completed",
      "core_workflow_started",
      "first_successful_outcome",
      "core_workflow_completed",
      "workflow_failed",
      "repeat_usage",
      "converted_to_paid",
      "subscription_cancelled",
    ]);
  });

  it("drops document contents, financial line items and personal data", () => {
    const out = sanitize({
      accountId: "acct-1",
      runId: "run-1",
      exceptionCount: 6,
      customerName: "Northside Facilities",
      invoiceLines: [{ amount: 1240 }],
      recoverableAmount: 124_000,
      fileContents: "work_order,customer\n...",
      email: "dana@example.com",
      accessToken: "secret",
    }) as Record<string, unknown>;

    expect(out).toEqual({ accountId: "acct-1", runId: "run-1", exceptionCount: 6 });
    for (const key of [
      "customerName",
      "invoiceLines",
      "recoverableAmount",
      "fileContents",
      "email",
      "accessToken",
    ]) {
      expect(out).not.toHaveProperty(key);
    }
  });

  it("skips undefined values but keeps explicit nulls", () => {
    expect(sanitize({ accountId: undefined, runId: null })).toEqual({ runId: null });
  });

  it("sanitizes through the provider on track and identify", () => {
    const { provider, events, identified } = recorder();
    const analytics = createAnalytics(provider);

    analytics.track("core_workflow_completed", {
      runId: "run-1",
      customerName: "Northside Facilities",
    });
    analytics.identify("u1", { accountId: "acct-1", email: "x@y.z" });

    expect(events[0]!.props).not.toHaveProperty("customerName");
    expect(events[0]!.props["runId"]).toBe("run-1");
    expect(identified[0]!.props).not.toHaveProperty("email");
  });

  it("never throws when a provider fails", () => {
    const analytics = createAnalytics({
      name: "broken",
      track: () => {
        throw new Error("provider down");
      },
      identify: () => {
        throw new Error("provider down");
      },
    });
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(() => analytics.track("repeat_usage", {})).not.toThrow();
    expect(() => analytics.identify("u1", {})).not.toThrow();
    spy.mockRestore();
  });
});
