"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { MindNode } from "@/lib/types";

export default function RootNode({ data, selected }: NodeProps<MindNode>) {
  return (
    <div
      className={`
        relative rounded-3xl px-10 py-8
        bg-gradient-to-br from-accent-violet to-accent-indigo
        shadow-[0_0_60px_rgba(139,92,246,0.5)]
        animate-pulse-glow border
        ${selected ? "border-white" : "border-white/20"}
      `}
    >
      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/70">
        Project
      </div>
      <div className="mt-1 max-w-[320px] text-2xl font-semibold leading-tight tracking-tight text-white">
        {data.title || "Untitled project"}
      </div>
      <Handle type="source" position={Position.Bottom} id="s" />
      <Handle type="source" position={Position.Top} id="st" />
      <Handle type="source" position={Position.Left} id="sl" />
      <Handle type="source" position={Position.Right} id="sr" />
    </div>
  );
}
