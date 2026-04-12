"use client";

import { useState } from "react";
import { useMindMap } from "@/lib/store";
import type { ImportResult } from "@/app/api/ai/import/route";

interface Props {
  onClose: () => void;
}

const MAX_CHARS = 50000;

export default function ImportView({ onClose }: Props) {
  const loadImport = useMindMap((s) => s.loadImport);

  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ImportResult | null>(null);

  const charCount = text.length;
  const overLimit = charCount > MAX_CHARS;

  const handleGenerate = async () => {
    if (!text.trim() || overLimit) return;
    setLoading(true);
    setError(null);
    setPreview(null);

    try {
      const res = await fetch("/api/ai/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error ?? "Import failed");
      }
      const result = (await res.json()) as ImportResult;
      setPreview(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (!preview) return;
    loadImport(preview.title, preview.branches);
    onClose();
  };

  return (
    <div className="pointer-events-auto absolute inset-0 z-30 overflow-auto bg-bg-base/97 backdrop-blur-md">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border-subtle bg-bg-base/95 px-4 py-4 backdrop-blur-sm sm:px-8 sm:py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-accent-violet to-accent-indigo text-sm shadow-[0_0_16px_rgba(139,92,246,0.4)] sm:h-8 sm:w-8">
            ⬆
          </div>
          <div>
            <h2 className="text-sm font-semibold">Import Text to Mind Map</h2>
            <p className="hidden text-[11px] text-text-faint sm:block">
              Paste any article, transcript, or notes — Claude extracts the structure
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg border border-border-subtle px-3 py-1.5 text-xs text-text-muted hover:text-text-primary"
        >
          ✕ Close
        </button>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-8 sm:py-10">
        {!preview && (
          <>
            {/* Text input area */}
            <div className="space-y-3">
              <label className="block text-xs font-medium text-text-muted">
                Paste your text below
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={
                  "Paste an article, meeting notes, video transcript, research paper, or any long-form text...\n\nClaude will read it and turn it into an organized mind map."
                }
                rows={14}
                className="w-full resize-y rounded-xl border border-border-subtle bg-bg-card/60 px-4 py-3 text-sm leading-relaxed text-text-primary placeholder:text-text-faint focus:border-accent-violet/50 focus:outline-none focus:ring-1 focus:ring-accent-violet/30"
              />
              <div className="flex items-center justify-between">
                <span
                  className={`text-[11px] ${
                    overLimit ? "text-red-400" : "text-text-faint"
                  }`}
                >
                  {charCount.toLocaleString()} / {MAX_CHARS.toLocaleString()} characters
                  {charCount > 4000 && !overLimit && (
                    <span className="ml-2 text-text-faint">
                      · will chunk into{" "}
                      {Math.ceil(charCount / 3000)} passes
                    </span>
                  )}
                </span>
                <button
                  onClick={handleGenerate}
                  disabled={!text.trim() || overLimit || loading}
                  className="btn-primary disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {loading ? "Analyzing…" : "✦ Generate Mind Map"}
                </button>
              </div>
            </div>

            {/* Loading */}
            {loading && (
              <div className="mt-10 flex flex-col items-center gap-4 text-text-muted">
                <div className="h-7 w-7 animate-spin rounded-full border-2 border-accent-violet border-t-transparent" />
                <span className="text-sm">
                  {charCount > 4000
                    ? "Chunking and extracting key points…"
                    : "Analyzing your text…"}
                </span>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            {/* Tips */}
            {!loading && !error && text.length === 0 && (
              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {[
                  { icon: "📄", label: "Articles & blogs", hint: "Paste any web article or blog post" },
                  { icon: "🎙", label: "Transcripts", hint: "YouTube, podcast, or meeting transcripts" },
                  { icon: "📝", label: "Notes & docs", hint: "Research notes, reports, wiki pages" },
                ].map((tip) => (
                  <div
                    key={tip.label}
                    className="rounded-xl border border-border-subtle bg-bg-card/40 px-4 py-4"
                  >
                    <div className="mb-1.5 text-2xl">{tip.icon}</div>
                    <div className="text-xs font-semibold">{tip.label}</div>
                    <div className="mt-0.5 text-[11px] text-text-faint">{tip.hint}</div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Preview */}
        {preview && !loading && (
          <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-base font-semibold">{preview.title}</h3>
                <p className="mt-0.5 text-xs text-text-faint">
                  {preview.branches.length} branches ·{" "}
                  {preview.branches.reduce((s, b) => s + b.children.length, 0)} leaf nodes
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPreview(null)}
                  className="rounded-lg border border-border-subtle px-3 py-1.5 text-xs text-text-muted hover:text-text-primary"
                >
                  ← Edit text
                </button>
                <button onClick={handleApply} className="btn-primary">
                  ✓ Apply to canvas
                </button>
              </div>
            </div>

            {/* Branch preview cards */}
            <div className="space-y-3">
              {preview.branches.map((branch, bi) => (
                <div
                  key={bi}
                  className="rounded-2xl border border-border-subtle bg-bg-card p-4"
                >
                  <div className="flex items-center gap-2">
                    <KindBadge kind={branch.kind} />
                    <span className="text-sm font-semibold">{branch.title}</span>
                  </div>
                  {branch.description && (
                    <p className="mt-1 text-[11px] text-text-faint">{branch.description}</p>
                  )}
                  {branch.children.length > 0 && (
                    <ul className="mt-3 space-y-1.5 pl-1">
                      {branch.children.map((child, ci) => (
                        <li key={ci} className="flex items-start gap-2">
                          <KindBadge kind={child.kind} dot />
                          <div>
                            <span className="text-xs font-medium">{child.title}</span>
                            {child.description && (
                              <span className="ml-1.5 text-[11px] text-text-faint">
                                — {child.description}
                              </span>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>

            <p className="text-center text-[11px] text-text-faint">
              This will replace your current canvas. Save first if you want to keep it.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

const kindColors: Record<string, string> = {
  idea: "bg-accent-violet/20 text-accent-glow",
  task: "bg-sky-500/20 text-sky-300",
  budget: "bg-emerald-500/20 text-emerald-300",
  place: "bg-amber-500/20 text-amber-300",
  event: "bg-pink-500/20 text-pink-300",
  root: "bg-accent-violet/20 text-accent-glow",
};

function KindBadge({ kind, dot = false }: { kind: string; dot?: boolean }) {
  const cls = kindColors[kind] ?? kindColors.idea;
  if (dot) {
    return (
      <span className={`mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full ${cls.split(" ")[0]}`} />
    );
  }
  return (
    <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${cls}`}>
      {kind}
    </span>
  );
}
