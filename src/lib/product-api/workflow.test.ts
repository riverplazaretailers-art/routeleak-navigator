/**
 * Primary workflow transition tests.
 *
 * These assert the workflow the UI drives through ProductApi — run, review,
 * decide, export — and that permission rules are enforced at the boundary,
 * not in React.
 */
import { beforeEach, describe, expect, it } from "vitest";

import { createDemoProductApi, __resetDemoState } from "./demo";
import type { ExceptionStatus, ProductApi } from "./types";

function csv(name: string) {
  return new File(["work_order,customer\nWO-1,Acme\n"], name, { type: "text/csv" });
}

async function signedIn(): Promise<ProductApi> {
  const api = createDemoProductApi();
  await api.signIn({ email: "controller@sample-fieldco.example", password: "demo" });
  return api;
}

describe("primary workflow transitions", () => {
  beforeEach(() => {
    window.localStorage.clear();
    __resetDemoState();
  });

  it("runs a reconciliation and adds it to history as the newest run", async () => {
    const api = await signedIn();
    const before = await api.listRuns();

    const run = await api.startRun({
      periodLabel: "August 2026",
      fieldActivityFile: csv("field-activity.csv"),
      invoicesFile: csv("invoices.csv"),
      paymentsFile: csv("payments.csv"),
    });

    expect(run.status).toBe("completed");
    expect(run.label).toBe("August 2026");
    expect(run.sourceSummary).toContain("payments.csv");

    const after = await api.listRuns();
    expect(after).toHaveLength(before.length + 1);
    expect(after[0]!.id).toBe(run.id);
    await expect(api.getRun(run.id)).resolves.toMatchObject({ id: run.id });
  });

  it("scopes the exception list to the run that produced it", async () => {
    const api = await signedIn();
    const run = await api.startRun({
      periodLabel: "August 2026",
      fieldActivityFile: csv("field-activity.csv"),
      invoicesFile: csv("invoices.csv"),
    });
    const scoped = await api.listExceptions({ runId: run.id });
    expect(scoped.length).toBeGreaterThan(0);
    expect(scoped.every((e) => e.runId === run.id)).toBe(true);
  });

  it("moves an exception through needs_review -> recovered and audits each decision", async () => {
    const api = await signedIn();
    const [target] = await api.listExceptions();
    const id = target!.id;

    const reviewed = await api.updateExceptionStatus({
      exceptionId: id,
      status: "needs_review",
      note: "Waiting on the signed work order.",
    });
    expect(reviewed.status).toBe("needs_review");
    const reviewEntry = reviewed.audit.at(-1)!;
    expect(reviewEntry.action.toLowerCase()).toContain("needs review");
    expect(reviewEntry.note).toBe("Waiting on the signed work order.");

    const recovered = await api.updateExceptionStatus({
      exceptionId: id,
      status: "recovered",
    });
    expect(recovered.status).toBe("recovered");
    expect(recovered.audit.length).toBe(reviewed.audit.length + 1);

    const persisted = await api.getException(id);
    expect(persisted.status).toBe("recovered");
  });

  it("dismissing an exception removes it from the recoverable total", async () => {
    const api = await signedIn();
    const before = await api.getEconomicSummary();
    const open = (await api.listExceptions({ status: "open" }))[0]!;

    await api.updateExceptionStatus({ exceptionId: open.id, status: "dismissed" });

    const after = await api.getEconomicSummary();
    expect(after.recoverableTotal).toBe(before.recoverableTotal - open.recoverableAmount);
    expect(after.dismissedCount).toBe(before.dismissedCount + 1);
    expect(after.openCount).toBe(before.openCount - 1);
  });

  it("marking recovered increases the recovered total by the same amount", async () => {
    const api = await signedIn();
    const before = await api.getEconomicSummary();
    const open = (await api.listExceptions({ status: "open" }))[0]!;

    await api.updateExceptionStatus({ exceptionId: open.id, status: "recovered" });

    const after = await api.getEconomicSummary();
    expect(after.recoveredTotal).toBe(before.recoveredTotal + open.recoverableAmount);
    expect(after.recoveredCount).toBe(before.recoveredCount + 1);
  });

  it("rejects a status change for an unknown exception", async () => {
    const api = await signedIn();
    await expect(
      api.updateExceptionStatus({ exceptionId: "missing", status: "recovered" }),
    ).rejects.toMatchObject({ code: "not_found" });
  });

  it("requires a session for every workflow step", async () => {
    const api = createDemoProductApi();
    const steps: Promise<unknown>[] = [
      api.listRuns(),
      api.listExceptions(),
      api.getEconomicSummary(),
      api.updateExceptionStatus({
        exceptionId: "x",
        status: "recovered" as ExceptionStatus,
      }),
    ];
    for (const step of steps) {
      await expect(step).rejects.toMatchObject({ code: "unauthorized" });
    }
  });
});
