/**
 * Provider-neutral billing.
 *
 * The workflow never depends on Stripe, Paddle or any vendor SDK. Plan and
 * subscription state come from the RouteLeak backend through ProductApi; a
 * BillingProvider is only responsible for starting or ending a commercial
 * action, and can be replaced without touching product screens.
 */
import type { BillingState, Plan, ProductApi } from "./product-api/types";

export interface CheckoutIntent {
  planId: string;
  accountId: string;
  /** Where the provider should return the operator after the action. */
  returnPath: string;
}

export interface BillingProvider {
  name: string;
  /** Returns a URL to redirect to, or null when the action is handled offline. */
  startCheckout(intent: CheckoutIntent): Promise<{ redirectUrl: string | null }>;
  cancelSubscription(input: {
    accountId: string;
    reason?: string;
  }): Promise<{ canceled: boolean }>;
}

export interface Billing {
  provider: string;
  listPlans(): Promise<Plan[]>;
  getState(): Promise<BillingState>;
  startCheckout(intent: CheckoutIntent): Promise<{ redirectUrl: string | null }>;
  cancelSubscription(input: {
    accountId: string;
    reason?: string;
  }): Promise<{ canceled: boolean }>;
}

/**
 * Default provider: commercial actions are handled by the TwoRiverOps team
 * (pilot analyses are quoted, not self-serve). No vendor SDK is involved.
 */
export function createManualBillingProvider(): BillingProvider {
  return {
    name: "manual",
    async startCheckout() {
      return { redirectUrl: null };
    },
    async cancelSubscription() {
      return { canceled: true };
    },
  };
}

export function createBilling(api: ProductApi, provider: BillingProvider): Billing {
  return {
    provider: provider.name,
    listPlans: () => api.listPlans(),
    getState: () => api.getBillingState(),
    startCheckout: (intent) => provider.startCheckout(intent),
    cancelSubscription: (input) => provider.cancelSubscription(input),
  };
}

export function formatMinorUnits(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: amount % 100 === 0 ? 0 : 2,
  }).format(amount / 100);
}
