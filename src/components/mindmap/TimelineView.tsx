"use client";

import { useState } from "react";
import { useMindMap } from "@/lib/store";
import type { TimelineResult } from "@/app/api/ai/timeline/route";

interface Props {
  onClose: () => void;
}

const phaseColors = [
  "from-accent-violet to-accent-indigo",
  "from-sky-400 to-cyan-500",
  "from-emerald-400 to-teal-500",
  "from-amber-400 to-orange-500",
  "from-pink-400 to-fuchsia-500",
  "from-rose-400 to-red-500",
];

// Module-level cache — persists across open/close within the same session
let _result: TimelineResult | null = null;
let _error: string | null = null;

export default function TimelineView({ onClose }: Props) {
  const nodes = useMindMap((s) => s.nodes);
  const mapTitle = useMindMap((s) => s.mapTitle);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TimelineResult | null>(_result);
  const [error, setError] = useState<string | null>(_error);

  const generate = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    _result = null;
    _error = null;
    try {
      const res = await fetch("/api/ai/timeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodes }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as TimelineResult;
      setResult(data);
      _result = data;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed";
      setError(msg);
      _error = msg;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pointer-events-auto absolute inset-0 z-30 overflow-auto bg-bg-base/97 backdrop-blur-md">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border-subtle bg-bg-base/95 px-4 py-4 backdrop-blur-sm sm:px-8 sm:py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-accent-violet to-accent-indigo text-sm shadow-[0_0_16px_rgba(139,92,246,0.4)] sm:h-8 sm:w-8">
            🗓
          </div>
          <div>
            <h2 className="text-sm font-semibold">
              {result?.title ?? mapTitle ?? "Timeline"}
            </h2>
            <p className="hidden text-[11px] text-text-faint sm:block">
              AI-generated execution roadmap
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {result && (
            <button
              onClick={generate}
              className="text-xs text-text-faint hover:text-text-muted"
              title="Regenerate"
            >
              ↺ Regenerate
            </button>
          )}
          <button
            onClick={onClose}
            className="rounded-lg border border-border-subtle px-3 py-1.5 text-xs text-text-muted hover:text-text-primary"
          >
            ✕ Close
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-10">
        {/* Empty state */}
        {!result && !loading && (
          <div className="flex flex-col items-center gap-4 py-16 text-center sm:py-20">
            <div className="text-4xl">🗓</div>
            <h3 className="text-lg font-semibold sm:text-xl">Convert map to roadmap</h3>
            <p className="max-w-md px-4 text-sm text-text-muted">
              Claude reads all your nodes and turns them into a phased, week-by-week execution plan.
            </p>
            {error && (
              <div className="max-w-md rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}
            <button onClick={generate} className="btn-primary mt-2">
              ✦ Generate timeline
            </button>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center gap-4 py-16 text-text-muted">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-accent-violet border-t-transparent" />
            <span className="text-sm">Claude is building your roadmap…</span>
          </div>
        )}

        {result && (
          <div className="space-y-8">
            {result.summary && (
              <p className="max-w-2xl text-sm leading-relaxed text-text-muted">
                {result.summary}
              </p>
            )}

            {/* Mobile: vertical stack */}
            <div className="block lg:hidden space-y-3">
              {result.phases.map((phase, i) => (
                <PhaseCard key={i} phase={phase} index={i} />
              ))}
            </div>

            {/* Desktop: horizontal with connector track */}
            <div className="relative hidden lg:block">
              <div className="absolute left-0 right-0 top-5 h-px bg-gradient-to-r from-transparent via-accent-violet/40 to-transparent" />
              <div
                className="relative grid gap-4"
                style={{
                  gridTemplateColumns: `repeat(${result.phases.length}, minmax(0, 1fr))`,
                }}
              >
                {result.phases.map((phase, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <div
                      className={`relative z-10 mb-5 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br text-xs font-bold text-white shadow-[0_0_16px_rgba(139,92,246,0.4)] ${phaseColors[i % phaseColors.length]}`}
                    >
                      {i + 1}
                    </div>
                    <div className="w-full">
                      <PhaseCard phase={phase} index={i} compact />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PhaseCard({
  phase,
  index,
  compact = false,
}: {
  phase: { label: string; focus: string; items: string[] };
  index: number;
  compact?: boolean;
}) {
  return (
    <div className={`w-full rounded-2xl border border-border-subtle bg-bg-card transition-all duration-200 hover:border-accent-violet/30 hover:-translate-y-0.5 ${compact ? "p-4" : "p-5"}`}>
      <div
        className={`mb-1 h-[2px] w-6 rounded-full bg-gradient-to-r ${phaseColors[index % phaseColors.length]}`}
      />
      {!compact && (
        <div className={`mb-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br text-xs font-bold text-white lg:hidden ${phaseColors[index % phaseColors.length]}`}>
          {index + 1}
        </div>
      )}
      <h4 className="text-sm font-semibold leading-tight">{phase.label}</h4>
      <p className="mt-1 text-[11px] leading-relaxed text-text-faint">{phase.focus}</p>
      <ul className="mt-3 space-y-1.5">
        {phase.items.map((item, j) => (
          <li key={j} className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent-violet/60" />
            <span className="text-xs leading-relaxed text-text-muted">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
