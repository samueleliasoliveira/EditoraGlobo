import { formatCurrency, formatNumber, cn } from "@/lib/utils";
import type { ReactNode } from "react";

type Props = {
  label: string;
  value: number;
  format?: "currency" | "number";
  icon?: ReactNode;
  accent?: "blue" | "green" | "purple" | "orange";
};

const accents = {
  blue: "from-blue-50 to-blue-100 text-blue-700 border-blue-100",
  green: "from-emerald-50 to-emerald-100 text-emerald-700 border-emerald-100",
  purple: "from-violet-50 to-violet-100 text-violet-700 border-violet-100",
  orange: "from-amber-50 to-amber-100 text-amber-700 border-amber-100",
};

export function StatCard({ label, value, format = "number", icon, accent = "blue" }: Props) {
  const formatted = format === "currency" ? formatCurrency(value) : formatNumber(value);
  return (
    <div className={cn(
      "rounded-2xl border bg-gradient-to-br p-4 sm:p-5 shadow-sm",
      accents[accent],
    )}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide opacity-80">{label}</p>
          <p className="mt-2 text-2xl sm:text-3xl font-bold tabular-nums">{formatted}</p>
        </div>
        {icon ? <div className="opacity-80">{icon}</div> : null}
      </div>
    </div>
  );
}
