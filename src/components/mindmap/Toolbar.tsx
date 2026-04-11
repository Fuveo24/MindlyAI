"use client";

import { useMindMap } from "@/lib/store";
import type { NodeKind } from "@/lib/types";

const tools: Array<{ kind: NodeKind; label: string; emoji: string }> = [
  { kind: "idea", label: "Idea", emoji: "💡" },
  { kind: "task", label: "Task", emoji: "✓" },
  { kind: "budget", label: "Budget", emoji: "$" },
  { kind: "place", label: "Place", emoji: "📍" },
  { kind: "event", label: "Event", emoji: "🗓" },
];

export default function Toolbar() {
  const addNode = useMindMap((s) => s.addNode);
  const reset = useMindMap((s) => s.reset);

  const handleAdd = (kind: NodeKind) => {
    const jitter = () => (Math.random() - 0.5) * 120;
    addNode(kind, { x: jitter(), y: 180 + jitter() });
  };

  return (
    /* Center-anchored, capped so it never overflows the viewport */
    <div className="pointer-events-auto absolute left-1/2 top-14 z-20 -translate-x-1/2 sm:top-5">
      <div className="flex items-center gap-0.5 rounded-full border border-border-subtle bg-bg-card/80 p-1 backdrop-blur-md shadow-xl sm:gap-1 sm:p-1.5">
        {tools.map((t) => (
          <button
            key={t.kind}
            onClick={() => handleAdd(t.kind)}
            className="flex items-center gap-1.5 rounded-full px-2.5 py-2 text-xs font-medium text-text-muted transition-all hover:bg-white/10 hover:text-text-primary sm:px-3.5"
            title={`Add ${t.label}`}
          >
            <span className="text-sm" aria-hidden>{t.emoji}</span>
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
        <div className="mx-0.5 h-5 w-px bg-border-subtle sm:mx-1" />
        <button
          onClick={reset}
          className="rounded-full px-2.5 py-2 text-xs font-medium text-text-muted transition-colors hover:bg-red-500/10 hover:text-red-300 sm:px-3.5"
          title="Reset canvas"
        >
          <span className="sm:hidden">↺</span>
          <span className="hidden sm:inline">Reset</span>
        </button>
      </div>
    </div>
  );
}
