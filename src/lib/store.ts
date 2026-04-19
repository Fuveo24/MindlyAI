import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type EdgeChange,
  type NodeChange,
} from "@xyflow/react";
import {
  createInitialMap,
  ROOT_NODE_ID,
  type MindEdge,
  type MindNode,
  type MindNodeData,
  type NodeKind,
} from "./types";

interface HistoryEntry {
  nodes: MindNode[];
  edges: MindEdge[];
}

const MAX_HISTORY = 20;

interface MindMapState {
  // Canvas data
  nodes: MindNode[];
  edges: MindEdge[];
  selectedId: string | null;

  // Undo history (snapshots before destructive ops)
  history: HistoryEntry[];
  undo: () => void;

  // Active map metadata (set when opening a cloud map)
  mapId: string | null;
  mapTitle: string;

  // React Flow callbacks
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;

  // CRUD
  addNode: (kind: NodeKind, position: { x: number; y: number }) => string;
  updateNode: (id: string, patch: Partial<MindNodeData>) => void;
  deleteNode: (id: string) => void;

  // Selection
  select: (id: string | null) => void;

  // AI-assisted: add several child nodes linked to a parent
  addAiChildren: (
    parentId: string,
    children: Array<{
      title: string;
      description?: string;
      kind?: string;
      // code-specific fields (only used when kind === "code")
      language?: string;
      code?: string;
    }>,
  ) => void;

  // Load a map from Supabase into the store
  loadMap: (
    mapId: string,
    mapTitle: string,
    nodes: MindNode[],
    edges: MindEdge[],
  ) => void;

  // Build a full map from an AI import result (replaces current canvas)
  loadImport: (
    title: string,
    branches: Array<{
      kind: string;
      title: string;
      description: string;
      children: Array<{ kind: string; title: string; description: string }>;
    }>,
  ) => void;

  // Build a code pipeline from AI-generated code blocks (replaces current canvas, switches to code mode)
  loadCodeImport: (
    title: string,
    blocks: Array<{
      title: string;
      language: string;
      code: string;
      description: string;
    }>,
  ) => void;

  // Canvas mode
  mode: "mindmap" | "code";
  setMode: (mode: "mindmap" | "code") => void;

  // Update just the title
  setMapTitle: (title: string) => void;

  // Reset the whole canvas (keeps mapId if set)
  reset: () => void;
}

let idCounter = 1;
const nextId = () => `n_${Date.now().toString(36)}_${idCounter++}`;

function defaultDataFor(kind: NodeKind, title: string): MindNodeData {
  switch (kind) {
    case "root":
      return { kind, title };
    case "idea":
      return { kind, title };
    case "task":
      return { kind, title, done: false };
    case "budget":
      return { kind, title, amount: 0, currency: "USD" };
    case "place":
      return { kind, title, location: "" };
    case "event":
      return { kind, title, startAt: "", location: "" };
    case "code":
      return { kind, title, language: "javascript", code: "" };
  }
}

export const useMindMap = create<MindMapState>()(
  persist(
    (set, get) => ({
      nodes: createInitialMap().nodes,
      edges: createInitialMap().edges,
      selectedId: null,
      history: [],
      mapId: null,
      mapTitle: "New Project",
      mode: "mindmap" as "mindmap" | "code",

      undo: () => {
        const hist = get().history;
        if (hist.length === 0) return;
        const prev = hist[hist.length - 1];
        set({
          nodes: prev.nodes,
          edges: prev.edges,
          history: hist.slice(0, -1),
          selectedId: null,
        });
      },

      onNodesChange: (changes) =>
        set({ nodes: applyNodeChanges(changes, get().nodes) as MindNode[] }),

      onEdgesChange: (changes) =>
        set({ edges: applyEdgeChanges(changes, get().edges) }),

      onConnect: (connection) =>
        set({
          edges: addEdge({ ...connection, animated: true }, get().edges),
        }),

      addNode: (kind, position) => {
        const id = nextId();
        const node: MindNode = {
          id,
          type: kind,
          position,
          data: defaultDataFor(kind, kind === "root" ? "Project" : "Untitled"),
        };
        set({ nodes: [...get().nodes, node], selectedId: id });
        return id;
      },

      updateNode: (id, patch) =>
        set({
          nodes: get().nodes.map((n) =>
            n.id === id
              ? { ...n, data: { ...n.data, ...patch } as MindNode["data"] }
              : n,
          ),
        }),

      deleteNode: (id) => {
        if (id === ROOT_NODE_ID) return;
        // Snapshot current state before deletion so it can be undone
        const { nodes, edges, history } = get();
        set({
          history: [
            ...history.slice(-MAX_HISTORY + 1),
            { nodes, edges },
          ],
          nodes: nodes.filter((n) => n.id !== id),
          edges: edges.filter((e) => e.source !== id && e.target !== id),
          selectedId: get().selectedId === id ? null : get().selectedId,
        });
      },

      select: (id) => set({ selectedId: id }),

      addAiChildren: (parentId, children) => {
        const parent = get().nodes.find((n) => n.id === parentId);
        if (!parent) return;

        const { x: baseX, y: baseY } = parent.position;
        const radius = 260;
        const validKinds: NodeKind[] = ["idea", "task", "budget", "place", "event", "code"];

        const newNodes: MindNode[] = children.map((c, i) => {
          const angle =
            (Math.PI * 2 * i) / Math.max(children.length, 1) - Math.PI / 2;
          const kind: NodeKind =
            validKinds.includes(c.kind as NodeKind)
              ? (c.kind as NodeKind)
              : "idea";

          const baseData = defaultDataFor(kind, c.title);
          // Merge in description + code-specific fields when provided
          const data: MindNodeData =
            kind === "code"
              ? {
                  ...baseData,
                  description: c.description,
                  language: c.language ?? "javascript",
                  code: c.code ?? "",
                } as MindNodeData
              : { ...baseData, description: c.description } as MindNodeData;

          return {
            id: nextId(),
            type: kind,
            position: {
              x: baseX + Math.cos(angle) * radius,
              y: baseY + Math.sin(angle) * radius,
            },
            data,
          };
        });

        const newEdges: MindEdge[] = newNodes.map((child) => ({
          id: `e_${parentId}_${child.id}`,
          source: parentId,
          target: child.id,
          animated: true,
        }));

        set({
          nodes: [...get().nodes, ...newNodes],
          edges: [...get().edges, ...newEdges],
        });
      },

      loadMap: (mapId, mapTitle, nodes, edges) => {
        const safeNodes = nodes.length > 0 ? nodes : createInitialMap().nodes;
        set({ mapId, mapTitle, nodes: safeNodes, edges, selectedId: null, history: [] });
      },

      loadImport: (title, branches) => {
        const validKinds: NodeKind[] = ["idea", "task", "budget", "place", "event"];
        const toKind = (k: string): NodeKind =>
          validKinds.includes(k as NodeKind) ? (k as NodeKind) : "idea";

        const rootNode: MindNode = {
          id: ROOT_NODE_ID,
          type: "root",
          position: { x: 0, y: 0 },
          data: { kind: "root", title },
          draggable: true,
          deletable: false,
        };

        const newNodes: MindNode[] = [rootNode];
        const newEdges: MindEdge[] = [];

        const branchCount = branches.length;
        branches.forEach((branch, bi) => {
          const bAngle = (Math.PI * 2 * bi) / branchCount - Math.PI / 2;
          const bRadius = 300;
          const bx = Math.cos(bAngle) * bRadius;
          const by = Math.sin(bAngle) * bRadius;
          const bKind = toKind(branch.kind);
          const branchId = nextId();

          newNodes.push({
            id: branchId,
            type: bKind,
            position: { x: bx, y: by },
            data: {
              ...defaultDataFor(bKind, branch.title),
              description: branch.description,
            } as MindNodeData,
          });
          newEdges.push({
            id: `e_root_${branchId}`,
            source: ROOT_NODE_ID,
            target: branchId,
            animated: true,
          });

          const childCount = branch.children.length;
          branch.children.forEach((child, ci) => {
            const spread = Math.PI / 3;
            const cAngle =
              bAngle + (ci - (childCount - 1) / 2) * (spread / Math.max(childCount - 1, 1));
            const cRadius = 220;
            const childId = nextId();
            const cKind = toKind(child.kind);

            newNodes.push({
              id: childId,
              type: cKind,
              position: {
                x: bx + Math.cos(cAngle) * cRadius,
                y: by + Math.sin(cAngle) * cRadius,
              },
              data: {
                ...defaultDataFor(cKind, child.title),
                description: child.description,
              } as MindNodeData,
            });
            newEdges.push({
              id: `e_${branchId}_${childId}`,
              source: branchId,
              target: childId,
              animated: true,
            });
          });
        });

        set({
          nodes: newNodes,
          edges: newEdges,
          selectedId: null,
          mapTitle: title,
          history: [],
        });
      },

      loadCodeImport: (title, blocks) => {
        const STEP_X = 420;

        const newNodes: MindNode[] = blocks.map((block, i) => ({
          id: nextId(),
          type: "code" as NodeKind,
          position: { x: i * STEP_X, y: 0 },
          data: {
            kind: "code" as const,
            title: block.title,
            language: block.language,
            code: block.code,
            description: block.description,
          },
        }));

        const newEdges: MindEdge[] = newNodes.slice(0, -1).map((node, i) => ({
          id: `e_code_${i}`,
          source: node.id,
          target: newNodes[i + 1].id,
          sourceHandle: "out",
          targetHandle: "in",
          type: "smoothstep",
          animated: true,
          style: { stroke: "#22d3ee", strokeWidth: 1.5 },
        }));

        set({
          nodes: newNodes,
          edges: newEdges,
          selectedId: null,
          mapTitle: title,
          mode: "code",
          history: [],
        });
      },

      setMode: (mode) => set({ mode }),

      setMapTitle: (title) => set({ mapTitle: title }),

      reset: () => {
        const fresh = createInitialMap();
        set({
          nodes: fresh.nodes,
          edges: fresh.edges,
          selectedId: null,
          mapTitle: "New Project",
          history: [],
        });
      },
    }),
    {
      name: "mindly-map",
      // Persist canvas data only; history is session-only
      partialize: (state) => ({
        nodes: state.nodes,
        edges: state.edges,
      }),
    },
  ),
);
