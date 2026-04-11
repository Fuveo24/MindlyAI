"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from "@/lib/auth";
import {
  fetchMaps,
  createMap,
  renameMap,
  deleteMap,
  type MapRecord,
} from "@/lib/maps";
import { getSupabase } from "@/lib/supabase";

export default function MapsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useUser();
  const [maps, setMaps] = useState<MapRecord[]>([]);
  const [loadingMaps, setLoadingMaps] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) router.push("/auth/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    fetchMaps()
      .then(setMaps)
      .catch((e) => setError(e.message))
      .finally(() => setLoadingMaps(false));
  }, [user]);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const id = await createMap("Untitled map");
      router.push(`/mindmap/${id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create map");
      setCreating(false);
    }
  };

  const handleRename = async (id: string) => {
    const title = renameValue.trim();
    if (!title) return;
    try {
      await renameMap(id, title);
      setMaps((prev) =>
        prev.map((m) => (m.id === id ? { ...m, title } : m)),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to rename");
    } finally {
      setRenamingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this map? This cannot be undone.")) return;
    try {
      await deleteMap(id);
      setMaps((prev) => prev.filter((m) => m.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete");
    }
  };

  const handleSignOut = async () => {
    await getSupabase().auth.signOut();
    router.push("/");
  };

  if (authLoading || !user) return null;

  return (
    <div className="relative min-h-screen bg-bg-base">
      {/* Ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-glow-radial opacity-50"
      />

      <div className="relative z-10 mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Header */}
        <header className="flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-7 w-7 flex-shrink-0 rounded-lg bg-gradient-to-br from-accent-violet to-accent-indigo shadow-[0_0_20px_rgba(139,92,246,0.5)]" />
            <span className="text-sm font-semibold">+ Mindly</span>
          </Link>

          <div className="flex items-center gap-3">
            <span className="hidden max-w-[160px] truncate text-xs text-text-faint sm:block">
              {user.email}
            </span>
            <button
              onClick={handleSignOut}
              className="text-xs text-text-muted transition-colors hover:text-text-primary"
            >
              Sign out
            </button>
          </div>
        </header>

        {/* Page title + new map */}
        <div className="mt-8 flex flex-wrap items-start justify-between gap-3 sm:mt-12">
          <div>
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              Your maps
            </h1>
            <p className="mt-1 text-sm text-text-muted">
              {maps.length === 0 && !loadingMaps
                ? "No maps yet — create your first one."
                : `${maps.length} map${maps.length !== 1 ? "s" : ""}`}
            </p>
          </div>
          <button
            onClick={handleCreate}
            disabled={creating}
            className="btn-primary flex-shrink-0 disabled:opacity-50"
          >
            {creating ? "Creating…" : "+ New map"}
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Maps grid */}
        {loadingMaps ? (
          <div className="mt-16 flex justify-center text-sm text-text-faint">
            Loading maps…
          </div>
        ) : maps.length === 0 ? (
          <EmptyState onCreate={handleCreate} creating={creating} />
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {maps.map((map) => (
              <MapCard
                key={map.id}
                map={map}
                renamingId={renamingId}
                renameValue={renameValue}
                onOpen={() => router.push(`/mindmap/${map.id}`)}
                onStartRename={() => {
                  setRenamingId(map.id);
                  setRenameValue(map.title);
                }}
                onRenameChange={setRenameValue}
                onRenameSubmit={() => handleRename(map.id)}
                onRenameCancel={() => setRenamingId(null)}
                onDelete={() => handleDelete(map.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MapCard({
  map,
  renamingId,
  renameValue,
  onOpen,
  onStartRename,
  onRenameChange,
  onRenameSubmit,
  onRenameCancel,
  onDelete,
}: {
  map: MapRecord;
  renamingId: string | null;
  renameValue: string;
  onOpen: () => void;
  onStartRename: () => void;
  onRenameChange: (v: string) => void;
  onRenameSubmit: () => void;
  onRenameCancel: () => void;
  onDelete: () => void;
}) {
  const isRenaming = renamingId === map.id;
  const nodeCount = map.nodes.length;
  const updated = new Date(map.updated_at).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="card group relative flex flex-col overflow-hidden rounded-2xl p-4 transition-all duration-200 hover:border-accent-violet/40 hover:-translate-y-0.5 sm:p-6">
      {/* Accent bar */}
      <div className="absolute inset-x-0 top-0 h-[2px] rounded-t-2xl bg-gradient-to-r from-accent-violet to-accent-indigo" />

      {/* Title */}
      {isRenaming ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onRenameSubmit();
          }}
          className="flex gap-2"
        >
          <input
            autoFocus
            className="flex-1 rounded-lg border border-accent-violet/40 bg-bg-elevated px-3 py-1.5 text-sm text-text-primary outline-none"
            value={renameValue}
            onChange={(e) => onRenameChange(e.target.value)}
          />
          <button
            type="submit"
            className="rounded-lg bg-accent-violet/20 px-3 py-1.5 text-xs font-medium text-accent-glow"
          >
            Save
          </button>
          <button
            type="button"
            onClick={onRenameCancel}
            className="rounded-lg px-2 py-1.5 text-xs text-text-faint hover:text-text-muted"
          >
            ✕
          </button>
        </form>
      ) : (
        <h3 className="truncate text-base font-semibold tracking-tight">
          {map.title}
        </h3>
      )}

      {/* Meta */}
      <div className="mt-2 flex items-center gap-3 text-xs text-text-faint">
        <span>{nodeCount} node{nodeCount !== 1 ? "s" : ""}</span>
        <span>·</span>
        <span>Updated {updated}</span>
      </div>

      {/* Actions */}
      <div className="mt-4 flex items-center gap-2 sm:mt-5">
        <button
          onClick={onOpen}
          className="flex-1 rounded-xl border border-accent-violet/20 bg-accent-violet/10 py-2.5 text-xs font-medium text-accent-glow transition-colors hover:bg-accent-violet/20 sm:py-2"
        >
          Open
        </button>
        <button
          onClick={onStartRename}
          className="rounded-xl border border-border-subtle px-3 py-2 text-xs text-text-faint transition-colors hover:text-text-muted"
          title="Rename"
        >
          ✎
        </button>
        <button
          onClick={onDelete}
          className="rounded-xl border border-border-subtle px-3 py-2 text-xs text-text-faint transition-colors hover:border-red-500/40 hover:text-red-400"
          title="Delete"
        >
          🗑
        </button>
      </div>
    </div>
  );
}

function EmptyState({
  onCreate,
  creating,
}: {
  onCreate: () => void;
  creating: boolean;
}) {
  return (
    <div className="mt-24 flex flex-col items-center text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-border-subtle bg-bg-card text-2xl">
        ⬡
      </div>
      <h2 className="text-lg font-semibold">No maps yet</h2>
      <p className="mt-2 max-w-xs text-sm text-text-muted">
        Create your first mind map and start turning ideas into structure.
      </p>
      <button
        onClick={onCreate}
        disabled={creating}
        className="btn-primary mt-8 disabled:opacity-50"
      >
        {creating ? "Creating…" : "+ Create your first map"}
      </button>
    </div>
  );
}
