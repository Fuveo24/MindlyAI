"use client";

import { useMindMap } from "@/lib/store";
import type { NodeKind } from "@/lib/types";

const mindmapTools: Array<{ kind: NodeKind; label: string; emoji: string }> = [
  { kind: "idea",   label: "Idea",   emoji: "💡" },
  { kind: "task",   label: "Task",   emoji: "✓"  },
  { kind: "budget", label: "Budget", emoji: "$"  },
  { kind: "place",  label: "Place",  emoji: "📍" },
  { kind: "event",  label: "Event",  emoji: "🗓" },
];

export default function Toolbar() {
  const addNode  = useMindMap((s) => s.addNode);
  const reset    = useMindMap((s) => s.reset);
  const mode     = useMindMap((s) => s.mode);
  const setMode  = useMindMap((s) => s.setMode);

  const handleAdd = (kind: NodeKind) => {
    const jitter = () => (Math.random() - 0.5) * 120;
    addNode(kind, { x: jitter(), y: 180 + jitter() });
  };

  return (
    <div className="pointer-events-auto absolute left-1/2 top-14 z-20 -translate-x-1/2 sm:top-5">
      <div className="flex items-center gap-0.5 rounded-full border border-border-subtle bg-bg-card/80 p-1 backdrop-blur-md shadow-xl sm:gap-1 sm:p-1.5">

        {/* Mode toggle */}
        <div className="flex items-center rounded-full border border-border-subtle bg-bg-base/60 p-0.5">
          <button
            onClick={() => setMode("mindmap")}
            title="Mind map mode"
            className={`rounded-full px-2 py-1.5 text-[10px] font-bold transition-all sm:px-2.5 ${
              mode === "mindmap"
                ? "bg-accent-violet/20 text-accent-glow shadow-[0_0_8px_rgba(139,92,246,0.3)]"
                : "text-text-faint hover:text-text-muted"
            }`}
          >
            🧠
          </button>
          <button
            onClick={() => setMode("code")}
            title="Code mode"
            className={`rounded-full px-2 py-1.5 text-[10px] font-bold transition-all sm:px-2.5 ${
              mode === "code"
                ? "bg-cyan-500/20 text-cyan-300 shadow-[0_0_8px_rgba(34,211,238,0.3)]"
                : "text-text-faint hover:text-text-muted"
            }`}
          >
            {"</>"}
          </button>
        </div>

        <div className="mx-0.5 h-5 w-px bg-border-subtle sm:mx-1" />

        {/* Node type buttons — differ per mode */}
        {mode === "mindmap" ? (
          mindmapTools.map((t) => (
            <button
              key={t.kind}
              onClick={() => handleAdd(t.kind)}
              className="flex items-center gap-1.5 rounded-full px-2.5 py-2 text-xs font-medium text-text-muted transition-all hover:bg-white/10 hover:text-text-primary sm:px-3.5"
              title={`Add ${t.label}`}
            >
              <span className="text-sm" aria-hidden>{t.emoji}</span>
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))
        ) : (
          <button
            onClick={() => handleAdd("code")}
            className="flex items-center gap-1.5 rounded-full px-2.5 py-2 text-xs font-medium text-cyan-400 transition-all hover:bg-cyan-500/10 hover:text-cyan-300 sm:px-3.5"
            title="Add code block"
          >
            <span className="text-sm font-mono" aria-hidden>{"{ }"}</span>
            <span className="hidden sm:inline">Code Block</span>
          </button>
        )}

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
