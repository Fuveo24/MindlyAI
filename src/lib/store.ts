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

interface MindMapState {
  // Canvas data
  nodes: MindNode[];
  edges: MindEdge[];
  selectedId: string | null;

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
    children: Array<{ title: string; description?: string; kind?: string }>,
  ) => void;

  // Load a map from Supabase into the store
  loadMap: (
    mapId: string,
    mapTitle: string,
    nodes: MindNode[],
    edges: MindEdge[],
  ) => void;

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
  }
}

export const useMindMap = create<MindMapState>()(
  persist(
    (set, get) => ({
      nodes: createInitialMap().nodes,
      edges: createInitialMap().edges,
      selectedId: null,
      mapId: null,
      mapTitle: "New Project",

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
        set({
          nodes: get().nodes.filter((n) => n.id !== id),
          edges: get().edges.filter(
            (e) => e.source !== id && e.target !== id,
          ),
          selectedId: get().selectedId === id ? null : get().selectedId,
        });
      },

      select: (id) => set({ selectedId: id }),

      addAiChildren: (parentId, children) => {
        const parent = get().nodes.find((n) => n.id === parentId);
        if (!parent) return;

        const { x: baseX, y: baseY } = parent.position;
        const radius = 260;
        const validKinds: NodeKind[] = ["idea", "task", "budget", "place", "event"];

        const newNodes: MindNode[] = children.map((c, i) => {
          const angle =
            (Math.PI * 2 * i) / Math.max(children.length, 1) - Math.PI / 2;
          const kind: NodeKind =
            validKinds.includes(c.kind as NodeKind)
              ? (c.kind as NodeKind)
              : "idea";
          return {
            id: nextId(),
            type: kind,
            position: {
              x: baseX + Math.cos(angle) * radius,
              y: baseY + Math.sin(angle) * radius,
            },
            data: defaultDataFor(kind, c.title),
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
        set({ mapId, mapTitle, nodes: safeNodes, edges, selectedId: null });
      },

      setMapTitle: (title) => set({ mapTitle: title }),

      reset: () => {
        const fresh = createInitialMap();
        set({
          nodes: fresh.nodes,
          edges: fresh.edges,
          selectedId: null,
          mapTitle: "New Project",
        });
      },
    }),
    {
      name: "mindly-map",
      // Persist the canvas data locally; mapId is resolved from the URL
      partialize: (state) => ({
        nodes: state.nodes,
        edges: state.edges,
      }),
    },
  ),
);
