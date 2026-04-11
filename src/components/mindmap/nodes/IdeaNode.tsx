"use client";

import type { NodeProps } from "@xyflow/react";
import type { MindNode } from "@/lib/types";
import NodeShell from "./NodeShell";

export default function IdeaNode({ data, selected }: NodeProps<MindNode>) {
  return (
    <NodeShell
      selected={selected}
      label="Idea"
      accent="from-accent-violet to-accent-indigo"
    >
      <div className="text-sm font-semibold leading-snug text-text-primary">
        {data.title || "New idea"}
      </div>
      {data.description && (
        <div className="mt-2 text-xs leading-relaxed text-text-muted line-clamp-3">
          {data.description}
        </div>
      )}
    </NodeShell>
  );
}
