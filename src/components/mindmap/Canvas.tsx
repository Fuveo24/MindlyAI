"use client";

import {
  Background,
  BackgroundVariant,
  Controls,
  ReactFlow,
  ReactFlowProvider,
  type NodeMouseHandler,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback, useState } from "react";
import Link from "next/link";
import { useMindMap } from "@/lib/store";
import { saveMap } from "@/lib/maps";
import { exportMarkdown } from "@/lib/export";
import { nodeTypes } from "./nodes";
import Toolbar from "./Toolbar";
import NodeEditor from "./NodeEditor";
import AskTheMap from "./AskTheMap";
import TimelineView from "./TimelineView";
import CostEstimator from "./CostEstimator";

type Panel = "ask" | "cost" | null;

function CanvasInner() {
  const nodes = useMindMap((s) => s.nodes);
  const edges = useMindMap((s) => s.edges);
  const mapId = useMindMap((s) => s.mapId);
  const mapTitle = useMindMap((s) => s.mapTitle);
  const setMapTitle = useMindMap((s) => s.setMapTitle);
  const onNodesChange = useMindMap((s) => s.onNodesChange);
  const onEdgesChange = useMindMap((s) => s.onEdgesChange);
  const onConnect = useMindMap((s) => s.onConnect);
  const select = useMindMap((s) => s.select);

  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [panel, setPanel] = useState<Panel>(null);
  const [timelineOpen, setTimelineOpen] = useState(false);

  const handleNodeClick: NodeMouseHandler = useCallback(
    (_e, node) => select(node.id),
    [select],
  );
  const handlePaneClick = useCallback(() => select(null), [select]);
  const togglePanel = (p: Panel) => setPanel((prev) => (prev === p ? null : p));

  const handleSave = async () => {
    if (!mapId) return;
    setSaveStatus("saving");
    try {
      await saveMap(mapId, mapTitle, nodes, edges);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  };

  const handleExport = () => exportMarkdown(nodes, edges, mapTitle);

  const saveLabel =
    saveStatus === "saving" ? "Saving…"
    : saveStatus === "saved" ? "✓ Saved"
    : saveStatus === "error" ? "Error"
    : "Save";

  return (
    <>
      {/* ── Back link — top-left ── */}
      <Link
        href="/maps"
        className="pointer-events-auto absolute left-3 top-3 z-20 flex items-center gap-1.5 rounded-full border border-border-subtle bg-bg-card/80 px-3 py-2 text-xs font-medium text-text-muted backdrop-blur-sm transition-colors hover:text-text-primary sm:left-5 sm:top-5 sm:px-4"
      >
        <span aria-hidden>←</span>
        <span className="hidden sm:inline">Maps</span>
      </Link>

      {/* ── Map title — top-center ── */}
      <div className="pointer-events-auto absolute left-1/2 top-3 z-20 -translate-x-1/2 sm:top-5">
        {editingTitle ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setMapTitle(titleDraft);
              setEditingTitle(false);
            }}
          >
            <input
              autoFocus
              className="w-36 rounded-full border border-accent-violet/40 bg-bg-card/80 px-3 py-2 text-xs font-semibold text-text-primary outline-none backdrop-blur-sm sm:w-52"
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={() => { setMapTitle(titleDraft); setEditingTitle(false); }}
            />
          </form>
        ) : (
          <button
            onClick={() => { setTitleDraft(mapTitle); setEditingTitle(true); }}
            className="flex items-center gap-2 rounded-full border border-border-subtle bg-bg-card/80 px-3 py-2 backdrop-blur-sm transition-colors hover:border-accent-violet/40"
          >
            <div className="h-2 w-2 flex-shrink-0 rounded-full bg-accent-violet shadow-[0_0_8px_rgba(139,92,246,0.8)]" />
            <span className="max-w-[110px] truncate text-xs font-semibold sm:max-w-[220px]">
              {mapTitle}
            </span>
            <span className="text-[10px] text-text-faint">✎</span>
          </button>
        )}
      </div>

      {/* ── Save button — top-right ── */}
      {mapId && (
        <button
          onClick={handleSave}
          disabled={saveStatus === "saving"}
          className={`pointer-events-auto absolute right-3 top-3 z-20 rounded-full border px-3 py-2 text-xs font-medium backdrop-blur-sm transition-all disabled:opacity-50 sm:right-5 sm:top-5 sm:px-4 ${
            saveStatus === "saved"
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
              : saveStatus === "error"
              ? "border-red-500/40 bg-red-500/10 text-red-300"
              : "border-border-subtle bg-bg-card/80 text-text-muted hover:text-text-primary"
          }`}
        >
          <span className="sm:hidden">{saveStatus === "saved" ? "✓" : saveStatus === "error" ? "!" : "💾"}</span>
          <span className="hidden sm:inline">{saveLabel}</span>
        </button>
      )}

      {/* ── Node-type toolbar ── */}
      <Toolbar />

      {/* ── Right / bottom: node editor ── */}
      <NodeEditor />

      {/* ── Bottom-left: global tools ── */}
      <div className="pointer-events-auto absolute bottom-14 left-3 z-20 flex flex-col gap-1.5 sm:bottom-5 sm:left-5 sm:flex-row sm:gap-2">
        <MapToolButton active={panel === "ask"} onClick={() => togglePanel("ask")} icon="🧠" label="Ask the Map" />
        <MapToolButton active={timelineOpen} onClick={() => setTimelineOpen(true)} icon="🗓" label="Timeline" />
        <MapToolButton active={panel === "cost"} onClick={() => togglePanel("cost")} icon="💸" label="Costs" />
        <MapToolButton active={false} onClick={handleExport} icon="⬇" label="Export" />
      </div>

      {/* ── Panels ── */}
      {panel === "ask" && <AskTheMap onClose={() => setPanel(null)} />}
      {panel === "cost" && <CostEstimator onClose={() => setPanel(null)} />}
      {timelineOpen && <TimelineView onClose={() => setTimelineOpen(false)} />}

      {/* ── Canvas ── */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.4 }}
        minZoom={0.2}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={28} size={1.5} color="#1f1f2e" />
        <Controls position="bottom-right" showInteractive={false} />
      </ReactFlow>
    </>
  );
}

function MapToolButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`flex items-center justify-center gap-1.5 rounded-full border px-2.5 py-2 text-xs font-medium backdrop-blur-sm transition-all sm:px-3.5 ${
        active
          ? "border-accent-violet/50 bg-accent-violet/15 text-accent-glow shadow-[0_0_12px_rgba(139,92,246,0.3)]"
          : "border-border-subtle bg-bg-card/80 text-text-muted hover:text-text-primary"
      }`}
    >
      <span className="text-sm sm:text-base">{icon}</span>
      <span className="hidden lg:inline">{label}</span>
    </button>
  );
}

export default function Canvas() {
  return (
    <ReactFlowProvider>
      <CanvasInner />
    </ReactFlowProvider>
  );
}
