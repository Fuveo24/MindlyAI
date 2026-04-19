"use client";

import { useState } from "react";
import { useMindMap } from "@/lib/store";
import type { CostResult } from "@/app/api/ai/costs/route";

const DOMAINS = [
  { value: "", label: "Auto-detect" },
  { value: "startup", label: "Startup" },
  { value: "app", label: "App / SaaS" },
  { value: "travel", label: "Travel" },
  { value: "event", label: "Event" },
];

interface Props {
  onClose: () => void;
}

function fmt(n: number) {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

// Module-level cache — persists across open/close within the same session
let _result: CostResult | null = null;
let _error: string | null = null;
let _domain = "";

export default function CostEstimator({ onClose }: Props) {
  const nodes = useMindMap((s) => s.nodes);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CostResult | null>(_result);
  const [error, setError] = useState<string | null>(_error);
  const [domain, setDomain] = useState(_domain);

  const changeDomain = (v: string) => {
    setDomain(v);
    _domain = v;
  };

  const run = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    _result = null;
    _error = null;
    try {
      const res = await fetch("/api/ai/costs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodes, domain: domain || undefined }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as CostResult;
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

  const maxHigh = result
    ? Math.max(...result.breakdown.map((b) => b.high), 1)
    : 1;

  return (
    <div className="pointer-events-auto absolute inset-x-2 bottom-2 z-30 mx-auto max-w-2xl overflow-hidden rounded-2xl border border-border-subtle bg-bg-card/97 shadow-2xl backdrop-blur-md sm:inset-x-4 sm:bottom-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 text-sm shadow-[0_0_16px_rgba(251,191,36,0.4)] sm:h-8 sm:w-8">
            💸
          </div>
          <div>
            <h3 className="text-sm font-semibold">Cost Estimator</h3>
            <p className="hidden text-[11px] text-text-faint sm:block">
              Financial analyst breakdown from your nodes
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg px-2 py-1 text-xs text-text-faint hover:text-text-muted"
        >
          ✕
        </button>
      </div>

      {/* Body */}
      <div className="max-h-[55vh] overflow-y-auto p-4 sm:max-h-[60vh] sm:p-6">
        {!result && !loading && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <label className="text-xs font-medium text-text-faint">Domain</label>
              <select
                value={domain}
                onChange={(e) => changeDomain(e.target.value)}
                className="rounded-lg border border-border-subtle bg-bg-elevated px-3 py-1.5 text-xs text-text-primary outline-none focus:border-accent-violet/40"
              >
                {DOMAINS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}
            <button
              onClick={run}
              className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-5 py-3 text-sm font-medium text-amber-200 transition-all hover:bg-amber-500/20"
            >
              💸 Estimate costs
            </button>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center gap-3 py-8 text-text-muted">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
            <span className="text-sm">Analyzing project costs…</span>
          </div>
        )}

        {result && (
          <div className="space-y-5">
            {/* Total */}
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 sm:p-5">
              <p className="text-xs font-medium text-amber-300/60">Estimated total</p>
              <div className="mt-1 flex flex-wrap items-baseline gap-2">
                <span className="text-2xl font-bold tracking-tight text-amber-300 sm:text-3xl">
                  {fmt(result.total_low)}
                </span>
                <span className="text-base text-amber-300/60 sm:text-lg">—</span>
                <span className="text-2xl font-bold tracking-tight text-amber-300 sm:text-3xl">
                  {fmt(result.total_high)}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-text-faint">Approximate range</p>
            </div>

            {/* Breakdown */}
            <div className="space-y-3">
              <h4 className="text-[11px] font-semibold uppercase tracking-widest text-text-faint">
                Breakdown
              </h4>
              {result.breakdown.map((item, i) => (
                <div key={i}>
                  <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-sm text-text-primary">{item.item}</span>
                    <span className="flex-shrink-0 text-xs text-text-faint">
                      {fmt(item.low)} – {fmt(item.high)}
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-border-strong">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500"
                      style={{ width: `${(item.high / maxHigh) * 100}%` }}
                    />
                  </div>
                  {item.notes && (
                    <p className="mt-0.5 text-[10px] text-text-faint">{item.notes}</p>
                  )}
                </div>
              ))}
            </div>

            {/* Hidden costs */}
            {result.hidden_costs.length > 0 && (
              <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-4">
                <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-orange-300">
                  ⚠ Hidden costs
                </h4>
                <ul className="space-y-1.5">
                  {result.hidden_costs.map((c, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-text-muted">
                      <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-orange-400/60" />
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Assumptions */}
            {result.assumptions.length > 0 && (
              <div>
                <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-text-faint">
                  Assumptions
                </h4>
                <ul className="space-y-1">
                  {result.assumptions.map((a, i) => (
                    <li key={i} className="text-xs text-text-faint">
                      {i + 1}. {a}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <button
              onClick={run}
              className="text-xs text-text-faint hover:text-text-muted"
            >
              ↺ Re-estimate
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
