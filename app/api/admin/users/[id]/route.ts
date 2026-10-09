import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin, jsonError } from "@/lib/auth-guard";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { updateUserSchema } from "@/lib/validators";
import { MAX_ACTIVE_USERS } from "@/lib/config";

type Params = { params: { id: string } };

/**
 * PATCH /api/admin/users/[id]
 *  - activate / deactivate (enforces MAX_ACTIVE_USERS on activate)
 *  - edit full name
 *  - reset password (via Supabase Auth admin API)
 *  Admins can never be deactivated or have their role changed via this route.
 */
export async function PATCH(req: Request, { params }: Params) {
  const res = await requireAdmin();
  if ("error" in res) return res.error;

  const target = await db.profile.findUnique({ where: { id: params.id } });
  if (!target) return jsonError("User tidak ditemukan", 404);

  // Protect admin accounts from administrative mutations.
  if (target.role === "admin") {
    return jsonError(
      "Akun admin tidak dapat diubah melalui pengelolaan user biasa.",
      403
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Body tidak valid");
  }

  const parsed = updateUserSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Data tidak valid");
  }

  const data: Record<string, unknown> = {};

  if (parsed.data.fullName !== undefined) data.fullName = parsed.data.fullName;

  // Role escalation is blocked: admin can only keep role === "user".
  if (parsed.data.role !== undefined && parsed.data.role !== "user") {
    return jsonError("Role tidak valid", 400);
  }

  if (parsed.data.isActive !== undefined) {
    if (parsed.data.isActive && !target.isActive) {
      const activeCount = await db.profile.count({
        where: { role: "user", isActive: true },
      });
      if (activeCount >= MAX_ACTIVE_USERS) {
        return jsonError("Batas user aktif telah tercapai.", 409);
      }
    }
    data.isActive = parsed.data.isActive;
  }

  // Reset password via Supabase Auth admin API.
  if (parsed.data.resetPassword !== undefined) {
    const admin = createSupabaseAdmin();
    const { error: pwdError } = await admin.auth.admin.updateUserById(
      params.id,
      { password: parsed.data.resetPassword }
    );
    if (pwdError) {
      return jsonError(pwdError.message || "Gagal reset password", 400);
    }
  }

  const updated = await db.profile.update({
    where: { id: params.id },
    data,
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });
  return NextResponse.json(updated);
}

/**
 * DELETE /api/admin/users/[id]
 *  - Cannot delete admin accounts.
 *  - Deletes the auth user (Supabase) AND the profile row.
 */
export async function DELETE(req: Request, { params }: Params) {
  const res = await requireAdmin();
  if ("error" in res) return res.error;

  const target = await db.profile.findUnique({ where: { id: params.id } });
  if (!target) return jsonError("User tidak ditemukan", 404);

  if (target.role === "admin") {
    return jsonError("Akun admin tidak dapat dihapus.", 403);
  }
  if (target.id === res.user.id) {
    return jsonError("Tidak dapat menghapus akun sendiri.", 403);
  }

  // Delete the auth user first; then the profile (FK cascade would also handle
  // it, but we do it explicitly for clarity).
  const admin = createSupabaseAdmin();
  const { error: delError } = await admin.auth.admin.deleteUser(params.id);
  if (delError) {
    return jsonError(delError.message || "Gagal menghapus akun auth", 400);
  }

  await db.profile.delete({ where: { id: params.id } }).catch(() => {});
  return NextResponse.json({ ok: true });
}
