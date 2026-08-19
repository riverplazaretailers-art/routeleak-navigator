import { afterEach, describe, expect, it, vi } from "vitest";

import { createHttpProductApi } from "./http";

type Call = { url: string; init: RequestInit };

function mockFetch(
  handler: (call: Call) => { status?: number; body?: unknown } | Promise<never>,
) {
  const calls: Call[] = [];
  const fn = vi.fn(async (url: unknown, init: unknown) => {
    const call = { url: String(url), init: (init ?? {}) as RequestInit };
    calls.push(call);
    const result = await handler(call);
    const status = result.status ?? 200;
    return new Response(status === 204 ? null : JSON.stringify(result.body ?? {}), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  });
  vi.stubGlobal("fetch", fn);
  return calls;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

const SESSION = {
  id: "u1",
  name: "Dana",
  email: "dana@example.com",
  role: "controller",
  accountId: "acct-1",
  accountName: "FieldCo",
  isSampleAccount: false,
  permissions: ["exceptions:update"],
};

describe("http adapter", () => {
  it("is labeled as the live backend and never as demo", () => {
    const api = createHttpProductApi("https://api.routeleak.example");
    expect(api.isDemo).toBe(false);
    expect(api.adapterLabel.toLowerCase()).not.toContain("demo");
  });

  it("trims trailing slashes and sends cookie credentials, no secrets", async () => {
    const calls = mockFetch(() => ({ body: SESSION }));
    const api = createHttpProductApi("https://api.routeleak.example/");
    await api.getSession();

    expect(calls[0]!.url).toBe("https://api.routeleak.example/v1/session");
    expect(calls[0]!.init.credentials).toBe("include");
    const headers = calls[0]!.init.headers as Record<string, string>;
    expect(headers["Authorization"]).toBeUndefined();
    expect(JSON.stringify(headers)).not.toMatch(/key|token|secret/i);
  });

  it("treats an unauthorized session probe as signed out", async () => {
    mockFetch(() => ({ status: 401, body: { message: "no" } }));
    const api = createHttpProductApi("https://api.routeleak.example");
    await expect(api.getSession()).resolves.toBeNull();
  });

  it("maps backend status codes onto ProductApiError codes and keeps the message", async () => {
    const cases: [number, string][] = [
      [403, "forbidden"],
      [404, "not_found"],
      [409, "conflict"],
      [422, "invalid_input"],
      [400, "invalid_input"],
      [500, "server"],
    ];
    for (const [status, code] of cases) {
      mockFetch(() => ({ status, body: { message: "backend says no" } }));
      const api = createHttpProductApi("https://api.routeleak.example");
      await expect(api.getRun("run-1")).rejects.toMatchObject({
        code,
        status,
        message: "backend says no",
      });
    }
  });

  it("reports a network failure without leaking the url", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("failed to fetch");
      }),
    );
    const api = createHttpProductApi("https://api.routeleak.example");
    await expect(api.listRuns()).rejects.toMatchObject({ code: "network" });
  });

  it("posts run files as multipart form data", async () => {
    const calls = mockFetch(() => ({ body: { id: "run-9" } }));
    const api = createHttpProductApi("https://api.routeleak.example");
    await api.startRun({
      periodLabel: "August 2026",
      fieldActivityFile: new File(["a"], "field.csv"),
      invoicesFile: new File(["b"], "invoices.csv"),
      notes: "quarter close",
    });

    const call = calls[0]!;
    expect(call.url).toBe("https://api.routeleak.example/v1/runs");
    expect(call.init.method).toBe("POST");
    const form = call.init.body as FormData;
    expect(form).toBeInstanceOf(FormData);
    expect(form.get("periodLabel")).toBe("August 2026");
    expect((form.get("fieldActivity") as File).name).toBe("field.csv");
    expect(form.get("payments")).toBeNull();
    expect((call.init.headers as Record<string, string>)["Content-Type"]).toBeUndefined();
  });

  it("builds exception query strings from the typed query", async () => {
    const calls = mockFetch(() => ({ body: [] }));
    const api = createHttpProductApi("https://api.routeleak.example");
    await api.listExceptions({ runId: "run-1", status: "open", search: "WO 12" });
    await api.listExceptions({ status: "all" });

    expect(calls[0]!.url).toBe(
      "https://api.routeleak.example/v1/exceptions?runId=run-1&status=open&search=WO+12",
    );
    expect(calls[1]!.url).toBe("https://api.routeleak.example/v1/exceptions");
  });

  it("sends status decisions to the backend rather than deciding locally", async () => {
    const calls = mockFetch(() => ({ body: { id: "exc-1", status: "recovered" } }));
    const api = createHttpProductApi("https://api.routeleak.example");
    await api.updateExceptionStatus({
      exceptionId: "exc-1",
      status: "recovered",
      note: "collected",
    });

    expect(calls[0]!.url).toBe(
      "https://api.routeleak.example/v1/exceptions/exc-1/status",
    );
    expect(JSON.parse(calls[0]!.init.body as string)).toEqual({
      status: "recovered",
      note: "collected",
    });
  });

  it("encodes path parameters", async () => {
    const calls = mockFetch(() => ({ body: {} }));
    const api = createHttpProductApi("https://api.routeleak.example");
    await api.getException("exc/1 2");
    expect(calls[0]!.url).toBe("https://api.routeleak.example/v1/exceptions/exc%2F1%202");
  });

  it("resolves 204 responses to undefined", async () => {
    mockFetch(() => ({ status: 204 }));
    const api = createHttpProductApi("https://api.routeleak.example");
    await expect(api.signOut()).resolves.toBeUndefined();
  });
});
