"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchMap } from "@/lib/maps";
import { useMindMap } from "@/lib/store";
import { useUser } from "@/lib/auth";
import Canvas from "@/components/mindmap/Canvas";

/**
 * Loads a specific map from Supabase by id, then renders the canvas.
 * The map data is injected into the Zustand store via `loadMap`.
 */
export default function MapPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { user, loading: authLoading } = useUser();
  const loadMap = useMindMap((s) => s.loadMap);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Guard against duplicate fetches from React StrictMode / multiple auth events
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login");
      return;
    }
    if (!user) return;
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    fetchMap(id)
      .then((map) => {
        loadMap(map.id, map.title, map.nodes, map.edges);
        setReady(true);
      })
      .catch((e) => setError(e.message));
  }, [id, user, authLoading, loadMap, router]);

  if (authLoading || !user) return null;

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-base text-sm text-red-400">
        {error}
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-base text-sm text-text-faint">
        Loading map…
      </div>
    );
  }

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-bg-base">
      <Canvas />
    </main>
  );
}
