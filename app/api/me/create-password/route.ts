import { NextResponse } from "next/server";
import { requireUser, jsonError } from "@/lib/auth-guard";
import { createSupabaseServer } from "@/lib/supabase/server";
import { z } from "zod";

const bodySchema = z
  .object({
    newPassword: z.string().min(6, "Password baru minimal 6 karakter"),
    confirmPassword: z.string().min(1, "Konfirmasi password harus diisi"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Konfirmasi password tidak cocok",
    path: ["confirmPassword"],
  });

/**
 * POST /api/me/create-password
 *
 * For Google-only accounts (no password yet): lets the signed-in user create
 * one so the account can also be used with email + password. Delegates to
 * Supabase Auth `auth.updateUser({ password })`.
 *
 * Auth: requires a valid session (requireUser). Unlike "change password", no
 * current password is needed because the user is already authenticated.
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

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Data tidak valid");
  }

  const supabase = await createSupabaseServer();
  const { error: updError } = await supabase.auth.updateUser({
    password: parsed.data.newPassword,
  });
  if (updError) {
    return jsonError(updError.message || "Gagal membuat password");
  }

  return NextResponse.json({ ok: true });
}
