import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, jsonError } from "@/lib/auth-guard";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { createUserSchema } from "@/lib/validators";
import { MAX_ACTIVE_USERS } from "@/lib/config";

function serialize(p: {
  id: string;
  email: string;
  fullName: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
}) {
  return {
    id: p.id,
    email: p.email,
    fullName: p.fullName,
    role: p.role,
    isActive: p.isActive,
    createdAt: p.createdAt.toISOString(),
  };
}

/** GET /api/admin/users — list all profiles (admin only). */
export async function GET() {
  const res = await requireAdmin();
  if ("error" in res) return res.error;

  const profiles = await db.profile.findMany({
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });
  return NextResponse.json(profiles.map(serialize));
}

/**
 * POST /api/admin/users — create a new regular user (admin only).
 *
 * 1. Enforce MAX_ACTIVE_USERS when isActive === true.
 * 2. Create the auth user via Supabase Auth admin API (password managed by
 *    Supabase — never stored in our tables).
 * 3. Insert the matching `profiles` row with id = auth user id, role = "user".
 */
export async function POST(req: Request) {
  const res = await requireAdmin();
  if ("error" in res) return res.error;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Body tidak valid");
  }

  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Data user tidak valid");
  }

  const email = parsed.data.email.trim().toLowerCase();

  const existing = await db.profile.findUnique({ where: { email } });
  if (existing) return jsonError("Email sudah digunakan");

  // Enforce active-user cap before creating an active user.
  if (parsed.data.isActive) {
    const activeCount = await db.profile.count({
      where: { role: "user", isActive: true },
    });
    if (activeCount >= MAX_ACTIVE_USERS) {
      return jsonError("Batas user aktif telah tercapai.", 409);
    }
  }

  // Create the auth user in Supabase. email_confirm:true so the user can sign
  // in immediately without email verification.
  const admin = createSupabaseAdmin();
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password: parsed.data.password,
    email_confirm: true,
  });
  if (authError || !authData.user) {
    return jsonError(authError?.message ?? "Gagal membuat akun auth", 400);
  }

  const userId = authData.user.id;
  try {
    const created = await db.profile.create({
      data: {
        id: userId,
        email,
        fullName: parsed.data.fullName,
        role: "user", // admin can only create regular users, never an admin
        isActive: parsed.data.isActive,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
    return NextResponse.json(serialize(created), { status: 201 });
  } catch (e) {
    // Roll back the auth user if the profile insert failed.
    await admin.auth.admin.deleteUser(userId);
    const msg = e instanceof Error ? e.message : "Gagal membuat profile";
    return jsonError(msg, 500);
  }
}
