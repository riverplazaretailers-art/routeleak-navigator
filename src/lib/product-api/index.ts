/**
 * Adapter selection.
 *
 * VITE_API_BASE_URL present -> HTTP adapter against the authoritative
 * RouteLeak backend. Absent -> clearly labeled demo adapter with sample data.
 * No credentials or endpoints are hardcoded here.
 */
import { createDemoProductApi } from "./demo";
import { createHttpProductApi } from "./http";
import type { ProductApi } from "./types";

let instance: ProductApi | null = null;

export function getProductApi(): ProductApi {
  if (instance) return instance;
  const baseUrl = import.meta.env['VITE_API_BASE_URL'];
  instance =
    typeof baseUrl === "string" && baseUrl.trim().length > 0
      ? createHttpProductApi(baseUrl.trim())
      : createDemoProductApi();
  return instance;
}

export * from "./types";
