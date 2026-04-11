"use client";

import { Handle, Position } from "@xyflow/react";
import type { ReactNode } from "react";

interface NodeShellProps {
  selected?: boolean;
  accent?: string; // tailwind color class, e.g. "from-accent-violet to-accent-indigo"
  label?: string; // top-left tag label
  children: ReactNode;
  hideSourceHandle?: boolean;
  hideTargetHandle?: boolean;
}

/**
 * Shared chrome for every custom node type. Keeps styling consistent
 * and centralizes the connection handles.
 */
export default function NodeShell({
  selected,
  accent = "from-accent-violet/40 to-accent-indigo/40",
  label,
  children,
  hideSourceHandle,
  hideTargetHandle,
}: NodeShellProps) {
  return (
    <div
      className={`
        relative min-w-[220px] max-w-[280px] rounded-2xl border
        bg-bg-card/90 backdrop-blur-sm transition-all
        ${selected
          ? "border-accent-violet shadow-[0_0_30px_rgba(139,92,246,0.4)]"
          : "border-border-subtle hover:border-border-strong"}
      `}
    >
      {/* Accent bar */}
      <div
        className={`absolute inset-x-0 top-0 h-[2px] rounded-t-2xl bg-gradient-to-r ${accent}`}
      />

      {label && (
        <div className="flex items-center gap-2 px-4 pt-3">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-text-faint">
            {label}
          </span>
        </div>
      )}

      <div className="p-4">{children}</div>

      {!hideTargetHandle && (
        <Handle type="target" position={Position.Top} id="t" />
      )}
      {!hideSourceHandle && (
        <Handle type="source" position={Position.Bottom} id="s" />
      )}
    </div>
  );
}
