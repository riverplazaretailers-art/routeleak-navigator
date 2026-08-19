/**
 * HTTP adapter for the authoritative RouteLeak backend.
 *
 * Configured entirely by VITE_API_BASE_URL. No secrets live in source: the
 * backend authenticates the browser session with an HttpOnly cookie, so this
 * adapter only sets `credentials: "include"`.
 */
import {
  ProductApiError,
  type AccessRequest,
  type AccountSettings,
  type BillingState,
  type EconomicSummary,
  type ExceptionDetail,
  type ExceptionSummary,
  type ExportResult,
  type Integration,
  type JobFailure,
  type ListExceptionsQuery,
  type Plan,
  type ProductApi,
  type Run,
  type RunInput,
  type SessionUser,
} from "./types";

function mapStatus(status: number): ProductApiError["code"] {
  if (status === 401) return "unauthorized";
  if (status === 403) return "forbidden";
  if (status === 404) return "not_found";
  if (status === 409) return "conflict";
  if (status === 422 || status === 400) return "invalid_input";
  return "server";
}

export function createHttpProductApi(baseUrl: string): ProductApi {
  const root = baseUrl.replace(/\/+$/, "");

  async function request<T>(
    path: string,
    init?: { method?: string; body?: unknown; formData?: FormData },
  ): Promise<T> {
    const url = `${root}${path}`;
    let response: Response;
    try {
      response = await fetch(url, {
        method: init?.method ?? "GET",
        credentials: "include",
        headers: init?.formData
          ? { Accept: "application/json" }
          : { Accept: "application/json", "Content-Type": "application/json" },
        body: init?.formData
          ? init.formData
          : init?.body !== undefined
            ? JSON.stringify(init.body)
            : null,
      });
    } catch {
      throw new ProductApiError("network", "RouteLeak could not reach the analysis service.");
    }

    if (!response.ok) {
      let message = `Request failed (${response.status}).`;
      try {
        const payload = (await response.json()) as { message?: string };
        if (payload?.message) message = payload.message;
      } catch {
        /* keep default message */
      }
      throw new ProductApiError(mapStatus(response.status), message, response.status);
    }

    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  }

  function runFormData(input: RunInput): FormData {
    const form = new FormData();
    form.set("periodLabel", input.periodLabel);
    if (input.notes) form.set("notes", input.notes);
    if (input.fieldActivityFile) form.set("fieldActivity", input.fieldActivityFile);
    if (input.invoicesFile) form.set("invoices", input.invoicesFile);
    if (input.paymentsFile) form.set("payments", input.paymentsFile);
    return form;
  }

  return {
    adapterLabel: "Live RouteLeak backend",
    isDemo: false,

    async getSession() {
      try {
        return await request<SessionUser>("/v1/session");
      } catch (error) {
        if (error instanceof ProductApiError && error.code === "unauthorized") {
          return null;
        }
        throw error;
      }
    },
    signIn: (body) => request<SessionUser>("/v1/session", { method: "POST", body }),
    signOut: () => request<void>("/v1/session", { method: "DELETE" }),

    getEconomicSummary: () => request<EconomicSummary>("/v1/summary"),
    listRuns: () => request<Run[]>("/v1/runs"),
    getRun: (runId) => request<Run>(`/v1/runs/${encodeURIComponent(runId)}`),
    startRun: (input) => request<Run>("/v1/runs", { method: "POST", formData: runFormData(input) }),

    listExceptions: (query?: ListExceptionsQuery) => {
      const params = new URLSearchParams();
      if (query?.runId) params.set("runId", query.runId);
      if (query?.status && query.status !== "all") params.set("status", query.status);
      if (query?.search) params.set("search", query.search);
      const qs = params.toString();
      return request<ExceptionSummary[]>(`/v1/exceptions${qs ? `?${qs}` : ""}`);
    },
    getException: (id) => request<ExceptionDetail>(`/v1/exceptions/${encodeURIComponent(id)}`),
    updateExceptionStatus: ({ exceptionId, status, note }) =>
      request<ExceptionDetail>(`/v1/exceptions/${encodeURIComponent(exceptionId)}/status`, {
        method: "POST",
        body: { status, note },
      }),

    exportRun: (runId) =>
      request<ExportResult>(`/v1/runs/${encodeURIComponent(runId)}/export`, {
        method: "POST",
      }),

    listIntegrations: () => request<Integration[]>("/v1/integrations"),
    listPlans: () => request<Plan[]>("/v1/plans"),
    getBillingState: () => request<BillingState>("/v1/billing"),
    requestAccess: (body) =>
      request<{ received: true }>("/v1/access-requests", {
        method: "POST",
        body,
      }),

    getSettings: () => request<AccountSettings>("/v1/settings"),
    updateSettings: (body) => request<AccountSettings>("/v1/settings", { method: "PATCH", body }),

    listJobFailures: () => request<JobFailure[]>("/v1/admin/job-failures"),
    retryJob: (failureId) =>
      request<{ queued: true }>(`/v1/admin/job-failures/${encodeURIComponent(failureId)}/retry`, {
        method: "POST",
      }),
  };
}
