import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSupabaseServer } from "@/lib/supabase/server";

/**
 * Supabase Auth callback — handles BOTH Google OAuth redirects and password-
 * reset (recovery) redirects.
 *
 * Flow:
 *   1. Exchange the `code` for a session (sets the auth cookie).
 *   2. Resolve the app `profiles` row for this auth user.
 *      - No profile → the Google account was never registered by an admin.
 *        Sign out + redirect to login with ?error=AccessDenied. We also delete
 *        the orphan auth.users row so the project stays clean.
 *      - Profile exists but role=user and is_active=false → sign out +
 *        redirect with ?error=Inactive.
 *   3. Otherwise redirect to `next` (default "/"); for recovery the
 *      `emailRedirectTo` already points here with next=/?reset=1.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const origin = url.origin;
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") || "/";

  if (!code) {
    return NextResponse.redirect(`${origin}/?error=AuthError`);
  }

  const supabase = await createSupabaseServer();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(`${origin}/?error=AuthError`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${origin}/?error=AuthError`);
  }

  const profile = await db.profile.findUnique({ where: { id: user.id } });

  if (!profile) {
    // Unregistered Google user. Sign them out and clean up the orphan
    // auth.users row using the service-role admin client so they can't
    // linger. (Best-effort; if the service key isn't configured we still
    // sign out.)
    await supabase.auth.signOut();
    try {
      const { createSupabaseAdmin } = await import("@/lib/supabase/admin");
      const admin = createSupabaseAdmin();
      await admin.auth.admin.deleteUser(user.id);
    } catch {
      /* service key not configured — skip cleanup */
    }
    return NextResponse.redirect(`${origin}/?error=AccessDenied`);
  }

  if (profile.role === "user" && !profile.isActive) {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/?error=Inactive`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
