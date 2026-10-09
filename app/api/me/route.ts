import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser, jsonError } from "@/lib/auth-guard";
import { createSupabaseServer } from "@/lib/supabase/server";
import { updateProfileSchema, changePasswordSchema } from "@/lib/validators";

/** GET /api/me — current user's profile. */
export async function GET() {
  const res = await requireUser();
  if ("error" in res) return res.error;

  const profile = await db.profile.findUnique({
    where: { id: res.user.id },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });
  if (!profile) return jsonError("Profil tidak ditemukan", 404);

  // Derive auth-linkage info from the Supabase user (never store it ourselves).
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const identities = user?.identities ?? [];
  const hasGoogle = identities.some((i) => i.provider === "google");
  const hasEmail = identities.some((i) => i.provider === "email");
  // hasPassword: an email identity with a password set. Supabase exposes no
  // direct "has password" flag; an email identity implies the user can sign in
  // with email + password (true after password create or email signup).
  const hasPassword = hasEmail;

  return NextResponse.json({
    ...profile,
    hasPassword,
    googleConnected: hasGoogle,
  });
}

/** PATCH /api/me — update full name only. role/isActive are never updated. */
export async function PATCH(req: Request) {
  const res = await requireUser();
  if ("error" in res) return res.error;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Body tidak valid");
  }

  const parsed = updateProfileSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Data tidak valid");
  }

  await db.profile.update({
    where: { id: res.user.id },
    data: { fullName: parsed.data.fullName },
  });

  return NextResponse.json({ ok: true });
}

/**
 * POST /api/me — change password (for accounts that ALREADY have a password).
 * Delegates to Supabase Auth (`auth.updateUser`). We do NOT verify the old
 * password ourselves — Supabase requires a valid session, which the user has.
 * If the account has no password yet (Google-only), use
 * POST /api/me/create-password instead.
 */
export async function POST(req: Request) {
  const res = await requireUser();
  if ("error" in res) return res.error;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Body tidak valid");
  }

  const parsed = changePasswordSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Data tidak valid");
  }

  const supabase = await createSupabaseServer();
  const { error: updError } = await supabase.auth.updateUser({
    password: parsed.data.newPassword,
  });
  if (updError) {
    return jsonError(updError.message || "Gagal mengubah password");
  }

  return NextResponse.json({ ok: true });
}
