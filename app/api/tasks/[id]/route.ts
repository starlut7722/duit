import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser, jsonError } from "@/lib/auth-guard";
import { taskSchema } from "@/lib/validators";
import { combineDateAndTime } from "@/lib/format";

type Params = { params: { id: string } };

async function getOwnedTask(id: string, userId: string) {
  const task = await db.task.findUnique({ where: { id } });
  if (!task) return null;
  // RLS-equivalent: a user can only touch their own task.
  if (task.userId !== userId) return "forbidden" as const;
  return task;
}

/** PATCH /api/tasks/[id] — update a task (owned). */
export async function PATCH(req: Request, { params }: Params) {
  const res = await requireUser();
  if ("error" in res) return res.error;

  const owned = await getOwnedTask(params.id, res.user.id);
  if (owned === null) return jsonError("Tugas tidak ditemukan", 404);
  if (owned === "forbidden") return jsonError("Akses ditolak", 403);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Body tidak valid");
  }

  // Validate the partial payload. We accept the full schema but all fields
  // are optional via partial.
  const parsed = taskSchema.partial().safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Data tugas tidak valid");
  }

  const data: Record<string, unknown> = {};

  // System-only field used by the reminder scheduler to avoid duplicate
  // notifications. Never exposed in the task form.
  if (typeof (body as { notifiedAt?: unknown }).notifiedAt !== "undefined") {
    const v = (body as { notifiedAt: unknown }).notifiedAt;
    data.notifiedAt = v === null ? null : new Date();
  }

  if (parsed.data.title !== undefined) data.title = parsed.data.title;
  if (parsed.data.subject !== undefined) data.subject = parsed.data.subject;
  if (parsed.data.notes !== undefined) data.notes = parsed.data.notes;
  if (parsed.data.priority !== undefined) data.priority = parsed.data.priority;
  if (parsed.data.status !== undefined) data.status = parsed.data.status;
  if (parsed.data.reminderMinutes !== undefined)
    data.reminderMinutes = parsed.data.reminderMinutes ?? null;
  if (parsed.data.deadlineTime !== undefined)
    data.deadlineTime = parsed.data.deadlineTime;
  if (parsed.data.deadlineDate !== undefined) {
    const dd = combineDateAndTime(
      parsed.data.deadlineDate,
      parsed.data.deadlineTime ?? owned.deadlineTime
    );
    if (isNaN(dd.getTime())) return jsonError("Tanggal deadline tidak valid");
    data.deadlineDate = dd;
  }

  const updated = await db.task.update({ where: { id: params.id }, data });
  return NextResponse.json(updated);
}

/** DELETE /api/tasks/[id] — delete a task (owned). */
export async function DELETE(_req: Request, { params }: Params) {
  const res = await requireUser();
  if ("error" in res) return res.error;

  const owned = await getOwnedTask(params.id, res.user.id);
  if (owned === null) return jsonError("Tugas tidak ditemukan", 404);
  if (owned === "forbidden") return jsonError("Akses ditolak", 403);

  await db.task.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
