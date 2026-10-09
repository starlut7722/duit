import { NextResponse } from "next/server";
import { db } from "./db";
import { createSupabaseServer } from "./supabase/server";
import type { SessionUser } from "@/types";

/**
 * Server-side authorization helpers — the RLS-equivalent layer.
 *
 * Every data API route MUST call `requireUser` or `requireAdmin` and then
 * re-check ownership of the specific resource before any read/mutation.
 *
 * Auth is delegated to Supabase Auth (session cookie). We read the Supabase
 * user, then resolve the matching app `profiles` row. role/isActive come from
 * OUR profile table — never from user input or OAuth claims.
 */

async function resolveSessionUser(): Promise<SessionUser | null> {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const profile = await db.profile.findUnique({
    where: { id: user.id },
  });
  if (!profile) return null;

  return {
    id: profile.id,
    email: profile.email,
    fullName: profile.fullName,
    role: profile.role as "admin" | "user",
    isActive: profile.isActive,
  };
}

export async function requireUser(): Promise<
  { user: SessionUser } | { error: NextResponse }
> {
  const user = await resolveSessionUser();
  if (!user) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  // A deactivated user must be booted even if they hold a stale session.
  if (user.role === "user" && !user.isActive) {
    return {
      error: NextResponse.json(
        { error: "Akun nonaktif. Hubungi admin." },
        { status: 403 }
      ),
    };
  }
  return { user };
}

export async function requireAdmin(): Promise<
  { user: SessionUser } | { error: NextResponse }
> {
  const res = await requireUser();
  if ("error" in res) return res;
  if (res.user.role !== "admin") {
    return {
      error: NextResponse.json(
        { error: "Akses ditolak. Halaman ini hanya untuk admin." },
        { status: 403 }
      ),
    };
  }
  return { user: res.user };
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}
