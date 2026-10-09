"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { Session } from "@supabase/supabase-js";

/**
 * Subscribe to the Supabase auth session. Returns:
 *   - status: "loading" | "authenticated" | "unauthenticated"
 *   - session: the Supabase Session | null
 *
 * setState happens inside Supabase callbacks (onAuthStateChange) and a .then
 * chain — never synchronously inside the effect body, so the
 * `react-hooks/set-state-in-effect` lint rule is satisfied.
 */
export function useSupabaseSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabaseBrowser.auth.getSession().then(({ data }) => {
      if (mounted) {
        setSession(data.session);
        setLoading(false);
      }
    });

    const { data: sub } = supabaseBrowser.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return {
    session,
    loading,
    status: loading
      ? "loading"
      : session
        ? "authenticated"
        : "unauthenticated",
  };
}
