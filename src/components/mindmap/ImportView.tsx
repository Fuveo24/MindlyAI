"use client";

import { useRef, useState, useEffect } from "react";
import { useMindMap } from "@/lib/store";
import type { ImportResult } from "@/app/api/ai/import/route";
import type { CodeImportResult } from "@/app/api/ai/import-code/route";

interface Props {
  onClose: () => void;
}

type Tab = "program" | "photo" | "youtube" | "audio" | "text";

// ---------------------------------------------------------------------------
// Web Speech API type shim
// ---------------------------------------------------------------------------
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}
interface SpeechRecognitionResultList {
  readonly length: number;
  [index: number]: SpeechRecognitionResult;
}
interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  [index: number]: { transcript: string };
}
interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: Event) => void) | null;
  onend: (() => void) | null;
}
declare const SpeechRecognition: new () => ISpeechRecognition;
declare const webkitSpeechRecognition: new () => ISpeechRecognition;

// ---------------------------------------------------------------------------

const MAX_TEXT = 50000;

// Module-level cache — persists across open/close within the same session
let _tab: Tab = "photo";
let _preview: ImportResult | null = null;
let _codePreview: CodeImportResult | null = null;
let _ytUrl = "";
let _text = "";
let _programDesc = "";
let _programLang = "javascript";
let _transcript = "";
let _error: string | null = null;

const CODE_LANGUAGES = [
  { id: "javascript", label: "JavaScript" },
  { id: "typescript", label: "TypeScript" },
  { id: "python", label: "Python" },
  { id: "go", label: "Go" },
  { id: "rust", label: "Rust" },
  { id: "java", label: "Java" },
  { id: "csharp", label: "C#" },
  { id: "cpp", label: "C++" },
  { id: "bash", label: "Bash / Shell" },
  { id: "sql", label: "SQL" },
];

export default function ImportView({ onClose }: Props) {
  const loadImport = useMindMap((s) => s.loadImport);
  const loadCodeImport = useMindMap((s) => s.loadCodeImport);
  const mode = useMindMap((s) => s.mode);

  // Default to "program" in code mode, restore cached tab otherwise
  const [tab, setTab] = useState<Tab>(mode === "code" ? "program" : _tab);

  // Shared result / loading state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(_error);
  const [preview, setPreview] = useState<ImportResult | null>(_preview);

  const reset = () => {
    setError(null); _error = null;
    setPreview(null); _preview = null;
    setLoading(false);
  };

  // ── Program / code generation state ───────────────────────────────────────
  const [programDesc, setProgramDesc] = useState(_programDesc);
  const [programLang, setProgramLang] = useState(_programLang);
  const [codePreview, setCodePreview] = useState<CodeImportResult | null>(_codePreview);

  // ── Photo state ────────────────────────────────────────────────────────
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // ── YouTube state ──────────────────────────────────────────────────────
  const [ytUrl, setYtUrl] = useState(_ytUrl);

  // ── Audio / recording state ────────────────────────────────────────────
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState(_transcript);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const speechSupported = typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  // ── Text state ─────────────────────────────────────────────────────────
  const [text, setText] = useState(_text);

  // Clean up image object URL on unmount / change
  useEffect(() => {
    return () => { if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl); };
  }, [imagePreviewUrl]);

  // ── Handlers ───────────────────────────────────────────────────────────

  function handleImageSelect(file: File) {
    setImageFile(file);
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setImagePreviewUrl(URL.createObjectURL(file));
    reset();
  }

  async function generateProgram() {
    if (!programDesc.trim()) return;
    setLoading(true);
    setError(null); _error = null;
    setCodePreview(null); _codePreview = null;
    setPreview(null); _preview = null;
    try {
      const res = await fetch("/api/ai/import-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: programDesc, language: programLang }),
      });
      const data = await res.json() as { error?: string } & CodeImportResult;
      if (!res.ok) throw new Error(data.error ?? "Code generation failed");
      setCodePreview(data as CodeImportResult);
      _codePreview = data as CodeImportResult;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed";
      setError(msg); _error = msg;
    }
    finally { setLoading(false); }
  }

  function applyCodePreview() {
    if (!codePreview) return;
    loadCodeImport(codePreview.title, codePreview.blocks);
    onClose();
  }

  async function generateFromImage() {
    if (!imageFile) return;
    setLoading(true); setError(null); setPreview(null);
    try {
      const base64 = await fileToBase64(imageFile);
      const mimeType = imageFile.type as "image/jpeg" | "image/png" | "image/gif" | "image/webp";
      const res = await fetch("/api/ai/import-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64, mimeType }),
      });
      const body = await res.json() as { error?: string } & ImportResult;
      if (!res.ok) throw new Error(body.error ?? "Image import failed");
      setPreview(body as ImportResult);
    } catch (e) { setError(e instanceof Error ? e.message : "Failed"); }
    finally { setLoading(false); }
  }

  async function generateFromYouTube() {
    if (!ytUrl.trim()) return;
    setLoading(true);
    setError(null); _error = null;
    setPreview(null); _preview = null;
    try {
      const res = await fetch("/api/ai/import-youtube", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: ytUrl }),
      });
      const data = await res.json() as { error?: string } & ImportResult;
      if (!res.ok) throw new Error(data.error ?? "YouTube import failed");
      setPreview(data as ImportResult);
      _preview = data as ImportResult;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed";
      setError(msg); _error = msg;
    }
    finally { setLoading(false); }
  }

  function startRecording() {
    const Ctor = ("SpeechRecognition" in window ? SpeechRecognition : webkitSpeechRecognition);
    const rec = new Ctor();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";
    let final = "";
    rec.onresult = (e) => {
      let interim = "";
      for (let i = 0; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript + " ";
        else interim += e.results[i][0].transcript;
      }
      setTranscript(final + interim);
      _transcript = final + interim;
    };
    rec.onerror = () => setRecording(false);
    rec.onend = () => setRecording(false);
    rec.start();
    recognitionRef.current = rec;
    setRecording(true);
  }

  function stopRecording() {
    recognitionRef.current?.stop();
    setRecording(false);
  }

  async function generateFromAudio() {
    if (!transcript.trim()) return;
    setLoading(true);
    setError(null); _error = null;
    setPreview(null); _preview = null;
    try {
      const res = await fetch("/api/ai/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: transcript }),
      });
      const data = await res.json() as { error?: string } & ImportResult;
      if (!res.ok) throw new Error(data.error ?? "Import failed");
      setPreview(data as ImportResult);
      _preview = data as ImportResult;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed";
      setError(msg); _error = msg;
    }
    finally { setLoading(false); }
  }

  async function generateFromText() {
    if (!text.trim()) return;
    setLoading(true);
    setError(null); _error = null;
    setPreview(null); _preview = null;
    try {
      const res = await fetch("/api/ai/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json() as { error?: string } & ImportResult;
      if (!res.ok) throw new Error(data.error ?? "Import failed");
      setPreview(data as ImportResult);
      _preview = data as ImportResult;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed";
      setError(msg); _error = msg;
    }
    finally { setLoading(false); }
  }

  function applyPreview() {
    if (!preview) return;
    loadImport(preview.title, preview.branches);
    onClose();
  }

  // ── Tab definitions ────────────────────────────────────────────────────
  const tabs: Array<{ id: Tab; icon: string; label: string }> = [
    { id: "program", icon: "</>", label: "Generate Program" },
    { id: "photo",   icon: "📷",  label: "Photo" },
    { id: "youtube", icon: "▶",   label: "YouTube" },
    { id: "audio",   icon: "🎙",  label: "Record" },
    { id: "text",    icon: "📄",  label: "Text" },
  ];

  return (
    <div className="pointer-events-auto absolute inset-0 z-30 overflow-auto bg-bg-base/97 backdrop-blur-md">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border-subtle bg-bg-base/95 px-4 py-4 backdrop-blur-sm sm:px-8 sm:py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-accent-violet to-accent-indigo text-sm shadow-[0_0_16px_rgba(139,92,246,0.4)] sm:h-8 sm:w-8">
            ⬆
          </div>
          <div>
            <h2 className="text-sm font-semibold">Import to Canvas</h2>
            <p className="hidden text-[11px] text-text-faint sm:block">
              Generate a program chain or import from photo, video, audio, or text
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

      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-8 sm:py-8">
        {/* Tab bar */}
        <div className="mb-6 flex gap-1 rounded-2xl border border-border-subtle bg-bg-card/40 p-1 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); _tab = t.id; reset(); setCodePreview(null); _codePreview = null; }}
              className={`flex flex-shrink-0 flex-1 items-center justify-center gap-1.5 rounded-xl py-2 px-2 text-xs font-medium transition-all ${
                tab === t.id
                  ? t.id === "program"
                    ? "bg-cyan-500/15 text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.2)]"
                    : "bg-accent-violet/15 text-accent-glow shadow-[0_0_12px_rgba(139,92,246,0.2)]"
                  : "text-text-faint hover:text-text-muted"
              }`}
            >
              <span className={t.id === "program" ? "font-mono font-bold text-[10px]" : ""}>{t.icon}</span>
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        {/* ── Generate Program tab ── */}
        {tab === "program" && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-cyan-900/40 bg-[#0d1117]/80 p-5">
              <div className="mb-1 flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-cyan-400">&lt;/&gt;</span>
                <span className="text-xs font-semibold text-cyan-200">AI Code Generator</span>
              </div>
              <p className="mb-4 text-[11px] text-cyan-700">
                Describe a program and Claude will generate a connected chain of code blocks — ready to build on.
              </p>

              {/* Language selector */}
              <div className="mb-3">
                <label className="mb-1 block text-[11px] font-medium text-cyan-600">Language</label>
                <div className="flex flex-wrap gap-1.5">
                  {CODE_LANGUAGES.map((l) => (
                    <button
                      key={l.id}
                      onClick={() => { setProgramLang(l.id); _programLang = l.id; }}
                      className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all ${
                        programLang === l.id
                          ? "bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/40"
                          : "bg-cyan-950/40 text-cyan-700 hover:text-cyan-500"
                      }`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <label className="mb-1 block text-[11px] font-medium text-cyan-600">Program description</label>
              <textarea
                value={programDesc}
                onChange={(e) => { setProgramDesc(e.target.value); _programDesc = e.target.value; }}
                onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) generateProgram(); }}
                placeholder={`Describe the program you want to build…\n\nExamples:\n• "A REST API that fetches weather data and caches it in Redis"\n• "A Python script that reads a CSV, cleans the data, and plots a chart"\n• "A CLI tool that renames files in bulk using regex patterns"`}
                rows={7}
                className="w-full resize-none rounded-xl border border-cyan-900/40 bg-black/40 px-3 py-2.5 text-sm leading-relaxed text-cyan-100 placeholder:text-cyan-900/60 outline-none focus:border-cyan-700/60 focus:ring-1 focus:ring-cyan-700/30"
              />
              <div className="mt-3 flex items-center justify-between">
                <span className="text-[10px] text-cyan-900">Ctrl+Enter to generate</span>
                <button
                  onClick={generateProgram}
                  disabled={!programDesc.trim() || loading}
                  className="rounded-xl bg-cyan-500/20 px-4 py-1.5 text-xs font-semibold text-cyan-300 ring-1 ring-cyan-500/30 transition-all hover:bg-cyan-500/30 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {loading ? "Generating…" : "✦ Generate Program Chain"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Photo tab ── */}
        {tab === "photo" && (
          <div className="space-y-4">
            <input
              ref={photoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageSelect(f); }}
            />
            {!imageFile ? (
              <button
                onClick={() => photoInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const f = e.dataTransfer.files[0];
                  if (f && f.type.startsWith("image/")) handleImageSelect(f);
                }}
                className="flex w-full flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-border-subtle py-16 text-center transition-colors hover:border-accent-violet/40 hover:bg-accent-violet/5"
              >
                <span className="text-4xl">📷</span>
                <div>
                  <p className="text-sm font-medium">Drop a photo here or click to upload</p>
                  <p className="mt-1 text-xs text-text-faint">JPEG, PNG, GIF, WebP · max 10 MB</p>
                </div>
                <span className="rounded-full border border-border-subtle px-4 py-2 text-xs text-text-muted">
                  Choose file
                </span>
              </button>
            ) : (
              <div className="space-y-4">
                <div className="relative overflow-hidden rounded-2xl border border-border-subtle">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imagePreviewUrl!} alt="Preview" className="max-h-72 w-full object-contain bg-bg-card/40" />
                  <button
                    onClick={() => { setImageFile(null); setImagePreviewUrl(null); reset(); }}
                    className="absolute right-2 top-2 rounded-full border border-border-subtle bg-bg-base/80 px-2 py-1 text-xs text-text-muted hover:text-text-primary backdrop-blur-sm"
                  >
                    ✕ Remove
                  </button>
                </div>
                <div className="flex justify-end">
                  <button onClick={generateFromImage} disabled={loading} className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed">
                    {loading ? "Analyzing image…" : "✦ Generate Mind Map"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── YouTube tab ── */}
        {tab === "youtube" && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-border-subtle bg-bg-card/40 p-5">
              <label className="mb-2 block text-xs font-medium text-text-muted">YouTube URL</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={ytUrl}
                  onChange={(e) => { setYtUrl(e.target.value); _ytUrl = e.target.value; }}
                  onKeyDown={(e) => e.key === "Enter" && generateFromYouTube()}
                  className="flex-1 rounded-xl border border-border-subtle bg-bg-base/60 px-3 py-2 text-sm text-text-primary placeholder:text-text-faint focus:border-accent-violet/50 focus:outline-none"
                />
                <button
                  onClick={generateFromYouTube}
                  disabled={!ytUrl.trim() || loading}
                  className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {loading ? "Transcribing…" : "Import"}
                </button>
              </div>
              <p className="mt-2 text-[11px] text-text-faint">
                Works with any public YouTube video under 15 minutes. YouTube auto-generates captions for nearly all English content — no manual subtitles needed.
              </p>
            </div>
          </div>
        )}

        {/* ── Audio / Record tab ── */}
        {tab === "audio" && (
          <div className="space-y-4">
            {!speechSupported ? (
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-4 text-sm text-amber-300">
                Live recording requires Chrome or Edge. Try the Text tab to paste a transcript instead.
              </div>
            ) : (
              <div className="flex flex-col items-center gap-6 rounded-2xl border border-border-subtle bg-bg-card/40 py-10">
                <button
                  onClick={recording ? stopRecording : startRecording}
                  className={`relative flex h-20 w-20 items-center justify-center rounded-full border-2 transition-all ${
                    recording
                      ? "border-red-400 bg-red-500/20 shadow-[0_0_24px_rgba(239,68,68,0.4)]"
                      : "border-accent-violet/50 bg-accent-violet/10 hover:bg-accent-violet/20"
                  }`}
                >
                  {recording && (
                    <span className="absolute h-full w-full animate-ping rounded-full bg-red-400/20" />
                  )}
                  <span className="text-3xl">{recording ? "⏹" : "🎙"}</span>
                </button>

                <p className="text-xs text-text-faint">
                  {recording ? "Recording… tap to stop" : "Tap to start recording"}
                </p>

                {transcript && (
                  <div className="w-full max-w-lg space-y-2 px-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-medium text-text-faint">Transcript</span>
                      <button onClick={() => { setTranscript(""); _transcript = ""; }} className="text-[11px] text-text-faint hover:text-text-muted">
                        Clear
                      </button>
                    </div>
                    <div className="max-h-40 overflow-y-auto rounded-xl border border-border-subtle bg-bg-base/60 px-3 py-2 text-xs leading-relaxed text-text-muted">
                      {transcript}
                    </div>
                    {!recording && (
                      <div className="flex justify-end">
                        <button onClick={generateFromAudio} disabled={loading} className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed">
                          {loading ? "Generating…" : "✦ Generate Mind Map"}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Text tab ── */}
        {tab === "text" && (
          <div className="space-y-3">
            <textarea
              value={text}
              onChange={(e) => { setText(e.target.value); _text = e.target.value; }}
              placeholder={"Paste an article, meeting notes, research paper, or any long-form text…\n\nClaude will read it and turn it into an organized mind map."}
              rows={14}
              className="w-full resize-y rounded-xl border border-border-subtle bg-bg-card/60 px-4 py-3 text-sm leading-relaxed text-text-primary placeholder:text-text-faint focus:border-accent-violet/50 focus:outline-none focus:ring-1 focus:ring-accent-violet/30"
            />
            <div className="flex items-center justify-between">
              <span className={`text-[11px] ${text.length > MAX_TEXT ? "text-red-400" : "text-text-faint"}`}>
                {text.length.toLocaleString()} / {MAX_TEXT.toLocaleString()} chars
                {text.length > 4000 && text.length <= MAX_TEXT && (
                  <span className="ml-2">· {Math.ceil(text.length / 3000)} chunk passes</span>
                )}
              </span>
              <button
                onClick={generateFromText}
                disabled={!text.trim() || text.length > MAX_TEXT || loading}
                className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? "Analyzing…" : "✦ Generate Mind Map"}
              </button>
            </div>
          </div>
        )}

        {/* Shared loading */}
        {loading && (
          <div className="mt-8 flex flex-col items-center gap-3 text-text-muted">
            <div className={`h-6 w-6 animate-spin rounded-full border-2 border-t-transparent ${
              tab === "program" ? "border-cyan-400" : "border-accent-violet"
            }`} />
            <span className="text-xs">
              {tab === "program"
                ? "Claude is writing your program…"
                : tab === "youtube"
                  ? "Fetching transcript and building mind map…"
                  : "Claude is analyzing…"}
            </span>
          </div>
        )}

        {/* Shared error */}
        {error && !loading && (
          <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Code preview */}
        {codePreview && !loading && tab === "program" && (
          <div className="mt-6 space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="font-mono text-base font-semibold text-cyan-100">{codePreview.title}</h3>
                <p className="mt-0.5 text-xs text-cyan-700">
                  {codePreview.blocks.length} code blocks · {codePreview.language}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCodePreview(null)}
                  className="rounded-lg border border-border-subtle px-3 py-1.5 text-xs text-text-muted hover:text-text-primary"
                >
                  ← Retry
                </button>
                <button
                  onClick={applyCodePreview}
                  className="rounded-xl bg-cyan-500/20 px-4 py-1.5 text-xs font-semibold text-cyan-300 ring-1 ring-cyan-500/30 transition-all hover:bg-cyan-500/30"
                >
                  ✓ Add to Code Canvas
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {codePreview.blocks.map((block, i) => (
                <div key={i} className="rounded-2xl border border-cyan-900/40 bg-[#0d1117]/60 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="rounded bg-cyan-500/10 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest text-cyan-400">
                      {block.language}
                    </span>
                    <span className="text-sm font-semibold text-cyan-100">{block.title}</span>
                    {i < codePreview.blocks.length - 1 && (
                      <span className="ml-auto text-xs text-cyan-900">→</span>
                    )}
                  </div>
                  {block.description && (
                    <p className="mb-2 text-[11px] text-cyan-700">{block.description}</p>
                  )}
                  <pre className="max-h-32 overflow-y-auto rounded-lg bg-black/40 p-2.5 text-[10px] leading-relaxed text-cyan-200">
                    <code>{block.code}</code>
                  </pre>
                </div>
              ))}
            </div>

            <p className="text-center text-[11px] text-text-faint">
              This will replace your current canvas and switch to Code Mode.
            </p>
          </div>
        )}

        {/* Mind map preview (Photo / YouTube / Audio / Text) */}
        {preview && !loading && tab !== "program" && (
          <div className="mt-6 space-y-4">
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
                  onClick={() => { setPreview(null); _preview = null; }}
                  className="rounded-lg border border-border-subtle px-3 py-1.5 text-xs text-text-muted hover:text-text-primary"
                >
                  ← Retry
                </button>
                <button onClick={applyPreview} className="btn-primary">
                  ✓ Apply to canvas
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {preview.branches.map((branch, bi) => (
                <div key={bi} className="rounded-2xl border border-border-subtle bg-bg-card p-4">
                  <div className="flex items-center gap-2">
                    <KindBadge kind={branch.kind} />
                    <span className="text-sm font-semibold">{branch.title}</span>
                  </div>
                  {branch.description && (
                    <p className="mt-1 text-[11px] text-text-faint">{branch.description}</p>
                  )}
                  <ul className="mt-2.5 space-y-1.5 pl-1">
                    {branch.children.map((child, ci) => (
                      <li key={ci} className="flex items-start gap-2">
                        <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-text-faint/60" />
                        <span className="text-xs text-text-muted">
                          <KindBadge kind={child.kind} dot />
                          {" "}{child.title}
                          {child.description && (
                            <span className="ml-1 text-text-faint">— {child.description}</span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <p className="text-center text-[11px] text-text-faint">
              This will replace your current canvas. Save first if needed.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const kindColors: Record<string, string> = {
  idea:   "bg-accent-violet/20 text-accent-glow",
  task:   "bg-sky-500/20 text-sky-300",
  budget: "bg-emerald-500/20 text-emerald-300",
  place:  "bg-amber-500/20 text-amber-300",
  event:  "bg-pink-500/20 text-pink-300",
};

function KindBadge({ kind, dot = false }: { kind: string; dot?: boolean }) {
  const cls = kindColors[kind] ?? kindColors.idea;
  if (dot) {
    return <span className={`inline-block h-1.5 w-1.5 rounded-full ${cls.split(" ")[0]} mr-0.5`} />;
  }
  return (
    <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${cls}`}>
      {kind}
    </span>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
