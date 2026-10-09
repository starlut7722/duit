import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guard";
import { MAX_ACTIVE_USERS } from "@/lib/config";

/** GET /api/admin/stats — counts for the admin dashboard. */
export async function GET() {
  const res = await requireAdmin();
  if ("error" in res) return res.error;

  // Only role === "user" counts toward the active-user limit. Admins excluded.
  const [totalUsers, activeUsers, admins] = await Promise.all([
    db.profile.count({ where: { role: "user" } }),
    db.profile.count({ where: { role: "user", isActive: true } }),
    db.profile.count({ where: { role: "admin" } }),
  ]);

  return NextResponse.json({
    totalUsers,
    activeUsers,
    inactiveUsers: totalUsers - activeUsers,
    admins,
    maxActiveUsers: MAX_ACTIVE_USERS,
  });
}
