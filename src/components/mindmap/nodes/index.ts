import RootNode from "./RootNode";
import IdeaNode from "./IdeaNode";
import TaskNode from "./TaskNode";
import BudgetNode from "./BudgetNode";
import PlaceNode from "./PlaceNode";
import EventNode from "./EventNode";

/**
 * The map we pass to React Flow's `nodeTypes` prop. Keys match the
 * `type` field on each node in the store, values are the components.
 */
export const nodeTypes = {
  root: RootNode,
  idea: IdeaNode,
  task: TaskNode,
  budget: BudgetNode,
  place: PlaceNode,
  event: EventNode,
};
