"use client";

import { useEffect, useState } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { getSupabase } from "./supabase";

/**
 * Returns the current Supabase session user, or null while loading.
 * Subscribes to auth state changes so the component re-renders on
 * sign-in / sign-out.
 */
export function useUser(): { user: User | null; loading: boolean } {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sb = getSupabase();

    sb.auth.getSession().then(({ data }: { data: { session: Session | null } }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = sb.auth.onAuthStateChange((_event: string, session: Session | null) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, loading };
}
