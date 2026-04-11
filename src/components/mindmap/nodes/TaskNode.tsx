"use client";

import type { NodeProps } from "@xyflow/react";
import type { MindNode, TaskData } from "@/lib/types";
import NodeShell from "./NodeShell";

const statusStyles = {
  todo: "bg-border-strong text-text-faint",
  doing: "bg-accent-violet/20 text-accent-glow",
  done: "bg-emerald-400/15 text-emerald-300",
};

const priorityDot = {
  low: "bg-sky-400",
  med: "bg-amber-400",
  high: "bg-red-400",
};

export default function TaskNode({ data, selected }: NodeProps<MindNode>) {
  const t = data as TaskData;
  const status = t.status ?? (t.done ? "done" : "todo");
  const progress = t.progress ?? (status === "done" ? 100 : 0);

  return (
    <NodeShell selected={selected} label="Task" accent="from-emerald-400 to-teal-500">
      <div className="flex items-start gap-3">
        {/* Checkbox / done indicator */}
        <div
          className={`mt-0.5 h-4 w-4 flex-shrink-0 rounded border ${
            status === "done"
              ? "border-emerald-400 bg-emerald-400/20"
              : "border-border-strong"
          }`}
        />

        <div className="flex-1 min-w-0">
          {/* Title */}
          <div
            className={`text-sm font-semibold leading-snug ${
              status === "done" ? "line-through text-text-faint" : "text-text-primary"
            }`}
          >
            {data.title || "New task"}
          </div>

          {/* Description */}
          {data.description && (
            <div className="mt-1 text-xs leading-relaxed text-text-muted line-clamp-2">
              {data.description}
            </div>
          )}

          {/* Badges row */}
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {/* Status badge */}
            <span
              className={`inline-flex items-center rounded-md px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${statusStyles[status]}`}
            >
              {status}
            </span>

            {/* Priority dot + label */}
            {t.priority && (
              <span className="flex items-center gap-1 text-[10px] text-text-faint">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${priorityDot[t.priority]}`}
                />
                {t.priority}
              </span>
            )}

            {/* Due date */}
            {t.dueAt && (
              <span className="inline-flex items-center rounded-md bg-emerald-400/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-300">
                Due {new Date(t.dueAt).toLocaleDateString()}
              </span>
            )}
          </div>

          {/* Progress bar */}
          {progress > 0 && (
            <div className="mt-2.5">
              <div className="h-1 w-full overflow-hidden rounded-full bg-border-strong">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 transition-all duration-300"
                  style={{ width: `${Math.min(100, progress)}%` }}
                />
              </div>
              <div className="mt-1 text-[9px] text-text-faint">{progress}% complete</div>
            </div>
          )}
        </div>
      </div>
    </NodeShell>
  );
}
