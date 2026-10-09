import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-side Supabase client. Uses the anon/publishable key (safe to expose)
 * + cookie session.
 *
 * Defensive: if env vars are missing (e.g. local sandbox before the user wires
 * real Supabase credentials), we fall back to a placeholder URL+key so the
 * client object still initializes. `auth.getSession()` will then resolve to
 * null quickly and the login page renders (instead of the app hanging on a
 * thrown error). Real auth calls will fail with a clear network error until
 * real credentials are set.
 */
const SUPA_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const SUPA_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "placeholder-anon-key";

/** True only when REAL Supabase credentials are set (not empty/placeholder). */
export const isSupabaseConfigured =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY &&
  process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://placeholder.supabase.co" &&
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY !== "placeholder-anon-key";

export const supabaseBrowser = createBrowserClient(SUPA_URL, SUPA_KEY);
