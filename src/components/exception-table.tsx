import { Link } from "@tanstack/react-router";

import { ExceptionStatusBadge } from "@/components/status-badge";
import { CATEGORY_LABEL, money, shortDate } from "@/lib/format";
import type { ExceptionSummary } from "@/lib/product-api";

export function ExceptionTable({
  exceptions,
  currency = "USD",
  caption,
}: {
  exceptions: ExceptionSummary[];
  currency?: string;
  caption: string;
}) {
  return (
    <div className="panel overflow-x-auto">
      <table className="w-full min-w-[46rem] border-collapse text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-border bg-secondary/60 text-left">
            <th scope="col" className="label-caps px-3 py-2 font-semibold">
              Work order
            </th>
            <th scope="col" className="label-caps px-3 py-2 font-semibold">
              Customer
            </th>
            <th scope="col" className="label-caps px-3 py-2 font-semibold">
              Finding
            </th>
            <th scope="col" className="label-caps px-3 py-2 font-semibold">
              Completed
            </th>
            <th scope="col" className="label-caps px-3 py-2 text-right font-semibold">
              Confidence
            </th>
            <th scope="col" className="label-caps px-3 py-2 text-right font-semibold">
              Recoverable
            </th>
            <th scope="col" className="label-caps px-3 py-2 font-semibold">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {exceptions.map((exception) => (
            <tr key={exception.id} className="hover:bg-secondary/40">
              <td className="px-3 py-2">
                <Link
                  to="/exceptions/$exceptionId"
                  params={{ exceptionId: exception.id }}
                  className="num font-medium text-primary underline-offset-2 hover:underline"
                >
                  {exception.workOrderRef}
                </Link>
              </td>
              <td className="max-w-[14rem] truncate px-3 py-2">{exception.customerName}</td>
              <td className="px-3 py-2 text-muted-foreground">
                {CATEGORY_LABEL[exception.category]}
              </td>
              <td className="num px-3 py-2 text-muted-foreground">
                {shortDate(exception.completedAt)}
              </td>
              <td className="num px-3 py-2 text-right text-muted-foreground">
                {exception.confidence}
              </td>
              <td className="num px-3 py-2 text-right font-semibold">
                {money(exception.recoverableAmount, currency)}
              </td>
              <td className="px-3 py-2">
                <ExceptionStatusBadge status={exception.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
