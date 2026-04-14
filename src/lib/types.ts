import type { Node, Edge } from "@xyflow/react";

/**
 * Node kinds supported by the mind map. The `root` kind is special:
 * exactly one exists per map, at the center, and holds the project title.
 */
export type NodeKind =
  | "root"
  | "idea"
  | "task"
  | "budget"
  | "place"
  | "event"
  | "code";

/**
 * React Flow requires node data to extend Record<string, unknown>.
 * We intersect each shape with that so the types plug in cleanly.
 */
type WithIndex = Record<string, unknown>;

export type RootData = {
  kind: "root";
  title: string;
  description?: string;
} & WithIndex;

export type IdeaData = {
  kind: "idea";
  title: string;
  description?: string;
} & WithIndex;

export type TaskStatus = "todo" | "doing" | "done";
export type TaskPriority = "low" | "med" | "high";

export type TaskData = {
  kind: "task";
  title: string;
  description?: string;
  dueAt?: string;
  done?: boolean;
  status?: TaskStatus;
  priority?: TaskPriority;
  progress?: number; // 0–100
} & WithIndex;

export type BudgetData = {
  kind: "budget";
  title: string;
  description?: string;
  amount?: number;
  currency?: string;
} & WithIndex;

export type PlaceData = {
  kind: "place";
  title: string;
  description?: string;
  location?: string;
} & WithIndex;

export type EventData = {
  kind: "event";
  title: string;
  description?: string;
  startAt?: string;
  location?: string;
} & WithIndex;

export type CodeData = {
  kind: "code";
  title: string;
  language: string;
  code: string;
  description?: string;
} & WithIndex;

export type MindNodeData =
  | RootData
  | IdeaData
  | TaskData
  | BudgetData
  | PlaceData
  | EventData
  | CodeData;

export type MindNode = Node<MindNodeData, NodeKind>;
export type MindEdge = Edge;

export const ROOT_NODE_ID = "root";

/** A fresh starting map — one root node in the center. */
export function createInitialMap(projectTitle = "New Project"): {
  nodes: MindNode[];
  edges: MindEdge[];
} {
  const root: MindNode = {
    id: ROOT_NODE_ID,
    type: "root",
    position: { x: 0, y: 0 },
    data: {
      kind: "root",
      title: projectTitle,
    },
    draggable: true,
    deletable: false,
  };
  return { nodes: [root], edges: [] };
}
