"use client";

import type { NodeProps } from "@xyflow/react";
import type { EventData, MindNode } from "@/lib/types";
import NodeShell from "./NodeShell";

export default function EventNode({ data, selected }: NodeProps<MindNode>) {
  const e = data as EventData;
  return (
    <NodeShell selected={selected} label="Event" accent="from-pink-400 to-fuchsia-500">
      <div className="text-sm font-semibold leading-snug text-text-primary">
        {data.title || "Event"}
      </div>
      <div className="mt-2 flex flex-col gap-1 text-xs text-text-muted">
        {e.startAt && (
          <div className="flex items-center gap-1 text-fuchsia-300">
            <span aria-hidden>🗓</span>
            <span>{new Date(e.startAt).toLocaleString()}</span>
          </div>
        )}
        {e.location && (
          <div className="flex items-center gap-1 text-fuchsia-300/80">
            <span aria-hidden>📍</span>
            <span className="truncate">{e.location}</span>
          </div>
        )}
      </div>
      {data.description && (
        <div className="mt-2 text-xs leading-relaxed text-text-muted line-clamp-2">
          {data.description}
        </div>
      )}
    </NodeShell>
  );
}
