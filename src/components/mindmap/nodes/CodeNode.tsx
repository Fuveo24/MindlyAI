"use client";

import { useRef } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { MindNode } from "@/lib/types";
import { useMindMap } from "@/lib/store";

const LANGUAGES = [
  { id: "javascript", label: "JS" },
  { id: "typescript", label: "TS" },
  { id: "python", label: "PY" },
  { id: "go", label: "GO" },
  { id: "rust", label: "RS" },
  { id: "sql", label: "SQL" },
  { id: "bash", label: "SH" },
  { id: "html", label: "HTML" },
  { id: "css", label: "CSS" },
  { id: "json", label: "JSON" },
];

const LANG_COLORS: Record<string, string> = {
  javascript: "text-yellow-300 bg-yellow-500/10",
  typescript: "text-blue-300 bg-blue-500/10",
  python: "text-sky-300 bg-sky-500/10",
  go: "text-cyan-300 bg-cyan-500/10",
  rust: "text-orange-300 bg-orange-500/10",
  sql: "text-purple-300 bg-purple-500/10",
  bash: "text-green-300 bg-green-500/10",
  html: "text-red-300 bg-red-500/10",
  css: "text-pink-300 bg-pink-500/10",
  json: "text-amber-300 bg-amber-500/10",
};

export default function CodeNode({ id, data, selected }: NodeProps<MindNode>) {
  const updateNode = useMindMap((s) => s.updateNode);
  const taRef = useRef<HTMLTextAreaElement>(null);

  if (data.kind !== "code") return null;

  const langColor = LANG_COLORS[data.language] ?? "text-cyan-300 bg-cyan-500/10";

  const handleTabKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const ta = e.currentTarget;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const newCode = data.code.slice(0, start) + "  " + data.code.slice(end);
      updateNode(id, { code: newCode });
      // Restore cursor after React re-renders
      requestAnimationFrame(() => {
        if (taRef.current) {
          taRef.current.selectionStart = taRef.current.selectionEnd = start + 2;
        }
      });
    }
  };

  return (
    <div
      className={`
        relative w-[320px] rounded-2xl border bg-[#0d1117] backdrop-blur-sm transition-all font-mono
        ${selected
          ? "border-cyan-400/60 shadow-[0_0_28px_rgba(34,211,238,0.25)]"
          : "border-cyan-900/60 hover:border-cyan-700/60"}
      `}
    >
      {/* Top accent bar */}
      <div className="absolute inset-x-0 top-0 h-[2px] rounded-t-2xl bg-gradient-to-r from-cyan-400 to-teal-400" />

      {/* Header row */}
      <div className="flex items-center gap-2 px-3 pt-3 pb-2">
        {/* Language badge */}
        <select
          className={`nodrag nopan rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-widest border-0 outline-none cursor-pointer ${langColor}`}
          style={{ background: "transparent" }}
          value={data.language}
          onChange={(e) => updateNode(id, { language: e.target.value })}
        >
          {LANGUAGES.map((l) => (
            <option key={l.id} value={l.id} className="bg-[#0d1117] text-white">
              {l.label}
            </option>
          ))}
        </select>

        {/* Title */}
        <input
          className="nodrag nopan flex-1 min-w-0 bg-transparent text-xs font-semibold text-cyan-100 placeholder:text-cyan-900 outline-none border-b border-transparent focus:border-cyan-700/60 transition-colors"
          placeholder="function name…"
          value={data.title}
          onChange={(e) => updateNode(id, { title: e.target.value })}
        />

        {/* Grip indicator */}
        <span className="text-[10px] text-cyan-900 select-none">⠿</span>
      </div>

      {/* Code area */}
      <div className="mx-3 mb-3 overflow-hidden rounded-lg border border-cyan-900/40 bg-black/40">
        <textarea
          ref={taRef}
          className="nodrag nopan w-full resize-none bg-transparent p-2.5 text-[11px] leading-relaxed text-cyan-50 placeholder:text-cyan-900/60 outline-none"
          placeholder={"// write your code here\n"}
          value={data.code}
          rows={Math.min(Math.max(data.code.split("\n").length, 3), 16)}
          onChange={(e) => updateNode(id, { code: e.target.value })}
          onKeyDown={handleTabKey}
          spellCheck={false}
        />
      </div>

      {/* Optional description */}
      {(selected || data.description) && (
        <div className="mx-3 mb-3">
          <input
            className="nodrag nopan w-full bg-transparent text-[11px] text-cyan-600 placeholder:text-cyan-900 outline-none"
            placeholder="// add a note…"
            value={data.description ?? ""}
            onChange={(e) => updateNode(id, { description: e.target.value })}
          />
        </div>
      )}

      {/* I/O labels */}
      <div className="flex items-center justify-between px-3 pb-2.5 text-[9px] font-semibold uppercase tracking-widest text-cyan-900">
        <span>▶ input</span>
        <span>output ▶</span>
      </div>

      {/* Left handle = target (receives) */}
      <Handle
        type="target"
        position={Position.Left}
        id="in"
        style={{ background: "#22d3ee", border: "2px solid #0d1117", width: 10, height: 10 }}
      />

      {/* Right handle = source (sends) */}
      <Handle
        type="source"
        position={Position.Right}
        id="out"
        style={{ background: "#2dd4bf", border: "2px solid #0d1117", width: 10, height: 10 }}
      />
    </div>
  );
}
