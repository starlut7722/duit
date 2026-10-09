import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser, jsonError } from "@/lib/auth-guard";
import { savingsGoalSchema, adjustSavingsSchema } from "@/lib/validators";
import { combineDateAndTime } from "@/lib/format";

type Params = { params: { id: string } };

async function getOwnedGoal(id: string, userId: string) {
  const goal = await db.savingsGoal.findUnique({ where: { id } });
  if (!goal) return null;
  if (goal.userId !== userId) return "forbidden" as const;
  return goal;
}

/** PATCH /api/savings-goals/[id]
 *  - body.type === "adjust": add/subtract funds (amount can be negative)
 *  - otherwise: update fields (title, targetAmount, deadline, notes)
 */
export async function PATCH(req: Request, { params }: Params) {
  const res = await requireUser();
  if ("error" in res) return res.error;

  const owned = await getOwnedGoal(params.id, res.user.id);
  if (owned === null) return jsonError("Target tidak ditemukan", 404);
  if (owned === "forbidden") return jsonError("Akses ditolak", 403);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Body tidak valid");
  }

  const b = body as { type?: string; amount?: number } & Record<string, unknown>;

  // --- Add / withdraw funds ---
  if (b.type === "adjust") {
    const parsed = adjustSavingsSchema.safeParse({ amount: b.amount });
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Nominal tidak valid");
    }
    const next = owned.currentAmount + parsed.data.amount;
    if (next < 0) {
      return jsonError("Dana tidak boleh kurang dari 0");
    }
    const updated = await db.savingsGoal.update({
      where: { id: params.id },
      data: { currentAmount: next },
    });
    return NextResponse.json(updated);
  }

  // --- Edit fields ---
  const parsed = savingsGoalSchema.partial().safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Data target tidak valid");
  }

  const data: Record<string, unknown> = {};
  if (parsed.data.title !== undefined) data.title = parsed.data.title;
  if (parsed.data.targetAmount !== undefined)
    data.targetAmount = parsed.data.targetAmount;
  if (parsed.data.notes !== undefined) data.notes = parsed.data.notes;
  if (parsed.data.currentAmount !== undefined)
    data.currentAmount = Math.max(0, parsed.data.currentAmount);
  if (parsed.data.deadline !== undefined) {
    if (parsed.data.deadline === null || parsed.data.deadline === "") {
      data.deadline = null;
    } else {
      const d = combineDateAndTime(parsed.data.deadline, "23:59");
      if (isNaN(d.getTime())) return jsonError("Deadline tidak valid");
      data.deadline = d;
    }
  }

  const updated = await db.savingsGoal.update({
    where: { id: params.id },
    data,
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: Params) {
  const res = await requireUser();
  if ("error" in res) return res.error;

  const owned = await getOwnedGoal(params.id, res.user.id);
  if (owned === null) return jsonError("Target tidak ditemukan", 404);
  if (owned === "forbidden") return jsonError("Akses ditolak", 403);

  await db.savingsGoal.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
