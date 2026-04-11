"use client";

import type { NodeProps } from "@xyflow/react";
import type { BudgetData, MindNode } from "@/lib/types";
import NodeShell from "./NodeShell";

const currencySymbol = (c?: string) => {
  switch (c) {
    case "EUR":
      return "€";
    case "GBP":
      return "£";
    case "JPY":
      return "¥";
    default:
      return "$";
  }
};

export default function BudgetNode({ data, selected }: NodeProps<MindNode>) {
  const b = data as BudgetData;
  return (
    <NodeShell selected={selected} label="Budget" accent="from-amber-400 to-orange-500">
      <div className="text-sm font-semibold leading-snug text-text-primary">
        {data.title || "Budget item"}
      </div>
      <div className="mt-3 flex items-baseline gap-1">
        <span className="text-xs text-text-faint">{currencySymbol(b.currency)}</span>
        <span className="text-2xl font-bold tracking-tight text-amber-300">
          {(b.amount ?? 0).toLocaleString()}
        </span>
      </div>
      {data.description && (
        <div className="mt-2 text-xs leading-relaxed text-text-muted line-clamp-2">
          {data.description}
        </div>
      )}
    </NodeShell>
  );
}
