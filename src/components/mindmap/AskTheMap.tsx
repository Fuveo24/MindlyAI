"use client";

import { useState } from "react";
import { useMindMap } from "@/lib/store";
import type { AnalysisResult } from "@/app/api/ai/analyze/route";

const SECTIONS: Array<{
  key: keyof AnalysisResult;
  label: string;
  icon: string;
  color: string;
  emptyMsg: string;
}> = [
  {
    key: "suggestions",
    label: "Suggestions",
    icon: "✦",
    color: "text-accent-glow border-accent-violet/30 bg-accent-violet/5",
    emptyMsg: "No suggestions — plan looks solid.",
  },
  {
    key: "missing_nodes",
    label: "Missing",
    icon: "◎",
    color: "text-amber-300 border-amber-500/30 bg-amber-500/5",
    emptyMsg: "Nothing obviously missing.",
  },
  {
    key: "weak_areas",
    label: "Weak",
    icon: "⚠",
    color: "text-orange-300 border-orange-500/30 bg-orange-500/5",
    emptyMsg: "No weak areas found.",
  },
  {
    key: "contradictions",
    label: "Conflicts",
    icon: "✕",
    color: "text-red-300 border-red-500/30 bg-red-500/5",
    emptyMsg: "No contradictions detected.",
  },
];

interface Props {
  onClose: () => void;
}

export default function AskTheMap({ onClose }: Props) {
  const nodes = useMindMap((s) => s.nodes);
  const edges = useMindMap((s) => s.edges);
  const selectedId = useMindMap((s) => s.selectedId);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<keyof AnalysisResult>("suggestions");

  const run = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodes, edges, selectedId }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as AnalysisResult;
      setResult(data);
      setActiveTab("suggestions");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  const totalIssues = result
    ? result.missing_nodes.length + result.weak_areas.length + result.contradictions.length
    : 0;

  return (
    <div className="pointer-events-auto absolute inset-x-2 bottom-2 z-30 mx-auto max-w-3xl overflow-hidden rounded-2xl border border-border-subtle bg-bg-card/97 shadow-2xl backdrop-blur-md sm:inset-x-4 sm:bottom-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-accent-violet to-accent-indigo text-sm shadow-[0_0_16px_rgba(139,92,246,0.5)] sm:h-8 sm:w-8">
            🧠
          </div>
          <div>
            <h3 className="text-sm font-semibold">Ask the Map</h3>
            <p className="hidden text-[11px] text-text-faint sm:block">
              Claude reads the full graph and critiques it
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg px-2 py-1 text-xs text-text-faint transition-colors hover:text-text-muted"
        >
          ✕
        </button>
      </div>

      {/* Body — max height so it scrolls on small screens */}
      <div className="max-h-[55vh] overflow-y-auto p-4 sm:max-h-[60vh] sm:p-6">
        {!result && !loading && (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <p className="max-w-sm text-sm text-text-muted">
              Claude analyzes your entire map for completeness, weak spots, contradictions, and gives you concrete next steps.
            </p>
            <button
              onClick={run}
              className="rounded-xl border border-accent-violet/40 bg-accent-violet/10 px-6 py-3 text-sm font-medium text-text-primary transition-all hover:bg-accent-violet/20"
            >
              ✦ Analyze my map
            </button>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center gap-3 py-8 text-text-muted">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent-violet border-t-transparent" />
            <span className="text-sm">Claude is reading your graph…</span>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {result && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-xs text-text-faint">
              <span className="font-medium text-accent-glow">
                {result.suggestions.length} suggestion{result.suggestions.length !== 1 ? "s" : ""}
              </span>
              <span>·</span>
              <span>{totalIssues} issue{totalIssues !== 1 ? "s" : ""}</span>
              <button onClick={run} className="ml-auto text-text-faint hover:text-text-muted">
                ↺ Re-analyze
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 rounded-xl border border-border-subtle bg-bg-elevated p-1">
              {SECTIONS.map((s) => {
                const count = result[s.key].length;
                return (
                  <button
                    key={s.key}
                    onClick={() => setActiveTab(s.key)}
                    className={`flex flex-1 items-center justify-center gap-1 rounded-lg px-1.5 py-2 text-[10px] font-medium transition-all sm:gap-1.5 sm:px-3 sm:text-[11px] ${
                      activeTab === s.key
                        ? "bg-bg-card text-text-primary shadow"
                        : "text-text-faint hover:text-text-muted"
                    }`}
                  >
                    <span>{s.icon}</span>
                    <span>{s.label}</span>
                    {count > 0 && (
                      <span className="rounded-full bg-accent-violet/20 px-1 py-0.5 text-[9px] text-accent-glow">
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {SECTIONS.filter((s) => s.key === activeTab).map((section) => {
              const items = result[section.key];
              return (
                <div key={section.key} className="space-y-2">
                  {items.length === 0 ? (
                    <p className="py-3 text-center text-sm text-text-faint">{section.emptyMsg}</p>
                  ) : (
                    items.map((item, i) => (
                      <div key={i} className={`flex items-start gap-2.5 rounded-xl border px-3 py-2.5 sm:px-4 sm:py-3 ${section.color}`}>
                        <span className="mt-0.5 flex-shrink-0 text-xs">{section.icon}</span>
                        <span className="text-sm leading-relaxed">{item}</span>
                      </div>
                    ))
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
