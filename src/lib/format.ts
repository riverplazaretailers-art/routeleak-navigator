import type { ExceptionCategory, ExceptionStatus } from "./product-api/types";

export function money(amountMinor: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: amountMinor % 100 === 0 ? 0 : 2,
  }).format(amountMinor / 100);
}

export function shortDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}

export function dateTime(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export const STATUS_LABEL: Record<ExceptionStatus, string> = {
  open: "Open",
  needs_review: "Needs review",
  recovered: "Recovered",
  dismissed: "Dismissed",
};

export const CATEGORY_LABEL: Record<ExceptionCategory, string> = {
  not_invoiced: "Never invoiced",
  underbilled: "Underbilled",
  invoiced_not_collected: "Invoiced, not collected",
  duplicate_visit: "Duplicate visit",
};
