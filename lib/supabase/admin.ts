import { createClient } from "@supabase/supabase-js";

/**
 * SERVICE-ROLE Supabase client. Server-only. NEVER import this in a client
 * component or expose the key to the browser.
 *
 * Used for admin operations that bypass RLS:
 *   - admin.auth.admin.createUser / deleteUser (user management)
 *
 * All app-data reads/writes still go through Prisma with server-side ownership
 * checks (the RLS-equivalent), so this client is only for auth admin tasks.
 */
export function createSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY (and NEXT_PUBLIC_SUPABASE_URL) must be set for admin operations."
    );
  }
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
