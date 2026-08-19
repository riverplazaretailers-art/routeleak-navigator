import { beforeEach, describe, expect, it } from "vitest";

import { createDemoProductApi, __resetDemoState } from "./demo";
import { ProductApiError } from "./types";

function file(name: string) {
  return new File(["work_order,customer\nWO-1,Acme\n"], name, { type: "text/csv" });
}

describe("demo adapter", () => {
  beforeEach(() => {
    window.localStorage.clear();
    __resetDemoState();
  });

  it("is explicitly labeled as demo", () => {
    const api = createDemoProductApi();
    expect(api.isDemo).toBe(true);
    expect(api.adapterLabel.toLowerCase()).toContain("demo");
  });

  it("returns no session until sign-in and rejects a wrong password", async () => {
    const api = createDemoProductApi();
    await expect(api.getSession()).resolves.toBeNull();
    await expect(
      api.signIn({ email: "controller@sample-fieldco.example", password: "nope" }),
    ).rejects.toMatchObject({ code: "unauthorized" });
    await expect(api.signIn({ email: "bad", password: "demo" })).rejects.toMatchObject({
      code: "invalid_input",
    });
  });

  it("guards authenticated reads until sign-in", async () => {
    const api = createDemoProductApi();
    await expect(api.getEconomicSummary()).rejects.toBeInstanceOf(ProductApiError);
    await api.signIn({ email: "a@b.com", password: "demo" });
    await expect(api.getEconomicSummary()).resolves.toMatchObject({ currency: "USD" });
  });

  it("clears the session on sign out", async () => {
    const api = createDemoProductApi();
    await api.signIn({ email: "a@b.com", password: "demo" });
    await api.signOut();
    await expect(api.getSession()).resolves.toBeNull();
  });

  it("ranks exceptions by recoverable amount and filters by status and search", async () => {
    const api = createDemoProductApi();
    await api.signIn({ email: "a@b.com", password: "demo" });

    const all = await api.listExceptions();
    expect(all.length).toBeGreaterThan(0);
    const amounts = all.map((e) => e.recoverableAmount);
    expect([...amounts].sort((a, b) => b - a)).toEqual(amounts);

    const open = await api.listExceptions({ status: "open" });
    expect(open.every((e) => e.status === "open")).toBe(true);

    const first = all[0]!;
    const found = await api.listExceptions({ search: first.workOrderRef });
    expect(found.map((e) => e.id)).toContain(first.id);

    const none = await api.listExceptions({ search: "no-such-work-order" });
    expect(none).toHaveLength(0);
  });

  it("returns evidence, lineage and audit with an exception detail", async () => {
    const api = createDemoProductApi();
    await api.signIn({ email: "a@b.com", password: "demo" });
    const [first] = await api.listExceptions();
    const detail = await api.getException(first!.id);

    expect(detail.evidence.length).toBeGreaterThan(0);
    expect(detail.lineage.length).toBeGreaterThan(0);
    expect(detail.audit.length).toBeGreaterThan(0);
    expect(detail.allowedStatuses.length).toBeGreaterThan(0);
    await expect(api.getException("missing")).rejects.toMatchObject({
      code: "not_found",
    });
  });

  it("requires both required exports before a run starts", async () => {
    const api = createDemoProductApi();
    await api.signIn({ email: "a@b.com", password: "demo" });
    await expect(
      api.startRun({ periodLabel: "August 2026", fieldActivityFile: file("a.csv") }),
    ).rejects.toMatchObject({ code: "invalid_input" });
  });

  it("exports a run as CSV without inventing a download host", async () => {
    const api = createDemoProductApi();
    await api.signIn({ email: "a@b.com", password: "demo" });
    const [run] = await api.listRuns();
    const result = await api.exportRun(run!.id);
    expect(result.mimeType).toBe("text/csv");
    expect(result.content?.split("\n")[0]).toContain("work_order");
    expect(result.url).toBeUndefined();
  });

  it("persists settings updates", async () => {
    const api = createDemoProductApi();
    await api.signIn({ email: "a@b.com", password: "demo" });
    const updated = await api.updateSettings({ minimumRecoverableAmount: 12_500 });
    expect(updated.minimumRecoverableAmount).toBe(12_500);
    await expect(api.getSettings()).resolves.toMatchObject({
      minimumRecoverableAmount: 12_500,
    });
  });

  it("labels integrations honestly and never claims an unbuilt connector is live", async () => {
    const api = createDemoProductApi();
    const integrations = await api.listIntegrations();
    const live = integrations.filter((i) => i.state === "live");
    expect(live.length).toBeGreaterThan(0);
    expect(live.every((i) => i.category === "file")).toBe(true);
    expect(
      integrations
        .filter((i) => i.category !== "file")
        .every((i) => i.state === "planned" || i.state === "pilot"),
    ).toBe(true);
  });

  it("validates access requests", async () => {
    const api = createDemoProductApi();
    await expect(
      api.requestAccess({
        companyName: "",
        contactName: "A",
        email: "a@b.com",
        role: "owner",
        techniciansCopy: "10",
      }),
    ).rejects.toMatchObject({ code: "invalid_input" });
    await expect(
      api.requestAccess({
        companyName: "FieldCo",
        contactName: "A",
        email: "a@b.com",
        role: "owner",
        techniciansCopy: "10",
      }),
    ).resolves.toEqual({ received: true });
  });

  it("rejects retrying an unknown job failure", async () => {
    const api = createDemoProductApi();
    await api.signIn({ email: "a@b.com", password: "demo" });
    await expect(api.retryJob("nope")).rejects.toMatchObject({ code: "not_found" });
    const [failure] = await api.listJobFailures();
    await expect(api.retryJob(failure!.id)).resolves.toEqual({ queued: true });
  });
});
