import type { MindEdge, MindNode } from "./types";
import { getSupabase } from "./supabase";

export interface MapRecord {
  id: string;
  user_id: string;
  title: string;
  nodes: MindNode[];
  edges: MindEdge[];
  updated_at: string;
}

/**
 * Fetch all maps that belong to the current user.
 */
export async function fetchMaps(): Promise<MapRecord[]> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("maps")
    .select("id, user_id, title, nodes, edges, updated_at")
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as MapRecord[];
}

/**
 * Fetch a single map by id.
 */
export async function fetchMap(id: string): Promise<MapRecord> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("maps")
    .select("id, user_id, title, nodes, edges, updated_at")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Map not found.");
  return data as MapRecord;
}

/**
 * Create a new empty map for the current user. Returns its id.
 */
export async function createMap(title: string): Promise<string> {
  const sb = getSupabase();
  const {
    data: { user },
  } = await sb.auth.getUser();

  if (!user) throw new Error("Not signed in");

  const { data, error } = await sb
    .from("maps")
    .insert({ user_id: user.id, title, nodes: [], edges: [] })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  return (data as { id: string }).id;
}

/**
 * Save (upsert) nodes + edges for an existing map.
 */
export async function saveMap(
  id: string,
  title: string,
  nodes: MindNode[],
  edges: MindEdge[],
): Promise<void> {
  const sb = getSupabase();
  const { error } = await sb
    .from("maps")
    .update({ title, nodes, edges, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(error.message);
}

/**
 * Rename a map.
 */
export async function renameMap(id: string, title: string): Promise<void> {
  const sb = getSupabase();
  const { error } = await sb
    .from("maps")
    .update({ title, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(error.message);
}

/**
 * Permanently delete a map.
 */
export async function deleteMap(id: string): Promise<void> {
  const sb = getSupabase();
  const { error } = await sb.from("maps").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
