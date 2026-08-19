import { FlaskConical } from "lucide-react";

import { getProductApi } from "@/lib/product-api";

/**
 * Explicit, unmissable label for the demo adapter. Sample figures are
 * illustrative only and are never presented as customer results.
 */
export function DemoNotice({ compact = false }: { compact?: boolean }) {
  const api = getProductApi();
  if (!api.isDemo) return null;

  return (
    <div
      className="flex items-start gap-2 border-b border-warning/40 bg-warning/12 px-4 py-2 text-xs text-foreground"
      role="note"
    >
      <FlaskConical className="mt-0.5 size-3.5 shrink-0" aria-hidden />
      <p>
        <span className="font-semibold">Sample account — demo data.</span>{" "}
        {compact
          ? "Figures are illustrative, not customer results."
          : "Figures are fabricated to illustrate the workflow. They are not customer results or proof of recovery. Real analysis runs in the secure RouteLeak workspace."}
      </p>
    </div>
  );
}

export function AdapterTag() {
  const api = getProductApi();
  return <span className="label-caps whitespace-nowrap">{api.adapterLabel}</span>;
}
