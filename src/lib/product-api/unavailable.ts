/**
 * Fail-closed adapter.
 *
 * Used when this app is NOT allowed to talk to a backend: secure-link mode
 * (analysis lives in the preserved secure workspace) and misconfigured mode.
 * Every method rejects with the same explanation, and it is never a demo
 * adapter — so synthetic figures can never leak into a non-demo mode.
 */
import { ProductApiError, type ProductApi } from "./types";

export function createUnavailableProductApi(adapterLabel: string, message: string): ProductApi {
  const fail = async (): Promise<never> => {
    throw new ProductApiError("server", message);
  };

  return {
    adapterLabel,
    isDemo: false,

    // A session probe must not throw: this app simply has no session of its own.
    getSession: async () => null,
    signIn: fail,
    signOut: async () => {},

    getEconomicSummary: fail,
    listRuns: fail,
    getRun: fail,
    startRun: fail,

    listExceptions: fail,
    getException: fail,
    updateExceptionStatus: fail,

    exportRun: fail,

    listIntegrations: fail,
    listPlans: fail,
    getBillingState: fail,
    requestAccess: fail,

    getSettings: fail,
    updateSettings: fail,

    listJobFailures: fail,
    retryJob: fail,
  };
}
