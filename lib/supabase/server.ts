import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Server-side Supabase client (anon/publishable key + cookie session). Use in
 * Route Handlers / Server Components via `supabase.auth.getUser()`. Never has
 * the service-role key → bound by RLS.
 *
 * Defensive: falls back to a placeholder URL+key if env missing so the server
 * never throws at import time. Auth calls will simply report no user.
 */
const SUPA_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const SUPA_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "placeholder-anon-key";

export async function createSupabaseServer() {
  const cookieStore = await cookies();
  return createServerClient(SUPA_URL, SUPA_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // setAll can be called from a Server Component where cookies are
          // read-only. The proxy refreshes the session instead.
        }
      },
    },
  });
}
