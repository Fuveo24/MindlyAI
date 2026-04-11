"use client";

import type { NodeProps } from "@xyflow/react";
import type { MindNode, PlaceData } from "@/lib/types";
import NodeShell from "./NodeShell";

export default function PlaceNode({ data, selected }: NodeProps<MindNode>) {
  const p = data as PlaceData;
  return (
    <NodeShell selected={selected} label="Place" accent="from-sky-400 to-cyan-500">
      <div className="text-sm font-semibold leading-snug text-text-primary">
        {data.title || "Location"}
      </div>
      {p.location && (
        <div className="mt-2 flex items-center gap-1 text-xs text-sky-300">
          <span aria-hidden>📍</span>
          <span className="truncate">{p.location}</span>
        </div>
      )}
      {data.description && (
        <div className="mt-2 text-xs leading-relaxed text-text-muted line-clamp-2">
          {data.description}
        </div>
      )}
    </NodeShell>
  );
}
