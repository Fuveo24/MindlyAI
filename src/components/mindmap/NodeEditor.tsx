"use client";

import { useState } from "react";
import { useMindMap } from "@/lib/store";
import type {
  BudgetData,
  EventData,
  MindNodeData,
  PlaceData,
  TaskData,
  TaskPriority,
  TaskStatus,
} from "@/lib/types";
import { PERSONAS, type Persona } from "@/lib/personas";

export default function NodeEditor() {
  const selectedId = useMindMap((s) => s.selectedId);
  const node = useMindMap((s) =>
    s.nodes.find((n) => n.id === s.selectedId) ?? null,
  );
  const updateNode = useMindMap((s) => s.updateNode);
  const deleteNode = useMindMap((s) => s.deleteNode);
  const addAiChildren = useMindMap((s) => s.addAiChildren);

  const [loadingExpand, setLoadingExpand] = useState(false);
  const [loadingGenerate, setLoadingGenerate] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [instruction, setInstruction] = useState("");
  const [persona, setPersona] = useState<Persona>("default");

  if (!node || !selectedId) return null;
  const data = node.data as MindNodeData;
  const patch = (p: Partial<MindNodeData>) => updateNode(selectedId, p);

  // --- Default expand ---
  const runExpand = async () => {
    setLoadingExpand(true);
    setAiError(null);
    try {
      const res = await fetch("/api/ai/expand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.title,
          description: data.description ?? "",
          kind: data.kind,
          persona,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const json = (await res.json()) as {
        children: Array<{ title: string; description?: string }>;
      };
      addAiChildren(selectedId, json.children ?? []);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoadingExpand(false);
    }
  };

  // --- Custom instruction ---
  const runGenerate = async () => {
    if (!instruction.trim()) return;
    setLoadingGenerate(true);
    setAiError(null);
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instruction,
          parentTitle: data.title,
          parentKind: data.kind,
          persona,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const json = (await res.json()) as {
        nodes: Array<{ title: string; description?: string; kind?: string }>;
      };
      addAiChildren(selectedId, json.nodes ?? []);
      setInstruction("");
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoadingGenerate(false);
    }
  };

  const kindLabel: Record<MindNodeData["kind"], string> = {
    root: "Project Root",
    idea: "Idea",
    task: "Task",
    budget: "Budget",
    place: "Place",
    event: "Event",
    code: "Code Block",
  };

  const busy = loadingExpand || loadingGenerate;

  return (
    <aside className="
      pointer-events-auto z-20 overflow-y-auto border-border-subtle bg-bg-card/95 shadow-2xl backdrop-blur-md
      fixed bottom-0 left-0 right-0 max-h-[72vh] rounded-t-2xl border-t px-4 py-4
      md:absolute md:bottom-5 md:left-auto md:right-5 md:top-5 md:max-h-none md:w-[340px] md:rounded-2xl md:border md:p-5
    ">
      {/* Mobile drag handle */}
      <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border-strong md:hidden" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="eyebrow">{kindLabel[data.kind]}</div>
        {data.kind !== "root" && (
          <button
            onClick={() => deleteNode(selectedId)}
            className="text-[11px] font-medium text-text-faint transition-colors hover:text-red-400"
          >
            Delete
          </button>
        )}
      </div>

      {/* Core fields */}
      <div className="mt-5 space-y-4">
        <Field label="Title">
          <input
            className="input"
            value={data.title}
            onChange={(e) => patch({ title: e.target.value })}
          />
        </Field>

        {data.kind !== "root" && (
          <Field label="Description">
            <textarea
              className="input min-h-[80px] resize-y"
              placeholder="Add a few sentences…"
              value={data.description ?? ""}
              onChange={(e) => patch({ description: e.target.value })}
            />
          </Field>
        )}

        {data.kind === "task" && <TaskFields data={data} set={patch} />}
        {data.kind === "budget" && <BudgetFields data={data} set={patch} />}
        {data.kind === "place" && <PlaceFields data={data} set={patch} />}
        {data.kind === "event" && <EventFields data={data} set={patch} />}
      </div>

      {/* AI section */}
      <div className="mt-6 border-t border-border-subtle pt-5 space-y-4">
        {/* Section label */}
        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent-glow">
          AI Assist
        </div>

        {/* Persona selector */}
        <div>
          <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-text-faint">
            Perspective
          </label>
          <div className="flex flex-wrap gap-1.5">
            {PERSONAS.map((p) => (
              <button
                key={p.id}
                onClick={() => setPersona(p.id)}
                className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium transition-all ${
                  persona === p.id
                    ? `${p.color} bg-white/5`
                    : "border-border-subtle text-text-faint hover:border-border-strong"
                }`}
                title={p.systemPrompt.slice(0, 80)}
              >
                <span>{p.icon}</span>
                <span>{p.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Default expand */}
        <button
          disabled={busy}
          onClick={runExpand}
          className="w-full rounded-xl border border-accent-violet/40 bg-accent-violet/10 px-4 py-3 text-sm font-medium text-text-primary transition-all hover:bg-accent-violet/20 disabled:opacity-50"
        >
          {loadingExpand ? "Thinking…" : "✦ Expand with Claude"}
        </button>

        <p className="text-[11px] leading-relaxed text-text-faint">
          Claude reads this node and adds 3 linked child ideas through the selected perspective.
        </p>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border-subtle" />
          <span className="text-[10px] font-medium uppercase tracking-widest text-text-faint">
            or
          </span>
          <div className="h-px flex-1 bg-border-subtle" />
        </div>

        {/* Instruction input */}
        <div className="space-y-2">
          <label className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-text-faint">
            Custom instruction
          </label>
          <textarea
            className="input min-h-[72px] resize-y text-[13px]"
            placeholder={`e.g. "give me 4 tasks to prepare the launch" or "suggest budget items for a dev team"`}
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) runGenerate();
            }}
          />
          <button
            disabled={busy || !instruction.trim()}
            onClick={runGenerate}
            className="w-full rounded-xl border border-fuchsia-500/30 bg-fuchsia-500/10 px-4 py-3 text-sm font-medium text-fuchsia-200 transition-all hover:bg-fuchsia-500/20 disabled:opacity-40"
          >
            {loadingGenerate ? "Generating…" : "✦ Generate nodes"}
          </button>
          <p className="text-[11px] leading-relaxed text-text-faint">
            Tell Claude what to create — it picks types and links everything. ⌘↵ to submit.
          </p>
        </div>

        {aiError && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-400">
            {aiError}
          </div>
        )}
      </div>

      <style jsx>{`
        :global(.input) {
          width: 100%;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid #1c1c2a;
          color: #ffffff;
          border-radius: 10px;
          padding: 10px 12px;
          font-size: 13px;
          outline: none;
          transition: border-color 0.15s, background 0.15s;
        }
        :global(.input:focus) {
          border-color: #8b5cf6;
          background: rgba(139, 92, 246, 0.06);
        }
        :global(.input::placeholder) {
          color: #5a5a75;
        }
      `}</style>
    </aside>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-text-faint">
        {label}
      </div>
      {children}
    </label>
  );
}

function TaskFields({
  data,
  set,
}: {
  data: TaskData;
  set: (p: Partial<MindNodeData>) => void;
}) {
  const statusOptions: TaskStatus[] = ["todo", "doing", "done"];
  const priorityOptions: TaskPriority[] = ["low", "med", "high"];

  const priorityColors: Record<TaskPriority, string> = {
    low: "border-sky-500/40 bg-sky-500/10 text-sky-300",
    med: "border-amber-500/40 bg-amber-500/10 text-amber-300",
    high: "border-red-500/40 bg-red-500/10 text-red-300",
  };

  return (
    <>
      {/* Status toggle */}
      <Field label="Status">
        <div className="flex gap-1.5">
          {statusOptions.map((s) => (
            <button
              key={s}
              onClick={() => set({ status: s, done: s === "done" })}
              className={`flex-1 rounded-lg border py-1.5 text-[11px] font-medium capitalize transition-all ${
                (data.status ?? "todo") === s
                  ? "border-accent-violet/40 bg-accent-violet/15 text-accent-glow"
                  : "border-border-subtle text-text-faint hover:border-border-strong"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </Field>

      {/* Priority */}
      <Field label="Priority">
        <div className="flex gap-1.5">
          {priorityOptions.map((p) => (
            <button
              key={p}
              onClick={() => set({ priority: data.priority === p ? undefined : p })}
              className={`flex-1 rounded-lg border py-1.5 text-[11px] font-medium uppercase tracking-wide transition-all ${
                data.priority === p
                  ? priorityColors[p]
                  : "border-border-subtle text-text-faint hover:border-border-strong"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </Field>

      {/* Progress slider */}
      <Field label={`Progress — ${data.progress ?? 0}%`}>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={data.progress ?? 0}
          onChange={(e) => set({ progress: Number(e.target.value) })}
          className="w-full accent-accent-violet"
        />
      </Field>

      {/* Due date */}
      <Field label="Due date">
        <input
          type="date"
          className="input"
          value={data.dueAt?.slice(0, 10) ?? ""}
          onChange={(e) =>
            set({
              dueAt: e.target.value
                ? new Date(e.target.value).toISOString()
                : undefined,
            })
          }
        />
      </Field>
    </>
  );
}

function BudgetFields({
  data,
  set,
}: {
  data: BudgetData;
  set: (p: Partial<MindNodeData>) => void;
}) {
  return (
    <div className="grid grid-cols-[1fr_90px] gap-2">
      <Field label="Amount">
        <input
          type="number"
          className="input"
          value={data.amount ?? 0}
          onChange={(e) => set({ amount: Number(e.target.value) })}
        />
      </Field>
      <Field label="Currency">
        <select
          className="input"
          value={data.currency ?? "USD"}
          onChange={(e) => set({ currency: e.target.value })}
        >
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
          <option value="GBP">GBP</option>
          <option value="JPY">JPY</option>
        </select>
      </Field>
    </div>
  );
}

function PlaceFields({
  data,
  set,
}: {
  data: PlaceData;
  set: (p: Partial<MindNodeData>) => void;
}) {
  return (
    <Field label="Location">
      <input
        className="input"
        placeholder="City, address, or place"
        value={data.location ?? ""}
        onChange={(e) => set({ location: e.target.value })}
      />
    </Field>
  );
}

function EventFields({
  data,
  set,
}: {
  data: EventData;
  set: (p: Partial<MindNodeData>) => void;
}) {
  return (
    <>
      <Field label="Starts at">
        <input
          type="datetime-local"
          className="input"
          value={data.startAt?.slice(0, 16) ?? ""}
          onChange={(e) =>
            set({
              startAt: e.target.value
                ? new Date(e.target.value).toISOString()
                : undefined,
            })
          }
        />
      </Field>
      <Field label="Location">
        <input
          className="input"
          placeholder="Where is it happening?"
          value={data.location ?? ""}
          onChange={(e) => set({ location: e.target.value })}
        />
      </Field>
    </>
  );
}
